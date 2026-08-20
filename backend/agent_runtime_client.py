"""
Agent Runtime Client — Proxies requests to the deployed ADK Agent on Vertex AI Agent Runtime.

Instead of running agents locally, the Cloud Run backend delegates all agent
orchestration to the Agent Runtime instance deployed via `agents-cli deploy`.
This keeps the backend as a thin API layer handling safety, BigQuery data browsing,
and skill registry — while the actual multi-agent workflow runs on managed infrastructure.

Uses the Agent Engine `/api` passthrough to call the container's `/run_sse` endpoint
(ADK streaming API). Traffic routes through Agent Gateway when bound.
"""
import json
import logging
import os
import uuid
from typing import Any

import google.auth
import google.auth.transport.requests
import requests

logger = logging.getLogger("agent_runtime_client")

try:
    from .config import Config
except ImportError:
    from backend.config import Config


class AgentRuntimeClient:
    """Client for calling the deployed ADK Agent on Vertex AI Agent Runtime.

    Uses a hybrid URL approach:
    - /api passthrough for session management (not governed by gateway)
    - :streamQuery for agent queries (governed by Agent Gateway + Model Armor)

    Traffic flow for prompts:
      Client → :streamQuery → Agent Gateway (Model Armor screening) → Container
    """

    def __init__(self):
        self._credentials = None
        self._governed_url = None  # :streamQuery/:query governed endpoint
        self.runtime_id = Config.AGENT_RUNTIME_ID
        if not self.runtime_id:
            self.runtime_id = self._read_deployment_metadata()

        # Build URLs: _base_url for /api passthrough, _governed_url for :streamQuery
        self._base_url = self._build_passthrough_url()

    def _read_deployment_metadata(self) -> str | None:
        """Read runtime ID from deployment_metadata.json if it exists."""
        metadata_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "deployment_metadata.json")
        )
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, encoding="utf-8") as f:
                    data = json.load(f)
                runtime_id = data.get("remote_agent_runtime_id", "")
                if runtime_id:
                    logger.info(f"Loaded Agent Runtime ID from deployment_metadata.json: {runtime_id}")
                    return runtime_id
            except Exception as e:
                logger.warning(f"Failed to read deployment_metadata.json: {e}")
        return None

    def _build_passthrough_url(self) -> str | None:
        """Build the Agent Engine base URLs from the runtime resource ID.

        Two URL patterns are used:
        - _base_url: :streamQuery / :query governed endpoints (Agent Gateway + Model Armor)
        - _passthrough_url: /api passthrough for session management (not governed)

        Agent Gateway only screens query/streamQuery methods, so session
        management uses the /api passthrough while actual prompts use :streamQuery.
        """
        if not self.runtime_id:
            return None
        # runtime_id format: projects/{number}/locations/{location}/reasoningEngines/{id}
        parts = self.runtime_id.split("/")
        if len(parts) >= 6:
            location = parts[3]  # e.g. "us-central1"
            # Governed endpoint for :streamQuery
            self._governed_url = f"https://{location}-aiplatform.googleapis.com/v1beta1/{self.runtime_id}"
            # /api passthrough for session management
            return f"https://{location}-aiplatform.googleapis.com/reasoningEngines/v1/{self.runtime_id}/api"
        return None

    def _get_auth_headers(self) -> dict[str, str]:
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
        """Create a new ADK session via the /api passthrough.

        Session management doesn't need Agent Gateway governance —
        only actual prompts need Model Armor screening.
        """
        url = f"{self._base_url}/apps/app/users/{user_id}/sessions"
        resp = requests.post(url, headers=self._get_auth_headers(), json={}, timeout=30)
        resp.raise_for_status()
        session_id = resp.json().get("id", "")
        logger.info(f"Created session {session_id} for user {user_id}")
        return session_id

    def query(self, prompt: str, target_segment: str = "At-Risk Premium") -> dict[str, Any]:
        """Send a prompt to Agent Runtime via :streamQuery and return structured results.

        Uses the governed :streamQuery endpoint which flows through Agent Gateway
        and Model Armor for security screening and observability logging.

        Args:
            prompt: The user's marketing prompt.
            target_segment: Customer segment to target.

        Returns:
            Dict with status, summary, analytics, strategy, content, and a2a_trace.
        """
        if not self._governed_url:
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

            # Create session via /api passthrough (not governed by gateway)
            session_id = self._create_session(user_id)

            # Send prompt directly to ADK agent without injected segment prefix/suffix
            full_message = prompt

            # Call :streamQuery — governed by Agent Gateway + Model Armor
            stream_url = f"{self._governed_url}:streamQuery"
            resp = requests.post(
                stream_url,
                headers=self._get_auth_headers(),
                json={
                    "class_method": "stream_query",
                    "input": {
                        "message": full_message,
                        "user_id": user_id,
                        "session_id": session_id,
                    },
                },
                stream=True,
                timeout=(30, 300),  # 30s connect, 300s read
            )
            resp.raise_for_status()

            # Collect streaming response chunks
            events = []
            for line in resp.iter_lines(decode_unicode=True):
                if not line:
                    continue
                # streamQuery returns JSON chunks (one per line)
                # or SSE-style data: prefixed lines
                text_line = line.strip()
                if text_line.startswith("data:"):
                    text_line = text_line[5:].strip()
                if text_line:
                    try:
                        event = json.loads(text_line)
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
    ) -> dict[str, Any]:
        """Format ADK SSE events into the frontend response structure.

        Extracts the final agent text response and any structured data from:
        - Tool functionResponse events (analytics from query_customer_data)
        - Text events from formatter agents with output_schema (strategy, content)
        """
        analytics = {}
        strategy = {}
        content = {}
        a2a_trace = []
        sql_executed = ""
        seen_agents = []
        last_text = ""

        for event in events:
            # SSE events have a nested content structure
            event_content = event.get("content", {})

            # Track author
            author = event.get("author", "")

            # Extract text content
            text = self._extract_text(event_content)
            if text:
                # Check if this is a formatter agent emitting structured JSON
                if author in ("strategy_formatter", "strategy_agent") and not strategy:
                    parsed = self._try_parse_json(text)
                    if parsed and ("campaign_title" in parsed or "campaign_pillars" in parsed):
                        strategy = parsed
                        continue
                elif author in ("content_formatter", "content_agent") and not content:
                    parsed = self._try_parse_json(text)
                    if parsed and ("email_template" in parsed or "social_posts" in parsed):
                        content = {"generated_assets": parsed}
                        continue

                # Keep as summary text (orchestrator speaks last)
                last_text = text

            # Extract tool results (analytics from query_customer_data)
            tool_results = self._extract_tool_results(event_content)
            if tool_results:
                if "cohort_details" in tool_results or "sql_executed" in tool_results or "results" in tool_results:
                    analytics = tool_results
                    sql_executed = tool_results.get("sql_executed", sql_executed)
                elif "strategy" in tool_results and not strategy:
                    # Legacy: tool-based strategy (backward compat)
                    strategy = tool_results.get("strategy", {})
                elif "generated_assets" in tool_results and not content:
                    # Legacy: tool-based content (backward compat)
                    content = tool_results

            # Track agent sequence for A2A trace
            transfer_to = event.get("actions", {}).get("transferToAgent", "")
            if author and (not seen_agents or seen_agents[-1] != author):
                seen_agents.append(author)
            if transfer_to and (not seen_agents or seen_agents[-1] != transfer_to):
                seen_agents.append(transfer_to)

        # If strategy/content weren't found from specific authors, try parsing from any text
        if not strategy or not content:
            for event in events:
                text = self._extract_text(event.get("content", {}))
                if text:
                    parsed = self._try_parse_json(text)
                    if parsed:
                        if not strategy and ("campaign_title" in parsed or "campaign_pillars" in parsed):
                            strategy = parsed
                        elif not content and ("email_template" in parsed or "social_posts" in parsed):
                            content = {"generated_assets": parsed}

        # Build A2A trace as sender→receiver pairs
        # Filter out internal formatter agents from the trace display
        display_agents = [a for a in seen_agents if "formatter" not in a]
        skill_map = {
            "analytics_agent": "bigquery_customer_analytics",
            "strategy_agent": "omnichannel_strategy",
            "strategy_pipeline": "omnichannel_strategy",
            "content_agent": "brand_voice",
            "content_pipeline": "brand_voice",
        }
        intent = "ANALYTICS_ONLY"
        if any("strategy" in a for a in seen_agents):
            intent = "STRATEGY_ONLY"
        if any("content" in a for a in seen_agents):
            intent = "FULL_CAMPAIGN"

        for i in range(len(display_agents) - 1):
            sender = display_agents[i]
            receiver = display_agents[i + 1]
            a2a_trace.append({
                "sender_id": sender,
                "receiver_id": receiver,
                "intent": intent,
                "skill_used": skill_map.get(receiver, ""),
            })

        # Use the last text event as summary (orchestrator always speaks last)
        summary = last_text or "Agent completed processing."

        return {
            "status": "SUCCESS",
            "summary": summary,
            "analytics": analytics,
            "strategy": strategy,
            "content": content,
            "sql_executed": sql_executed,
            "a2a_trace": a2a_trace,
            "intent": intent,
            "target_segment": target_segment,
        }

    @staticmethod
    def _extract_text(content: dict) -> str | None:
        """Extract text content from an ADK SSE event content block."""
        if isinstance(content, dict):
            parts = content.get("parts", [])
            for part in parts:
                if isinstance(part, dict) and "text" in part:
                    return part["text"]
        return None

    @staticmethod
    def _try_parse_json(text: str) -> dict[str, Any] | None:
        """Try to parse a text string as JSON. Returns None if parsing fails."""
        if not text or not text.strip():
            return None
        text = text.strip()
        # Handle markdown code fences around JSON
        if text.startswith("```"):
            lines = text.split("\n")
            # Remove first and last lines (```json and ```)
            lines = [line for line in lines if not line.strip().startswith("```")]
            text = "\n".join(lines).strip()
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                return parsed
        except (json.JSONDecodeError, ValueError):
            pass
        return None

    @staticmethod
    def _extract_tool_results(content: dict) -> dict[str, Any] | None:
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
    def _extract_tool_name(content: dict) -> str | None:
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
