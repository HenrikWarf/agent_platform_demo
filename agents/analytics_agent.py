"""
Customer Insights & Analytics Agent (AnalyticsAgent)
Queries Google BigQuery customer datasets and performs RFM segmentation using the marketing_analytics skill.
"""
from typing import Dict, Any, List
import logging
import json
import re
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
            user_prompt = payload.get("prompt", "")
            result = self.analyze_cohorts(segment_filter, user_prompt=user_prompt)
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

    def analyze_cohorts(self, segment_filter: str, user_prompt: str = "") -> Dict[str, Any]:
        """Runs dynamic BigQuery analytical queries based on natural language user prompt."""
        if not self.bq_client:
            raise RuntimeError("BigQuery client is not initialized on AnalyticsAgent.")
        
        # If user asked a specific natural language question (and it's not a generic campaign default):
        if user_prompt and len(user_prompt.strip()) > 10 and not user_prompt.lower().startswith("analyze marketing"):
            try:
                import os
                from google import genai
                from google.genai import types
                
                project_id = os.environ.get("GCP_PROJECT_ID", "agent-demo-09")
                location = os.environ.get("GEMINI_LOCATION", "global")
                client = genai.Client(vertexai=True, project=project_id, location=location)
                model_name = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")
                sql_gen_prompt = f"""
                You are a BigQuery SQL Expert for Google Cloud Marketing Analytics.
                Generate a single, valid BigQuery Standard SQL query to answer this user request: '{user_prompt}'
                Target Segment Context: '{segment_filter}'

                Available BigQuery Tables in dataset '{self.bq_client.project_id}.{self.bq_client.dataset_id}':
                1. `{self.bq_client.project_id}.{self.bq_client.dataset_id}.customer_rfm_summary`:
                   - customer_id (STRING)
                   - rfm_segment (STRING): e.g., 'At-Risk Premium', 'Champions', 'Loyal Customers', 'Recent Buyers', 'Lost Customers'
                   - recency_days (INT64)
                   - frequency_orders (INT64)
                   - total_monetary (NUMERIC)

                2. `{self.bq_client.project_id}.{self.bq_client.dataset_id}.customer_demographics_360`:
                   - customer_id (STRING)
                   - full_name (STRING)
                   - email (STRING)
                   - age (INT64)
                   - location_city (STRING)
                   - location_country (STRING)
                   - income_bracket (STRING)
                   - preferred_communication_channel (STRING)
                   - favorite_product_features (STRING)
                   - churn_risk_score (NUMERIC)
                   - lifetime_value_tier (STRING)

                3. `{self.bq_client.project_id}.{self.bq_client.dataset_id}.customer_transactions`:
                   - transaction_id (STRING)
                   - customer_id (STRING)
                   - customer_name (STRING)
                   - email (STRING)
                   - segment (STRING)
                   - amount (NUMERIC)
                   - transaction_date (TIMESTAMP)

                Rules:
                1. Return ONLY the raw SQL query inside ```sql markdown block.
                2. Use exact table names listed above.
                3. Keep LIMIT 20 if retrieving row listings.
                """
                
                res = client.models.generate_content(
                    model=model_name,
                    contents=sql_gen_prompt,
                    config=types.GenerateContentConfig(temperature=0.1)
                )
                
                generated_text = res.text or ""
                sql_match = re.search(r"```sql\s*(.*?)\s*```", generated_text, re.DOTALL)
                if sql_match:
                    custom_sql = sql_match.group(1).strip()
                else:
                    custom_sql = generated_text.replace("```", "").strip()

                if custom_sql and "SELECT" in custom_sql.upper():
                    logger.info(f"Generated custom BigQuery SQL for prompt '{user_prompt}':\n{custom_sql}")
                    custom_rows = self.bq_client.execute_custom_sql(custom_sql)
                    if custom_rows:
                        summary_prompt = f"Summarize these BigQuery query results in 2-3 bullet points for the user prompt '{user_prompt}':\n{json.dumps(custom_rows[:5])}"
                        summary_res = client.models.generate_content(
                            model=model_name,
                            contents=summary_prompt,
                            config=types.GenerateContentConfig(temperature=0.2)
                        )
                        summary_text = summary_res.text or f"Executed query returned {len(custom_rows)} records."
                        
                        return {
                            "status": "SUCCESS",
                            "skill_executed": "bigquery_customer_analytics",
                            "summary": summary_text,
                            "cohort_details": {
                                "total_customers_analyzed": len(custom_rows),
                                "target_segment": segment_filter,
                                "count_in_segment": len(custom_rows),
                                "sql_executed": custom_sql,
                                "custom_results": custom_rows[:10]
                            }
                        }
            except Exception as e:
                logger.warning(f"Live Gemini SQL generation failed: {e}. Falling back to default cohort analysis.")

        raw_data = self.bq_client.get_rfm_segments(segment_filter)
        return {
            "status": "SUCCESS",
            "skill_executed": "bigquery_customer_analytics",
            "summary": f"Identified {raw_data.get('count_in_segment', 0)} customers in cohort '{segment_filter}' with total potential revenue at risk of ${raw_data.get('total_segment_revenue_at_risk', 0):,.2f}.",
            "cohort_details": raw_data
        }

