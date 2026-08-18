"""
BigQuery Client for GCP Agent Platform
Executes analytical queries directly against Google Cloud BigQuery customer dataset.
"""
import textwrap
from typing import Dict, Any, List
import logging
try:
    from .config import Config
except ImportError:
    from backend.config import Config

logger = logging.getLogger("bq_client")

try:
    from google.cloud import bigquery
    HAS_BIGQUERY_SDK = True
except ImportError:
    HAS_BIGQUERY_SDK = False

class BigQueryClient:
    def __init__(self, project_id: str = Config.GCP_PROJECT_ID, dataset_id: str = Config.BIGQUERY_DATASET):
        self.project_id = project_id
        self.dataset_id = dataset_id
        self._client = None

    @property
    def client(self):
        if self._client is None and HAS_BIGQUERY_SDK:
            try:
                self._client = bigquery.Client(project=self.project_id)
                logger.info(f"BigQuery Client initialized for project '{self.project_id}'")
            except Exception as e:
                logger.error(f"Failed to initialize GCP BigQuery SDK client for project '{self.project_id}': {e}")
        return self._client

    def get_rfm_segments(self, segment_filter: str = "Dormant At-Risk") -> Dict[str, Any]:
        """Queries customer dataset for RFM segmentation metrics."""
        if not self.client:
            raise RuntimeError("BigQuery client is not active.")

        if segment_filter.startswith("All") or segment_filter.upper() == "ALL":
            query = textwrap.dedent(f"""
            SELECT
                'All Cohorts (Full Dataset)' AS rfm_segment,
                COUNT(customer_id) AS customer_count,
                ROUND(AVG(recency_days), 1) AS avg_recency,
                ROUND(AVG(total_monetary_eur), 2) AS avg_monetary_eur,
                ROUND(SUM(total_monetary_eur), 2) AS total_revenue_eur
            FROM `{self.project_id}.{self.dataset_id}.customer_rfm_summary`
            """).strip()
            job_config = None
        else:
            query = textwrap.dedent(f"""
            SELECT
                rfm_segment,
                COUNT(customer_id) AS customer_count,
                ROUND(AVG(recency_days), 1) AS avg_recency,
                ROUND(AVG(total_monetary_eur), 2) AS avg_monetary_eur,
                ROUND(SUM(total_monetary_eur), 2) AS total_revenue_eur
            FROM `{self.project_id}.{self.dataset_id}.customer_rfm_summary`
            WHERE rfm_segment = @segment
            GROUP BY rfm_segment
            """).strip()
            job_config = bigquery.QueryJobConfig(
                query_parameters=[bigquery.ScalarQueryParameter("segment", "STRING", segment_filter)]
            )

        try:
            query_job = self.client.query(query, job_config=job_config) if job_config else self.client.query(query)
            results = list(query_job.result())
            if results:
                row = results[0]
                return {
                    "total_customers_analyzed": int(row.customer_count or 0),
                    "target_segment": str(row.rfm_segment),
                    "count_in_segment": int(row.customer_count or 0),
                    "avg_recency_days": float(row.avg_recency or 0),
                    "avg_monetary_val_eur": float(row.avg_monetary_eur or 0),
                    "total_segment_revenue_eur": float(row.total_revenue_eur or 0),
                    "top_categories": ["Womenswear", "Menswear", "Accessories"],
                    "sql_executed": query
                }
            else:
                return {
                    "status": "NO_DATA",
                    "target_segment": segment_filter,
                    "count_in_segment": 0,
                    "avg_recency_days": 0,
                    "avg_monetary_val": 0.0,
                    "total_segment_revenue_at_risk": 0.0,
                    "sql_executed": query,
                    "error": f"No customer records found in BigQuery for segment '{segment_filter}'"
                }
        except Exception as e:
            logger.error(f"Error executing BigQuery SQL for segment '{segment_filter}': {e}")
            raise RuntimeError(f"BigQuery query execution failed: {e}")

    def get_table_total_rows(self, table_name: str = "customer_rfm_summary") -> int:
        """Fetches live row count from BigQuery table metadata."""
        allowed_tables = ["customer_rfm_summary", "customer_demographics_360", "customer_transactions"]
        if table_name not in allowed_tables:
            table_name = "customer_rfm_summary"

        if not self.client:
            raise RuntimeError("BigQuery client is not active.")

        try:
            table_ref = self.client.get_table(f"{self.project_id}.{self.dataset_id}.{table_name}")
            return table_ref.num_rows
        except Exception as e:
            logger.error(f"Error fetching table metadata for {table_name}: {e}")
            raise RuntimeError(f"Failed to fetch metadata for table '{table_name}': {e}")

    def get_sample_customers(self, table_name: str = "customer_rfm_summary", limit: int = 10) -> List[Dict[str, Any]]:
        """Returns sample rows of customer profiles from specified BigQuery table."""
        allowed_tables = ["customer_rfm_summary", "customer_demographics_360", "customer_transactions"]
        if table_name not in allowed_tables:
            table_name = "customer_rfm_summary"

        if not self.client:
            raise RuntimeError("BigQuery client is not active.")

        query = f"SELECT * FROM `{self.project_id}.{self.dataset_id}.{table_name}` LIMIT {limit}"
        try:
            import decimal, datetime
            query_job = self.client.query(query)
            results = list(query_job.result())
            rows = []
            for row in results:
                row_dict = {}
                for key, val in dict(row).items():
                    if isinstance(val, decimal.Decimal):
                        row_dict[key] = float(val)
                    elif isinstance(val, (datetime.datetime, datetime.date)):
                        row_dict[key] = val.isoformat()
                    else:
                        row_dict[key] = val
                rows.append(row_dict)
            return rows
        except Exception as e:
            logger.error(f"Error executing BigQuery sample query for table '{table_name}': {e}")
            raise RuntimeError(f"BigQuery sample query failed: {e}")

    def execute_custom_sql(self, sql_query: str) -> List[Dict[str, Any]]:
        """Executes a custom SQL query against the BigQuery dataset and returns dict rows."""
        if not self.client:
            raise RuntimeError("BigQuery client is not active.")

        try:
            import decimal, datetime
            query_job = self.client.query(sql_query)
            results = list(query_job.result())
            rows = []
            for row in results:
                row_dict = {}
                for key, val in dict(row).items():
                    if isinstance(val, decimal.Decimal):
                        row_dict[key] = float(val)
                    elif isinstance(val, (datetime.datetime, datetime.date)):
                        row_dict[key] = val.isoformat()
                    else:
                        row_dict[key] = val
                rows.append(row_dict)
            return rows
        except Exception as e:
            logger.error(f"Error executing custom BigQuery SQL '{sql_query}': {e}")
            raise RuntimeError(f"Custom BigQuery SQL execution failed: {e}")


