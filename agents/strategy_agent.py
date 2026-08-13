"""
Marketing Strategy Agent (StrategyAgent)
Constructs omnichannel marketing strategy documents, campaign roadmaps, and channel allocation plans using the omnichannel_strategy skill.
"""
from typing import Dict, Any
import logging
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

try:
    from .base_agent import BaseAgent
    from .a2a_protocol import A2AMessage, A2AMessageType
except ImportError:
    from agents.base_agent import BaseAgent
    from agents.a2a_protocol import A2AMessage, A2AMessageType

logger = logging.getLogger("strategy_agent")

class StrategyAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="strategy_agent",
            name="Marketing Strategy Agent",
            role_description="Designs omnichannel marketing strategies, campaign timelines, channel mix, and ROI goals.",
            skills=["omnichannel_strategy"]
        )

    def handle_a2a_message(self, message: A2AMessage) -> A2AMessage:
        intent = message.intent
        payload = message.payload

        armor_check = self.inspect_model_armor(str(payload))
        if not armor_check["passed"]:
            return A2AMessage(
                sender_id=self.agent_id,
                receiver_id=message.sender_id,
                task_id=message.task_id,
                message_type=A2AMessageType.ERROR,
                intent="MODEL_ARMOR_BLOCKED",
                payload={"error": armor_check["filter_reason"]},
                parent_message_id=message.message_id
            )

        if intent == "GENERATE_CAMPAIGN_STRATEGY":
            analytics_data = payload.get("analytics_data", {})
            campaign_goal = payload.get("campaign_goal", "Re-engage churn-risk enterprise customers")
            result = self.generate_strategy(campaign_goal, analytics_data)
            return A2AMessage(
                sender_id=self.agent_id,
                receiver_id=message.sender_id,
                task_id=message.task_id,
                message_type=A2AMessageType.RESPONSE,
                intent="CAMPAIGN_STRATEGY_RESULT",
                payload=result,
                skill_used="campaign_framework",
                parent_message_id=message.message_id
            )
        else:
            return A2AMessage(
                sender_id=self.agent_id,
                receiver_id=message.sender_id,
                task_id=message.task_id,
                message_type=A2AMessageType.ERROR,
                intent="UNKNOWN_INTENT",
                payload={"error": f"StrategyAgent cannot handle intent '{intent}'"},
                parent_message_id=message.message_id
            )

    def generate_strategy(self, campaign_goal: str, analytics_data: Dict[str, Any]) -> Dict[str, Any]:
        cohort_info = analytics_data.get("cohort_details", {})
        target_segment = cohort_info.get("target_segment", "At-Risk Premium")
        total_at_risk = float(cohort_info.get("total_segment_revenue_at_risk", 1843190.00) or 1843190.00)

        # 1. Attempt Live Vertex AI Gemini Call
        try:
            import os, json
            from google import genai
            from google.genai import types

            project_id = os.environ.get("GCP_PROJECT_ID", "agent-demo-09")
            location = os.environ.get("GEMINI_LOCATION", "global")
            client = genai.Client(vertexai=True, project=project_id, location=location)

            skill_instruction = self.active_skill_contents.get("omnichannel_strategy", "You are an expert Omnichannel Marketing Strategist.")
            
            prompt_content = f"""
Goal: {campaign_goal}
Target Cohort: {target_segment}
Analytics Data: {json.dumps(analytics_data)}

Construct a JSON marketing strategy with the following keys:
- campaign_title (string)
- business_goal (string)
- target_cohort (string)
- projected_revenue_recovery (string)
- campaign_pillars (list of objects with keys 'pillar', 'description', 'channels')
- channel_mix (list of objects with keys 'channel', 'weight', 'cadence')
- ab_testing_hypotheses (list of strings)
"""

            model_name = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt_content,
                config=types.GenerateContentConfig(
                    system_instruction=skill_instruction,
                    response_mime_type="application/json",
                    temperature=0.7
                )
            )
            strategy_doc = json.loads(response.text)
            strategy_doc["skill_executed"] = "omnichannel_strategy"
            logger.info(f"Generated live Gemini strategy for goal '{campaign_goal}'")
            return {"status": "SUCCESS", "strategy": strategy_doc}

        except Exception as e:
            logger.error(f"Live Gemini strategy generation failed: {e}")
            raise RuntimeError(f"Vertex AI Gemini Model Call Failed in StrategyAgent: {e}")
