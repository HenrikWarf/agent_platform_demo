"""
BigQuery Analytics & Marketing Tools for ADK Agent.
Provides tool functions that the ADK Agent uses to query BigQuery,
generate marketing strategies, and create marketing content.
"""
import os
import json
import re
import logging
import textwrap
from typing import Any

from google.adk.tools import ToolContext

logger = logging.getLogger("app.tools")

# ─── BigQuery Helpers ──────────────────────────────────────────────────────────

_BQ_CLIENT = None

def _get_bq_client():
    """Lazy-initialize a BigQuery client."""
    global _BQ_CLIENT
    if _BQ_CLIENT is None:
        from google.cloud import bigquery
        project_id = os.environ.get("GCP_PROJECT_ID", "agent-demo-09")
        _BQ_CLIENT = bigquery.Client(project=project_id)
        logger.info(f"BigQuery client initialized for project '{project_id}'")
    return _BQ_CLIENT


def _get_project_and_dataset():
    project_id = os.environ.get("GCP_PROJECT_ID", "agent-demo-09")
    dataset_id = os.environ.get("BIGQUERY_DATASET", "marketing_analytics")
    return project_id, dataset_id


def _run_bq_query(sql: str, job_config=None) -> list[dict]:
    """Execute a BigQuery SQL query and return results as list of dicts."""
    import decimal
    import datetime as dt
    from google.cloud import bigquery

    client = _get_bq_client()
    query_job = client.query(sql, job_config=job_config) if job_config else client.query(sql)
    results = list(query_job.result())
    rows = []
    for row in results:
        row_dict = {}
        for key, val in dict(row).items():
            if isinstance(val, decimal.Decimal):
                row_dict[key] = float(val)
            elif isinstance(val, (dt.datetime, dt.date)):
                row_dict[key] = val.isoformat()
            else:
                row_dict[key] = val
        rows.append(row_dict)
    return rows


