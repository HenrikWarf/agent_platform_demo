"""
Agent Runtime Client — Proxies requests to the deployed ADK Agent on Vertex AI Agent Runtime.

Instead of running agents locally, the Cloud Run backend delegates all agent
orchestration to the Agent Runtime instance deployed via `agents-cli deploy`.
This keeps the backend as a thin API layer handling safety, BigQuery data browsing,
and skill registry — while the actual multi-agent workflow runs on managed infrastructure.
"""
import os
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("agent_runtime_client")

try:
    from .config import Config
except ImportError:
    from backend.config import Config


class AgentRuntimeClient:
    """Client for calling the deployed ADK Agent on Vertex AI Agent Runtime.

    Uses the `vertexai` SDK to send queries to the Reasoning Engine instance
    and collect streamed ADK events into a structured response dict that
    matches the format the frontend expects.
    """

    def __init__(self):
        self._engine = None
        self._client = None
        self.runtime_id = Config.AGENT_RUNTIME_ID
        if not self.runtime_id:
            # Try reading from deployment_metadata.json
            self.runtime_id = self._read_deployment_metadata()

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

    @property
    def engine(self):
        """Lazy-initialize the Vertex AI Agent Engine client."""
        if self._engine is None:
            if not self.runtime_id:
                raise RuntimeError(
                    "AGENT_RUNTIME_ID is not configured. "
                    "Deploy the agent first with 'agents-cli deploy' and set "
                    "AGENT_RUNTIME_ID in your environment or .env file."
                )
            try:
                import vertexai
                self._client = vertexai.Client(
                    project=Config.GCP_PROJECT_ID,
                    location=Config.GCP_REGION,
                )
                self._engine = self._client.agent_engines.get(name=self.runtime_id)
                logger.info(f"Connected to Agent Runtime: {self.runtime_id}")
            except Exception as e:
                logger.error(f"Failed to connect to Agent Runtime: {e}")
                raise RuntimeError(f"Agent Runtime connection failed: {e}")
        return self._engine

    def query(self, prompt: str, target_segment: str = "At-Risk Premium") -> Dict[str, Any]:
        """Send a prompt to Agent Runtime and return structured results.

        Calls the deployed ADK agent's :streamQuery endpoint, collects all events,
        and formats them into the response structure the frontend expects.

        Args:
            prompt: The user's marketing prompt.
            target_segment: Customer segment to target.

        Returns:
            Dict with status, summary, analytics, strategy, content, and a2a_trace.
        """
        if not self.runtime_id:
            return {
                "status": "ERROR",
                "summary": "Agent Runtime is not configured. Deploy the agent first with 'agents-cli deploy'.",
                "analytics": {},
                "strategy": {},
                "content": {},
                "a2a_trace": [],
            }

        try:
            # Combine prompt with segment context
            full_message = f"{prompt}\n\nTarget customer segment: {target_segment}"

            # Call Agent Runtime via streaming query
            events = []
            for event in self.engine.stream_query(
                message=full_message,
                user_id="backend-cloud-run",
            ):
                events.append(event)

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
        """Format ADK streaming events into the frontend response structure.

        Extracts the final agent text response and any tool call results
        (analytics, strategy, content) from the event stream.
        """
        summary_parts = []
        analytics = {}
        strategy = {}
        content = {}
        a2a_trace = []
        sql_executed = ""

        for event in events:
            event_dict = event if isinstance(event, dict) else getattr(event, "__dict__", {})

            # Extract text content from the event
            text = self._extract_text(event_dict)
            if text:
                summary_parts.append(text)

            # Extract tool results (analytics, strategy, content)
            tool_results = self._extract_tool_results(event_dict)
            if tool_results:
                if "cohort_details" in tool_results or "sql_executed" in tool_results:
                    analytics = tool_results
                    sql_executed = tool_results.get("sql_executed", sql_executed)
                elif "strategy" in tool_results:
                    strategy = tool_results.get("strategy", {})
                elif "generated_assets" in tool_results:
                    content = tool_results

            # Build A2A trace from events
            agent_name = self._extract_agent_name(event_dict)
            if agent_name:
                a2a_trace.append({
                    "agent": agent_name,
                    "type": "agent_event",
                })

        return {
            "status": "SUCCESS",
            "summary": "\n".join(summary_parts) if summary_parts else "Agent completed processing.",
            "analytics": analytics,
            "strategy": strategy,
            "content": content,
            "sql_executed": sql_executed,
            "a2a_trace": a2a_trace,
            "intent": "FULL_CAMPAIGN",
            "target_segment": target_segment,
        }

    @staticmethod
    def _extract_text(event_dict: dict) -> Optional[str]:
        """Extract text content from an ADK event."""
        # ADK events have nested content structures
        content = event_dict.get("content", {})
        if isinstance(content, dict):
            parts = content.get("parts", [])
            for part in parts:
                if isinstance(part, dict) and "text" in part:
                    return part["text"]
        # Direct text field
        if "text" in event_dict:
            return event_dict["text"]
        return None

    @staticmethod
    def _extract_tool_results(event_dict: dict) -> Optional[Dict[str, Any]]:
        """Extract tool call results from an ADK event."""
        content = event_dict.get("content", {})
        if isinstance(content, dict):
            parts = content.get("parts", [])
            for part in parts:
                if isinstance(part, dict) and "function_response" in part:
                    response = part["function_response"]
                    if isinstance(response, dict):
                        return response.get("response", response)
        return None

    @staticmethod
    def _extract_agent_name(event_dict: dict) -> Optional[str]:
        """Extract the agent name from an ADK event."""
        return event_dict.get("author", event_dict.get("agent_name"))

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
