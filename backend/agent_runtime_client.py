"""
Agent Runtime Client — Proxies requests to the deployed ADK Agent on Vertex AI Agent Runtime.

Instead of running agents locally, the Cloud Run backend delegates all agent
orchestration to the Agent Runtime instance deployed via `agents-cli deploy`.
This keeps the backend as a thin API layer handling safety, BigQuery data browsing,
and skill registry — while the actual multi-agent workflow runs on managed infrastructure.

Uses the Agent Engine `/api` passthrough to call the container's `/run_sse` endpoint
(ADK streaming API). Traffic routes through Agent Gateway when bound.
"""
import os
import json
import logging
import uuid
from typing import Dict, Any, Optional

import requests
import google.auth
import google.auth.transport.requests

logger = logging.getLogger("agent_runtime_client")

try:
    from .config import Config
except ImportError:
    from backend.config import Config


class AgentRuntimeClient:
    """Client for calling the deployed ADK Agent on Vertex AI Agent Runtime.

    Uses the Agent Engine `/api` HTTP passthrough to send SSE streaming requests
    to the container's `/run_sse` endpoint. This is the recommended calling
    pattern for scaffolded ADK agents (v1.3.1+).

    Traffic flow when Agent Gateway is bound:
      Client → API passthrough → Agent Gateway (governance) → Container (/run_sse)
    """

    def __init__(self):
        self._credentials = None
        self.runtime_id = Config.AGENT_RUNTIME_ID
        if not self.runtime_id:
            self.runtime_id = self._read_deployment_metadata()

        # Build the /api passthrough base URL from the runtime ID
        self._base_url = self._build_passthrough_url()

    def _read_deployment_metadata(self) -> Optional[str]:
        """Read runtime ID from deployment_metadata.json if it exists."""
        metadata_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "deployment_metadata.json")
        )
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                runtime_id = data.get("remote_agent_runtime_id", "")
                if runtime_id:
                    logger.info(f"Loaded Agent Runtime ID from deployment_metadata.json: {runtime_id}")
                    return runtime_id
            except Exception as e:
                logger.warning(f"Failed to read deployment_metadata.json: {e}")
        return None

    def _build_passthrough_url(self) -> Optional[str]:
        """Build the Agent Engine /api passthrough URL from the runtime resource ID.

        The /api passthrough exposes the container's full HTTP surface:
          https://{location}-aiplatform.googleapis.com/reasoningEngines/v1/{resource}/api/...

        This lets us call /run_sse, /apps/..., /a2a/... endpoints directly.
        """
        if not self.runtime_id:
            return None
        # runtime_id format: projects/{number}/locations/{location}/reasoningEngines/{id}
        parts = self.runtime_id.split("/")
        if len(parts) >= 6:
            location = parts[3]  # e.g. "us-central1"
            return f"https://{location}-aiplatform.googleapis.com/reasoningEngines/v1/{self.runtime_id}/api"
        return None

    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authenticated headers using Google Cloud default credentials."""
        if self._credentials is None:
            self._credentials, _ = google.auth.default()

        auth_req = google.auth.transport.requests.Request()
        self._credentials.refresh(auth_req)
        return {
            "Authorization": f"Bearer {self._credentials.token}",
            "Content-Type": "application/json",
        }

    def _create_session(self, user_id: str) -> str:
        """Create a new ADK session via the /api passthrough."""
        url = f"{self._base_url}/apps/app/users/{user_id}/sessions"
        resp = requests.post(url, headers=self._get_auth_headers(), json={}, timeout=30)
        resp.raise_for_status()
        session_id = resp.json().get("id", "")
        logger.info(f"Created session {session_id} for user {user_id}")
        return session_id

    def query(self, prompt: str, target_segment: str = "At-Risk Premium") -> Dict[str, Any]:
        """Send a prompt to Agent Runtime via /run_sse and return structured results.

        Creates a session, sends the message via SSE streaming, collects all events,
        and formats them into the response structure the frontend expects.

        Args:
            prompt: The user's marketing prompt.
            target_segment: Customer segment to target.

        Returns:
            Dict with status, summary, analytics, strategy, content, and a2a_trace.
        """
        if not self._base_url:
            return {
                "status": "ERROR",
                "summary": "Agent Runtime is not configured. Deploy the agent first with 'agents-cli deploy'.",
                "analytics": {},
                "strategy": {},
                "content": {},
                "a2a_trace": [],
            }

        try:
            user_id = f"backend-{uuid.uuid4().hex[:8]}"
            session_id = self._create_session(user_id)

            # Combine prompt with segment context
            full_message = f"{prompt}\n\nTarget customer segment: {target_segment}"

            # Call /run_sse via the /api passthrough
            sse_url = f"{self._base_url}/run_sse"
            resp = requests.post(
                sse_url,
                headers=self._get_auth_headers(),
                json={
                    "app_name": "app",
                    "user_id": user_id,
                    "session_id": session_id,
                    "new_message": {
                        "role": "user",
                        "parts": [{"text": full_message}],
                    },
                },
                stream=True,
                timeout=(30, 300),  # 30s connect, 300s read — full campaigns chain 3 agents
            )
            resp.raise_for_status()

            # Collect SSE events
            events = []
            for line in resp.iter_lines(decode_unicode=True):
                if line and line.startswith("data:"):
                    try:
                        event = json.loads(line[5:].strip())
                        events.append(event)
                    except json.JSONDecodeError:
                        continue

            return self._format_response(events, prompt, target_segment)

        except Exception as e:
            logger.error(f"Agent Runtime query failed: {e}")
            return {
                "status": "ERROR",
                "summary": f"Agent Runtime query failed: {str(e)}",
                "analytics": {},
                "strategy": {},
                "content": {},
                "a2a_trace": [],
            }

    def _format_response(
        self, events: list, prompt: str, target_segment: str
    ) -> Dict[str, Any]:
        """Format ADK SSE events into the frontend response structure.

        Extracts the final agent text response and any tool call results
        (analytics, strategy, content) from the event stream.
        """
        summary_parts = []
        analytics = {}
        strategy = {}
        content = {}
        a2a_trace = []
        sql_executed = ""
        seen_agents = []

        for event in events:
            # SSE events have a nested content structure
            event_content = event.get("content", {})

            # Extract text content
            text = self._extract_text(event_content)
            if text:
                summary_parts.append(text)

            # Extract tool results (analytics, strategy, content)
            tool_results = self._extract_tool_results(event_content)
            tool_name = self._extract_tool_name(event_content)
            if tool_results:
                if "cohort_details" in tool_results or "sql_executed" in tool_results or "results" in tool_results:
                    analytics = tool_results
                    sql_executed = tool_results.get("sql_executed", sql_executed)
                elif "strategy" in tool_results:
                    strategy = tool_results.get("strategy", {})
                elif "generated_assets" in tool_results:
                    content = tool_results

            # Track agent sequence for A2A trace
            author = event_content.get("author", event.get("author", ""))
            if author and (not seen_agents or seen_agents[-1] != author):
                seen_agents.append(author)

        # Build A2A trace as sender→receiver pairs from the agent sequence
        # Also infer the skill used based on the agent name
        skill_map = {
            "analytics_agent": "bigquery_customer_analytics",
            "strategy_agent": "omnichannel_strategy",
            "content_agent": "brand_voice",
        }
        intent = "ANALYTICS_ONLY"
        if any("strategy" in a for a in seen_agents):
            intent = "STRATEGY_ONLY"
        if any("content" in a for a in seen_agents):
            intent = "FULL_CAMPAIGN"

        for i in range(len(seen_agents) - 1):
            sender = seen_agents[i]
            receiver = seen_agents[i + 1]
            a2a_trace.append({
                "sender_id": sender,
                "receiver_id": receiver,
                "intent": intent,
                "skill_used": skill_map.get(receiver, ""),
            })

        return {
            "status": "SUCCESS",
            "summary": "\n".join(summary_parts) if summary_parts else "Agent completed processing.",
            "analytics": analytics,
            "strategy": strategy,
            "content": content,
            "sql_executed": sql_executed,
            "a2a_trace": a2a_trace,
            "intent": intent,
            "target_segment": target_segment,
        }

    @staticmethod
    def _extract_text(content: dict) -> Optional[str]:
        """Extract text content from an ADK SSE event content block."""
        if isinstance(content, dict):
            parts = content.get("parts", [])
            for part in parts:
                if isinstance(part, dict) and "text" in part:
                    return part["text"]
        return None

    @staticmethod
    def _extract_tool_results(content: dict) -> Optional[Dict[str, Any]]:
        """Extract tool call results from an ADK SSE event content block."""
        if isinstance(content, dict):
            parts = content.get("parts", [])
            for part in parts:
                if isinstance(part, dict) and "functionResponse" in part:
                    response = part["functionResponse"]
                    if isinstance(response, dict):
                        return response.get("response", response)
                # Also check camelCase variant
                if isinstance(part, dict) and "function_response" in part:
                    response = part["function_response"]
                    if isinstance(response, dict):
                        return response.get("response", response)
        return None

    @staticmethod
    def _extract_tool_name(content: dict) -> Optional[str]:
        """Extract the tool/function name from an ADK SSE event content block."""
        if isinstance(content, dict):
            parts = content.get("parts", [])
            for part in parts:
                if isinstance(part, dict):
                    fc = part.get("functionCall") or part.get("function_call")
                    if fc and isinstance(fc, dict):
                        return fc.get("name", "")
                    fr = part.get("functionResponse") or part.get("function_response")
                    if fr and isinstance(fr, dict):
                        return fr.get("name", "")
        return None

    @property
    def is_configured(self) -> bool:
        """Check if Agent Runtime is configured."""
        return bool(self.runtime_id)

    def get_agent_metadata(self) -> list:
        """Return static agent metadata for the /api/agents endpoint."""
        return [
            {
                "agent_id": "marketing_orchestrator",
                "name": "Marketing Campaign Orchestrator",
                "type": "orchestrator",
                "description": "Routes objectives to Analytics, Strategy, and Content agents.",
                "skills": [],
                "sub_agents": ["analytics_agent", "strategy_agent", "content_agent"],
                "runtime": "agent_runtime" if self.is_configured else "not_deployed",
            },
            {
                "agent_id": "analytics_agent",
                "name": "Customer Insights & Analytics Agent",
                "type": "specialist",
                "description": "Executes BigQuery customer data analysis, cohort extraction, and RFM segmentation.",
                "skills": ["bigquery-customer-analytics"],
                "sub_agents": [],
                "runtime": "agent_runtime" if self.is_configured else "not_deployed",
            },
            {
                "agent_id": "strategy_agent",
                "name": "Omnichannel Strategy Agent",
                "type": "specialist",
                "description": "Designs campaign frameworks, channel mix, and ROI projections.",
                "skills": ["omnichannel-strategy"],
                "sub_agents": [],
                "runtime": "agent_runtime" if self.is_configured else "not_deployed",
            },
            {
                "agent_id": "content_agent",
                "name": "Brand Voice Content Agent",
                "type": "specialist",
                "description": "Drafts email templates, social media posts, SMS, and ad copy.",
                "skills": ["brand-voice"],
                "sub_agents": [],
                "runtime": "agent_runtime" if self.is_configured else "not_deployed",
            },
        ]
