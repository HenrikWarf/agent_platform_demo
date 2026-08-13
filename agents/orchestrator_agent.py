"""
Marketing Campaign Supervisor Agent (OrchestratorAgent)
Coordinates multi-agent workflows across Analytics, Strategy, and Content agents using Agent-to-Agent (A2A) protocol.
"""
from typing import Dict, Any, List
import logging
try:
    from .base_agent import BaseAgent
    from .a2a_protocol import A2AMessage, A2AMessageType
    from .analytics_agent import AnalyticsAgent
    from .strategy_agent import StrategyAgent
    from .content_agent import ContentAgent
except ImportError:
    from agents.base_agent import BaseAgent
    from agents.a2a_protocol import A2AMessage, A2AMessageType
    from agents.analytics_agent import AnalyticsAgent
    from agents.strategy_agent import StrategyAgent
    from agents.content_agent import ContentAgent

logger = logging.getLogger("orchestrator_agent")

class OrchestratorAgent(BaseAgent):
    def __init__(self, bq_client=None):
        super().__init__(
            agent_id="orchestrator_agent",
            name="Marketing Campaign Orchestrator",
            role_description="Supervisor Agent routing user objectives to specialized agents via A2A protocol.",
            skills=[]
        )
        self.analytics_agent = AnalyticsAgent(bq_client=bq_client)
        self.strategy_agent = StrategyAgent()
        self.content_agent = ContentAgent()

    def handle_a2a_message(self, message: A2AMessage) -> A2AMessage:
        # Supervisors handle root user tasks directly in process_user_request
        return A2AMessage(
            sender_id=self.agent_id,
            receiver_id=message.sender_id,
            task_id=message.task_id,
            message_type=A2AMessageType.RESPONSE,
            intent="SUPERVISOR_ACK",
            payload={"status": "Orchestrator active"},
            parent_message_id=message.message_id
        )

    def query(self, input_text: str = "", target_segment: str = "At-Risk Premium", **kwargs) -> Dict[str, Any]:
        """Vertex AI Agent Engine standard query interface entrypoint."""
        prompt = input_text or kwargs.get("prompt", "Analyze marketing performance")
        return self.process_user_request(user_prompt=prompt, target_segment=target_segment)

    def determine_intent(self, user_prompt: str) -> str:
        """Determines whether user prompt is a Data Query, Strategy Only, or Full Campaign pipeline request."""
        prompt_lower = user_prompt.lower()
        
        has_campaign_keywords = any(k in prompt_lower for k in ["strategy", "campaign", "win-back", "email", "copy", "creative", "retention", "ad copy", "outreach"])
        has_query_keywords = any(k in prompt_lower for k in ["how many", "count", "query", "show", "data", "list", "total", "metrics", "sql", "table", "revenue", "avg", "average", "what is", "recency"])

        if has_query_keywords and not has_campaign_keywords:
            return "ANALYTICS_ONLY"
        elif "strategy" in prompt_lower and not any(k in prompt_lower for k in ["email", "copy", "creative", "ad copy", "sms"]):
            return "STRATEGY_ONLY"
        else:
            return "FULL_CAMPAIGN"

    def process_user_request(self, user_prompt: str, target_segment: str = "At-Risk Premium") -> Dict[str, Any]:
        """
        Executes selective multi-agent workflow based on user intent:
        - ANALYTE_ONLY: A2A AnalyticsAgent -> BigQuery SQL metrics.
        - STRATEGY_ONLY: AnalyticsAgent -> StrategyAgent.
        - FULL_CAMPAIGN: AnalyticsAgent -> StrategyAgent -> ContentAgent.
        """
        self.router.clear_history()

        # Step 0: Safety Check via Model Armor
        armor_check = self.inspect_model_armor(user_prompt)
        if not armor_check["passed"]:
            return {
                "status": "ERROR",
                "model_armor_blocked": True,
                "error": armor_check["filter_reason"],
                "a2a_trace": self.router.get_history()
            }

        intent = self.determine_intent(user_prompt)
        prompt_lower = user_prompt.lower()
        if target_segment.startswith("All") or target_segment == "ALL" or any(k in prompt_lower for k in ["how many customers do we have", "total customers", "all customers", "full dataset", "entire dataset", "how many customers in total"]):
            target_segment = "All Cohorts (Full Dataset)"

        logger.info(f"Orchestrator determined intent: '{intent}' for prompt: '{user_prompt}' on segment: '{target_segment}'")

        # Step 1: Always Invoke Analytics Agent via A2A
        analytics_response = self.send_a2a(
            receiver_id="analytics_agent",
            intent="ANALYZE_CUSTOMER_COHORTS",
            payload={"segment": target_segment, "prompt": user_prompt},
            skill_used="bigquery_customer_analytics"
        )

        analytics_result = analytics_response.payload if analytics_response.message_type == A2AMessageType.RESPONSE else {}

        # If user ONLY requested BigQuery Data Query / Analytics:
        if intent == "ANALYTICS_ONLY":
            cohort_details = analytics_result.get("cohort_details", {})
            analytics_summary = analytics_result.get("summary", "")
            sql = cohort_details.get("sql_executed", "")

            if analytics_summary and ("•" in analytics_summary or "Executed" in analytics_summary or len(analytics_summary) > 20):
                summary_text = f"📊 **BigQuery Data Query Result**:\n\n{analytics_summary}\n\n**BigQuery SQL Executed:**\n```sql\n{sql}\n```"
            else:
                count = cohort_details.get("count_in_segment", "N/A")
                avg_recency = cohort_details.get("avg_recency_days", "N/A")
                avg_monetary = cohort_details.get("avg_monetary_val", 0.0)
                total_at_risk = cohort_details.get("total_segment_revenue_at_risk", 0.0)

                summary_text = (
                    f"📊 **BigQuery Cohort Data Query Result for '{target_segment}'**:\n\n"
                    f"• **Customer Count:** `{count}`\n"
                    f"• **Average Recency:** `{avg_recency}` days\n"
                    f"• **Average Monetary Spend:** `${avg_monetary:,.2f}`\n"
                    f"• **Total Revenue at Risk:** `${total_at_risk:,.2f}`\n\n"
                    f"**BigQuery SQL Executed:**\n```sql\n{sql}\n```"
                )

            return {
                "status": "SUCCESS",
                "model_armor_passed": True,
                "intent": intent,
                "user_prompt": user_prompt,
                "summary": summary_text,
                "analytics": analytics_result,
                "strategy": {},
                "content": {},
                "a2a_trace": self.router.get_history()
            }

        # Step 2: Invoke Strategy Agent via A2A (for STRATEGY_ONLY and FULL_CAMPAIGN)
        strategy_response = self.send_a2a(
            receiver_id="strategy_agent",
            intent="GENERATE_CAMPAIGN_STRATEGY",
            payload={"campaign_goal": user_prompt, "analytics_data": analytics_result},
            skill_used="campaign_framework"
        )

        strategy_result = strategy_response.payload if strategy_response.message_type == A2AMessageType.RESPONSE else {}

        if intent == "STRATEGY_ONLY":
            return {
                "status": "SUCCESS",
                "model_armor_passed": True,
                "intent": intent,
                "user_prompt": user_prompt,
                "summary": f"Completed BigQuery analytics and generated marketing strategy document for cohort '{target_segment}'.",
                "analytics": analytics_result,
                "strategy": strategy_result.get("strategy", {}),
                "content": {},
                "a2a_trace": self.router.get_history()
            }

        # Step 3: Invoke Content Agent via A2A (FULL_CAMPAIGN)
        content_response = self.send_a2a(
            receiver_id="content_agent",
            intent="GENERATE_MARKETING_CONTENT",
            payload={"strategy": strategy_result.get("strategy", {})},
            skill_used="brand_voice_craft"
        )

        content_result = content_response.payload if content_response.message_type == A2AMessageType.RESPONSE else {}

        # Aggregate Final Response
        return {
            "status": "SUCCESS",
            "model_armor_passed": True,
            "intent": intent,
            "user_prompt": user_prompt,
            "summary": f"Completed full multi-agent campaign pipeline for cohort '{target_segment}'. Generated BigQuery analytics, campaign strategy, and creative copy.",
            "analytics": analytics_result,
            "strategy": strategy_result.get("strategy", {}),
            "content": content_result.get("generated_assets", {}),
            "a2a_trace": self.router.get_history()
        }
