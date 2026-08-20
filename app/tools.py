"""
BigQuery Analytics & Marketing Tools for ADK Agent.
Provides tool functions that the ADK Agent uses to query BigQuery,
generate marketing strategies, and create marketing content.
"""
import logging
import os
import re

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
    import datetime as dt
    import decimal


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


# ─── Tool: Execute BigQuery SQL ────────────────────────────────────────────────

def query_customer_data(sql_query: str, tool_context: ToolContext) -> dict:
    """Execute a BigQuery SQL query and return the results.

    Runs the provided SQL query against BigQuery and returns the results.
    The agent must generate the SQL query itself using the table schema
    provided in its instructions.

    Args:
        sql_query: A valid BigQuery Standard SQL query to execute. Must use fully qualified table names.

    Returns:
        dict with 'status', 'summary', 'sql_executed', 'row_count', and 'results' keys.
    """
    if not sql_query or "SELECT" not in sql_query.upper():
        return {
            "status": "ERROR",
            "summary": "Invalid SQL: query must contain a SELECT statement.",
            "sql_executed": sql_query or "",
            "row_count": 0,
            "results": [],
        }

    # Clean any markdown formatting the LLM may have wrapped around the SQL
    clean_sql = _clean_generated_sql(sql_query)

    try:
        rows = _run_bq_query(clean_sql)

        # Store in session state for downstream agents
        tool_context.state["analytics_result"] = {
            "summary": f"Query returned {len(rows)} rows.",
            "total_customers_analyzed": len(rows),
            "sql_executed": clean_sql,
        }

        return {
            "status": "SUCCESS",
            "summary": f"Query executed successfully. Returned {len(rows)} rows.",
            "sql_executed": clean_sql,
            "row_count": len(rows),
            "results": rows[:20],
        }

    except Exception as e:
        logger.error(f"BigQuery query failed: {e}")
        return {
            "status": "ERROR",
            "summary": f"BigQuery Error: {e}",
            "sql_executed": clean_sql,
            "row_count": 0,
            "results": [],
        }


