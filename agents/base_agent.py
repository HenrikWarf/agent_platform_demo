"""
Base Agent Abstract Class for Google Cloud Agent Platform
Integrates OpenTelemetry tracing, Model Armor safety inspection, and Skills loading.
"""
from typing import Dict, Any, List, Optional
import os
import json
import logging
from .a2a_protocol import A2AMessage, A2AMessageType, A2ARouter

try:
    from opentelemetry import trace
    tracer = trace.get_tracer("google.adk.agent")
except ImportError:
    tracer = None

logger = logging.getLogger("base_agent")

class BaseAgent:
    def __init__(
        self,
        agent_id: str,
        name: str,
        role_description: str,
        skills: Optional[List[str]] = None
    ):
        self.agent_id = agent_id
        self.name = name
        self.role_description = role_description
        self.skills: List[str] = skills or []
        self.active_skill_contents: Dict[str, str] = {}
        self._load_skills()
        self.router.register_agent(self.agent_id, self)

    @property
    def router(self):
        r = A2ARouter()
        r.register_agent(self.agent_id, self)
        return r

    def _load_skills(self):
        """Loads SKILL.md contents from the local skills directory if available."""
        skills_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "skills"))
        for skill_name in self.skills:
            # Look for folder matching skill_name
            skill_path = os.path.join(skills_dir, skill_name, "SKILL.md")
            if os.path.exists(skill_path):
                try:
                    with open(skill_path, "r", encoding="utf-8") as f:
                        self.active_skill_contents[skill_name] = f.read()
                    logger.info(f"Agent '{self.agent_id}' loaded skill '{skill_name}'")
                except Exception as e:
                    logger.warning(f"Could not load skill {skill_name}: {e}")

    def inspect_model_armor(self, text: str) -> Dict[str, Any]:
        """
        Simulates Vertex AI Model Armor prompt/response inspection.
        Detects prompt injection attempts, toxic keywords, or PII leaks.
        """
        lower = text.lower()
        forbidden = ["ignore previous instructions", "bypass safety", "drop database", "<script>"]
        is_safe = not any(pattern in lower for pattern in forbidden)
        
        return {
            "passed": is_safe,
            "filter_reason": "Prompt Injection Detected" if not is_safe else "Clean",
            "sanitized_text": text if is_safe else "[REDACTED BY MODEL ARMOR: UNSAFE INPUT]"
        }

    def send_a2a(self, receiver_id: str, intent: str, payload: Dict[str, Any], skill_used: Optional[str] = None) -> A2AMessage:
        if tracer:
            with tracer.start_as_current_span(f"a2a_message:{self.agent_id}->{receiver_id}") as span:
                span.set_attribute("a2a.sender_id", self.agent_id)
                span.set_attribute("a2a.receiver_id", receiver_id)
                span.set_attribute("a2a.intent", intent)
                if skill_used:
                    span.set_attribute("a2a.skill_used", skill_used)
                msg = A2AMessage(
                    sender_id=self.agent_id,
                    receiver_id=receiver_id,
                    message_type=A2AMessageType.REQUEST,
                    intent=intent,
                    payload=payload,
                    skill_used=skill_used
                )
                return self.router.route_message(msg)
        else:
            msg = A2AMessage(
                sender_id=self.agent_id,
                receiver_id=receiver_id,
                message_type=A2AMessageType.REQUEST,
                intent=intent,
                payload=payload,
                skill_used=skill_used
            )
            return self.router.route_message(msg)

    def handle_a2a_message(self, message: A2AMessage) -> A2AMessage:
        """Override in subclasses to handle incoming A2A requests."""
        raise NotImplementedError

    def _init_telemetry(self):
        """Initializes OpenTelemetry CloudTraceSpanExporter for GCP Agent Engine observability."""
        try:
            from opentelemetry import trace
            from opentelemetry.sdk.trace import TracerProvider
            from opentelemetry.sdk.trace.export import BatchSpanProcessor
            from opentelemetry_exporter_gcp_trace import CloudTraceSpanExporter

            project_id = os.environ.get("GCP_PROJECT_ID", "agent-demo-09")
            provider = trace.get_tracer_provider()
            if not isinstance(provider, TracerProvider):
                provider = TracerProvider()
                trace.set_tracer_provider(provider)
            
            exporter = CloudTraceSpanExporter(project_id=project_id)
            provider.add_span_processor(BatchSpanProcessor(exporter))
            logger.info(f"OpenTelemetry CloudTraceSpanExporter initialized inside Agent Engine instance for project '{project_id}'")
        except Exception as e:
            logger.warning(f"Could not initialize OpenTelemetry CloudTraceSpanExporter inside Agent Engine: {e}")

    def set_up(self) -> None:
        """Vertex AI Reasoning Engine lifecycle initialization hook."""
        self._load_skills()
        self._init_telemetry()

    def query(self, input_text: str = "", **kwargs) -> Dict[str, Any]:
        """Vertex AI Agent Engine (Reasoning Engine) standard entrypoint interface."""
        if tracer:
            with tracer.start_as_current_span(f"invoke_agent:{self.agent_id}") as span:
                span.set_attribute("agent.id", self.agent_id)
                span.set_attribute("agent.name", self.name)
                span.set_attribute("input.prompt", input_text)
                intent = kwargs.get("intent", "DEFAULT_QUERY")
                msg = A2AMessage(
                    sender_id="agent_engine_client",
                    receiver_id=self.agent_id,
                    message_type=A2AMessageType.REQUEST,
                    intent=intent,
                    payload={"prompt": input_text, **kwargs}
                )
                res = self.handle_a2a_message(msg)
                return res.payload if res else {}
        else:
            intent = kwargs.get("intent", "DEFAULT_QUERY")
            msg = A2AMessage(
                sender_id="agent_engine_client",
                receiver_id=self.agent_id,
                message_type=A2AMessageType.REQUEST,
                intent=intent,
                payload={"prompt": input_text, **kwargs}
            )
            res = self.handle_a2a_message(msg)
            return res.payload if res else {}

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "role": self.role_description,
            "skills": self.skills,
            "skill_details": list(self.active_skill_contents.keys())
        }
