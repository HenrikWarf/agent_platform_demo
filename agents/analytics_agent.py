"""
Customer Insights & Analytics Agent (AnalyticsAgent)
Queries Google BigQuery customer datasets and performs RFM segmentation using the marketing_analytics skill.
"""
from typing import Dict, Any, List
import logging
from .base_agent import BaseAgent
from .a2a_protocol import A2AMessage, A2AMessageType

logger = logging.getLogger("analytics_agent")

class AnalyticsAgent(BaseAgent):
    def __init__(self, bq_client=None):
        super().__init__(
            agent_id="analytics_agent",
            name="Customer Insights & Analytics Agent",
            role_description="Executes BigQuery data analysis, cohort extraction, and RFM customer segmentation.",
            skills=["marketing_analytics"]
        )
        self.bq_client = bq_client

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

        if intent == "ANALYZE_CUSTOMER_COHORTS":
            segment_filter = payload.get("segment", "At-Risk Premium")
            result = self.analyze_cohorts(segment_filter)
            return A2AMessage(
                sender_id=self.agent_id,
                receiver_id=message.sender_id,
                task_id=message.task_id,
                message_type=A2AMessageType.RESPONSE,
                intent="COHORT_ANALYSIS_RESULT",
                payload=result,
                skill_used="bigquery_customer_analytics",
                parent_message_id=message.message_id
            )
        else:
            return A2AMessage(
                sender_id=self.agent_id,
                receiver_id=message.sender_id,
                task_id=message.task_id,
                message_type=A2AMessageType.ERROR,
                intent="UNKNOWN_INTENT",
                payload={"error": f"AnalyticsAgent cannot handle intent '{intent}'"},
                parent_message_id=message.message_id
            )

    def analyze_cohorts(self, segment_filter: str) -> Dict[str, Any]:
        """Runs RFM analytical queries using BigQuery dataset."""
        if not self.bq_client:
            raise RuntimeError("BigQuery client is not initialized on AnalyticsAgent.")
        
        raw_data = self.bq_client.get_rfm_segments(segment_filter)

        return {
            "status": "SUCCESS",
            "skill_executed": "rfm_customer_segmentation",
            "summary": f"Identified {raw_data.get('count_in_segment', 0)} customers in cohort '{segment_filter}' with total potential revenue at risk of ${raw_data.get('total_segment_revenue_at_risk', 0):,.2f}.",
            "cohort_details": raw_data
        }
