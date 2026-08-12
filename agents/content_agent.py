"""
Content & Creative Agent (ContentAgent)
Generates high-converting marketing copy, email sequences, social posts, and ad copy using the brand_voice skill.
"""
from typing import Dict, Any
import logging
from .base_agent import BaseAgent
from .a2a_protocol import A2AMessage, A2AMessageType

logger = logging.getLogger("content_agent")

class ContentAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="content_agent",
            name="Content & Creative Copywriting Agent",
            role_description="Produces email templates, social media posts, SMS, and ad copy adhering to Brand Voice guidelines.",
            skills=["brand_voice"]
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

        if intent == "GENERATE_MARKETING_CONTENT":
            strategy_doc = payload.get("strategy", {})
            result = self.generate_content(strategy_doc)
            return A2AMessage(
                sender_id=self.agent_id,
                receiver_id=message.sender_id,
                task_id=message.task_id,
                message_type=A2AMessageType.RESPONSE,
                intent="MARKETING_CONTENT_RESULT",
                payload=result,
                skill_used="brand_voice_craft",
                parent_message_id=message.message_id
            )
        else:
            return A2AMessage(
                sender_id=self.agent_id,
                receiver_id=message.sender_id,
                task_id=message.task_id,
                message_type=A2AMessageType.ERROR,
                intent="UNKNOWN_INTENT",
                payload={"error": f"ContentAgent cannot handle intent '{intent}'"},
                parent_message_id=message.message_id
            )

    def generate_content(self, strategy_doc: Dict[str, Any]) -> Dict[str, Any]:
        campaign_title = strategy_doc.get("campaign_title", "VIP Retention Campaign")
        target_cohort = strategy_doc.get("target_cohort", "At-Risk Premium")

        # 1. Attempt Live Vertex AI Gemini Call
        try:
            import os, json
            from google import genai
            from google.genai import types

            project_id = os.environ.get("GCP_PROJECT_ID", "agent-demo-09")
            location = os.environ.get("GEMINI_LOCATION", "global")
            client = genai.Client(vertexai=True, project=project_id, location=location)

            skill_instruction = self.active_skill_contents.get("brand_voice", "You are an expert Copywriter crafting brand-aligned marketing assets.")
            
            prompt_content = f"""
Campaign Title: {campaign_title}
Target Cohort: {target_cohort}
Strategy Document: {json.dumps(strategy_doc)}

Generate a JSON object containing high-converting marketing creative assets with keys:
- email_template (object with keys 'subject', 'preview_text', 'body', 'cta_button')
- social_posts (list of objects with keys 'platform', 'copy')
- sms_copy (string)
"""

            model_name = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt_content,
                config=types.GenerateContentConfig(
                    system_instruction=skill_instruction,
                    response_mime_type="application/json",
                    temperature=0.8
                )
            )
            generated_assets = json.loads(response.text)
            logger.info(f"Generated live Gemini content copy for campaign '{campaign_title}'")

            return {
                "status": "SUCCESS",
                "skill_executed": "brand_voice_craft",
                "campaign_title": campaign_title,
                "generated_assets": generated_assets
            }

        except Exception as e:
            logger.error(f"Live Gemini content generation failed: {e}")
            raise RuntimeError(f"Vertex AI Gemini Model Call Failed in ContentAgent: {e}")