def _clean_generated_sql(text: str) -> str:
    """Extract a clean SQL query from Gemini-generated text.

    Handles common Gemini output patterns:
    - ```sql\nSELECT ...\n```  (code-fenced)
    - sql\nSELECT ...          (prefixed with 'sql' keyword)
    - SELECT ...               (raw SQL)
    """
    # Try code fence extraction first
    match = re.search(r"```(?:sql)?\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
    if match:
        sql = match.group(1).strip()
    else:
        sql = text.replace("```", "").strip()

    # Strip leading 'sql' keyword that Gemini sometimes prepends
    sql = re.sub(r"^\s*sql\s+", "", sql, flags=re.IGNORECASE).strip()

    return sql


# ─── Tool: Run Custom BigQuery SQL ─────────────────────────────────────────────

def run_bigquery_sql(user_question: str, tool_context: ToolContext) -> dict:
    """Execute a natural language question against BigQuery by generating and running SQL.

    Converts any user data question into a BigQuery SQL query using Gemini,
    then executes it against the customer analytics tables and returns results.
    Use this for any data question: counts, averages, listings, comparisons, etc.

    Args:
        user_question: The user's natural language data question, e.g. 'How many customers are in the Champions segment?' or 'Show the top 5 customers by total spend'.

    Returns:
        dict with 'status', 'summary', 'sql_executed', 'row_count', and 'results' keys.
    """
    project_id, dataset_id = _get_project_and_dataset()

    try:
        from google import genai
        from google.genai import types

        location = os.environ.get("GOOGLE_CLOUD_LOCATION", os.environ.get("GEMINI_LOCATION", "global"))
        client = genai.Client(vertexai=True, project=project_id, location=location)
        model_name = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")

        sql_gen_prompt = f"""
You are a BigQuery SQL Expert for Google Cloud Marketing Analytics.
Generate a single, valid BigQuery Standard SQL query to answer: '{user_question}'

Available tables in dataset '{project_id}.{dataset_id}':

1. `{project_id}.{dataset_id}.customer_rfm_summary`:
   - customer_id (STRING), rfm_segment (STRING), recency_days (INT64),
     frequency_orders (INT64), total_monetary (NUMERIC)
   - Segments: 'At-Risk Premium', 'Champions', 'Loyal Customers', 'Recent Buyers', 'Lost Customers'

2. `{project_id}.{dataset_id}.customer_demographics_360`:
   - customer_id (STRING), full_name (STRING), email (STRING), age (INT64),
     location_city (STRING), location_country (STRING), income_bracket (STRING),
     preferred_communication_channel (STRING), favorite_product_features (STRING),
     churn_risk_score (NUMERIC), lifetime_value_tier (STRING)

3. `{project_id}.{dataset_id}.customer_transactions`:
   - transaction_id (STRING), customer_id (STRING), customer_name (STRING),
     email (STRING), segment (STRING), amount (NUMERIC), transaction_date (TIMESTAMP)

Rules:
1. Return ONLY the raw SQL query inside a ```sql markdown block.
2. Use fully qualified table names as listed above.
3. Add LIMIT 20 for row listings to avoid returning too many results.
4. Use JOINs on customer_id when combining tables.
"""
        res = client.models.generate_content(
            model=model_name,
            contents=sql_gen_prompt,
            config=types.GenerateContentConfig(temperature=0.0, max_output_tokens=512)
        )

        generated_text = res.text or ""
        custom_sql = _clean_generated_sql(generated_text)

        if not custom_sql or "SELECT" not in custom_sql.upper():
            return {"status": "ERROR", "summary": "Failed to generate valid SQL from your question.", "sql_executed": "", "row_count": 0, "results": []}

        rows = _run_bq_query(custom_sql)

        # Store in session state for downstream agents
        tool_context.state["analytics_result"] = {
            "summary": f"Query returned {len(rows)} rows.",
            "total_customers_analyzed": len(rows),
            "sql_executed": custom_sql,
        }

        return {
            "status": "SUCCESS",
            "summary": f"Query executed successfully. Returned {len(rows)} rows.",
            "sql_executed": custom_sql,
            "row_count": len(rows),
            "results": rows[:20],
        }

    except Exception as e:
        logger.error(f"BigQuery query failed: {e}")
        return {"status": "ERROR", "summary": f"BigQuery Error: {e}", "sql_executed": "", "row_count": 0, "results": []}


# ─── Tool: BigQuery Customer Analytics ─────────────────────────────────────────

def query_customer_cohorts(segment_filter: str, user_prompt: str, tool_context: ToolContext) -> dict:
    """Query BigQuery customer data for RFM segmentation analytics.

    Analyzes customer cohorts using RFM (Recency, Frequency, Monetary) metrics from BigQuery.
    For natural language data questions, generates and executes custom BigQuery SQL.
    For segment-specific queries, retrieves pre-aggregated RFM segment summaries.

    Args:
        segment_filter: The customer segment to analyze, e.g. 'At-Risk Premium', 'Champions', 'All Cohorts (Full Dataset)'.
        user_prompt: The user's original natural language data question or campaign objective.

    Returns:
        dict with 'status', 'summary', 'cohort_details', and 'sql_executed' keys.
    """
    project_id, dataset_id = _get_project_and_dataset()

    # For natural-language data questions, generate custom SQL via Gemini
    if user_prompt and len(user_prompt.strip()) > 10 and not user_prompt.lower().startswith("analyze marketing"):
        try:
            from google import genai
            from google.genai import types

            location = os.environ.get("GOOGLE_CLOUD_LOCATION", os.environ.get("GEMINI_LOCATION", "global"))
            client = genai.Client(vertexai=True, project=project_id, location=location)
            model_name = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")

            sql_gen_prompt = f"""
You are a BigQuery SQL Expert for Google Cloud Marketing Analytics.
Generate a single, valid BigQuery Standard SQL query to answer this user request: '{user_prompt}'
Target Segment Context: '{segment_filter}'

Available BigQuery Tables in dataset '{project_id}.{dataset_id}':
1. `{project_id}.{dataset_id}.customer_rfm_summary`:
   - customer_id (STRING), rfm_segment (STRING), recency_days (INT64),
     frequency_orders (INT64), total_monetary (NUMERIC)

2. `{project_id}.{dataset_id}.customer_demographics_360`:
   - customer_id (STRING), full_name (STRING), email (STRING), age (INT64),
     location_city (STRING), location_country (STRING), income_bracket (STRING),
     preferred_communication_channel (STRING), churn_risk_score (NUMERIC), lifetime_value_tier (STRING)

3. `{project_id}.{dataset_id}.customer_transactions`:
   - transaction_id (STRING), customer_id (STRING), customer_name (STRING),
     email (STRING), segment (STRING), amount (NUMERIC), transaction_date (TIMESTAMP)

Rules:
1. Return ONLY the raw SQL query inside ```sql markdown block.
2. Use exact table names listed above.
3. Keep LIMIT 20 if retrieving row listings.
"""
            res = client.models.generate_content(
                model=model_name,
                contents=sql_gen_prompt,
                config=types.GenerateContentConfig(temperature=0.0, max_output_tokens=512)
            )

            generated_text = res.text or ""
            custom_sql = _clean_generated_sql(generated_text)

            if custom_sql and "SELECT" in custom_sql.upper():
                custom_rows = _run_bq_query(custom_sql)
                summary_text = f"Query returned {len(custom_rows)} records for segment '{segment_filter}'."

                # Store in session state for downstream agents
                tool_context.state["analytics_result"] = {
                    "summary": summary_text,
                    "total_customers_analyzed": len(custom_rows),
                    "target_segment": segment_filter,
                    "sql_executed": custom_sql,
                }
                return {
                    "status": "SUCCESS",
                    "summary": summary_text,
                    "cohort_details": {
                        "total_customers_analyzed": len(custom_rows),
                        "target_segment": segment_filter,
                        "count_in_segment": len(custom_rows),
                        "sql_executed": custom_sql,
                        "custom_results": custom_rows[:10],
                    },
                }
        except Exception as e:
            logger.error(f"Gemini SQL generation failed: {e}")
            return {"status": "ERROR", "summary": f"BigQuery Execution Error: {e}", "cohort_details": {"error": str(e)}}

    # Default: aggregate RFM query
    from google.cloud import bigquery as bq
    if segment_filter.startswith("All") or segment_filter.upper() == "ALL":
        sql = textwrap.dedent(f"""
        SELECT 'All Cohorts (Full Dataset)' AS rfm_segment,
               COUNT(customer_id) AS customer_count,
               ROUND(AVG(recency_days), 1) AS avg_recency,
               ROUND(AVG(total_monetary), 2) AS avg_monetary,
               ROUND(SUM(total_monetary), 2) AS total_revenue_at_risk
        FROM `{project_id}.{dataset_id}.customer_rfm_summary`
        """).strip()
        job_config = None
    else:
        sql = textwrap.dedent(f"""
        SELECT rfm_segment,
               COUNT(customer_id) AS customer_count,
               ROUND(AVG(recency_days), 1) AS avg_recency,
               ROUND(AVG(total_monetary), 2) AS avg_monetary,
               ROUND(SUM(total_monetary), 2) AS total_revenue_at_risk
        FROM `{project_id}.{dataset_id}.customer_rfm_summary`
        WHERE rfm_segment = @segment
        GROUP BY rfm_segment
        """).strip()
        job_config = bq.QueryJobConfig(
            query_parameters=[bq.ScalarQueryParameter("segment", "STRING", segment_filter)]
        )

    rows = _run_bq_query(sql, job_config)
    if rows:
        row = rows[0]
        result = {
            "total_customers_analyzed": int(row.get("customer_count", 0)),
            "target_segment": row.get("rfm_segment", segment_filter),
            "count_in_segment": int(row.get("customer_count", 0)),
            "avg_recency_days": float(row.get("avg_recency", 0)),
            "avg_monetary_val": float(row.get("avg_monetary", 0)),
            "total_segment_revenue_at_risk": float(row.get("total_revenue_at_risk", 0)),
            "sql_executed": sql,
        }
        tool_context.state["analytics_result"] = result
        return {"status": "SUCCESS", "summary": f"Identified {result['count_in_segment']} customers in '{segment_filter}' with ${result['total_segment_revenue_at_risk']:,.2f} revenue at risk.", "cohort_details": result}
    else:
        return {"status": "NO_DATA", "summary": f"No customer records found for segment '{segment_filter}'.", "cohort_details": {"target_segment": segment_filter, "count_in_segment": 0, "sql_executed": sql}}


# ─── Tool: Generate Marketing Strategy ──────────────────────────────────────

def generate_campaign_strategy(campaign_goal: str, target_segment: str, analytics_summary: str, tool_context: ToolContext) -> dict:
    """Generate an omnichannel marketing strategy with campaign pillars, channel mix, and A/B testing hypotheses.

    Creates a comprehensive marketing campaign framework based on the campaign goal,
    target customer segment, and any available analytics data.

    Args:
        campaign_goal: The business objective for the campaign, e.g. 'Re-engage churn-risk enterprise customers'.
        target_segment: The customer segment being targeted, e.g. 'At-Risk Premium'.
        analytics_summary: Summary of analytics data to inform the strategy.

    Returns:
        dict with 'status' and 'strategy' keys containing campaign_title, business_goal,
        campaign_pillars, channel_mix, and ab_testing_hypotheses.
    """
    try:
        from google import genai
        from google.genai import types

        project_id = os.environ.get("GCP_PROJECT_ID", "agent-demo-09")
        location = os.environ.get("GOOGLE_CLOUD_LOCATION", os.environ.get("GEMINI_LOCATION", "global"))
        client = genai.Client(vertexai=True, project=project_id, location=location)
        model_name = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")

        prompt = f"""
Goal: {campaign_goal}
Target Cohort: {target_segment}
Analytics Context: {analytics_summary}

Return a concise JSON marketing strategy with these keys:
- campaign_title (string, max 10 words)
- business_goal (string, 1 sentence)
- target_cohort (string)
- projected_revenue_recovery (string, e.g. "$1.2M")
- campaign_pillars (exactly 3 objects with keys: pillar, description (1 sentence), channels (list of 2-3 strings))
- channel_mix (exactly 4 objects with keys: channel, weight, cadence)
- ab_testing_hypotheses (exactly 3 short strings)

Be concise. No explanations outside the JSON.
"""
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction="Expert Omnichannel Marketing Strategist. Return ONLY valid JSON. Be concise.",
                response_mime_type="application/json",
                temperature=0.5,
                max_output_tokens=1024,
            ),
        )
        strategy = json.loads(response.text)
        tool_context.state["strategy_result"] = strategy
        return {"status": "SUCCESS", "strategy": strategy}

    except Exception as e:
        logger.warning(f"Gemini strategy generation fell back to template: {e}")
        fallback = {
            "campaign_title": f"Re-Engagement Campaign for {target_segment}",
            "business_goal": campaign_goal,
            "target_cohort": target_segment,
            "projected_revenue_recovery": "TBD",
            "campaign_pillars": [
                {"pillar": "VIP Recognition & Retention", "description": "Personalized outreach for high-value customers.", "channels": ["Email", "Direct Mail"]},
                {"pillar": "Product Value Reinforcement", "description": "Demonstrate ROI and highlight underutilized features.", "channels": ["Webinar", "In-App Messaging"]},
                {"pillar": "Win-Back Incentive Program", "description": "Time-limited upgrades and dedicated support.", "channels": ["Email", "SMS", "Sales"]},
            ],
            "channel_mix": [
                {"channel": "Email", "weight": "40%", "cadence": "2x per week"},
                {"channel": "LinkedIn", "weight": "25%", "cadence": "3x per week"},
                {"channel": "SMS", "weight": "15%", "cadence": "1x per week"},
            ],
            "ab_testing_hypotheses": [
                "H1: Personalized subject lines increase open rates by 18%",
                "H2: Exclusive VIP access CTA outperforms discount CTA by 12%",
            ],
        }
        tool_context.state["strategy_result"] = fallback
        return {"status": "SUCCESS", "strategy": fallback}


# ─── Tool: Generate Marketing Content ──────────────────────────────────────

def generate_marketing_content(campaign_title: str, target_segment: str, strategy_summary: str, tool_context: ToolContext) -> dict:
    """Generate high-converting marketing creative assets: email templates, social media posts, and SMS copy.

    Creates brand-aligned marketing content based on the campaign strategy, following
    brand voice guidelines for tone, style, and messaging.

    Args:
        campaign_title: The name of the campaign, e.g. 'VIP Retention Campaign'.
        target_segment: The customer segment being targeted, e.g. 'At-Risk Premium'.
        strategy_summary: Summary of the campaign strategy to inform content creation.

    Returns:
        dict with 'status', 'campaign_title', and 'generated_assets' keys containing
        email_template, social_posts, and sms_copy.
    """
    try:
        from google import genai
        from google.genai import types

        project_id = os.environ.get("GCP_PROJECT_ID", "agent-demo-09")
        location = os.environ.get("GOOGLE_CLOUD_LOCATION", os.environ.get("GEMINI_LOCATION", "global"))
        client = genai.Client(vertexai=True, project=project_id, location=location)
        model_name = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")

        prompt = f"""
Campaign: {campaign_title}
Cohort: {target_segment}
Strategy: {strategy_summary}

Return a concise JSON with these keys:
- email_template (object: subject (max 10 words), preview_text (1 sentence), body (3-4 sentences), cta_button (max 5 words))
- social_posts (exactly 2 objects: platform, copy (max 2 sentences each))
- sms_copy (1 sentence, max 160 chars)

Be concise and punchy. No filler.
"""
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction="Expert Copywriter. Return ONLY valid JSON. Be concise and punchy.",
                response_mime_type="application/json",
                temperature=0.6,
                max_output_tokens=768,
            ),
        )
        assets = json.loads(response.text)
        return {"status": "SUCCESS", "campaign_title": campaign_title, "generated_assets": assets}

    except Exception as e:
        logger.warning(f"Gemini content generation fell back to template: {e}")
        fallback_assets = {
            "email_template": {
                "subject": f"Exclusive VIP Access: Elevate Your Data Infrastructure with {campaign_title}",
                "preview_text": f"Special invitation for {target_segment} members.",
                "body": f"Dear Valued Partner,\n\nWe noticed your team has been scaling operations. To help you maximize throughput for {target_segment}, we are extending a complimentary architecture audit and 30 days of dedicated node capacity.",
                "cta_button": "Claim VIP Architecture Audit",
            },
            "social_posts": [
                {"platform": "LinkedIn", "copy": f"🚀 Maximize your enterprise data infrastructure. Learn how {target_segment} teams achieve 99.99% uptime."},
                {"platform": "X (Twitter)", "copy": f"⚡ Scaling data operations? Request a complimentary architecture audit for {target_segment} accounts."},
            ],
            "sms_copy": f"VIP Update: Claim your complimentary architecture review for {campaign_title}. Reply YES for AM contact.",
        }
        return {"status": "SUCCESS", "campaign_title": campaign_title, "generated_assets": fallback_assets}
