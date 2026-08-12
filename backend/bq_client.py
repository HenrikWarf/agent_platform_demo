"""
BigQuery Client & Synthetic Dataset Fallback for GCP Agent Platform
Allows querying BigQuery customer dataset in GCP Cloud or using synthetic local data.
"""
import textwrap
from typing import Dict, Any, List
import logging
from .config import Config

logger = logging.getLogger("bq_client")

try:
    from google.cloud import bigquery
    HAS_BIGQUERY_SDK = True
except ImportError:
    HAS_BIGQUERY_SDK = False

class BigQueryClient:
    def __init__(self, project_id: str = Config.GCP_PROJECT_ID, dataset_id: str = Config.BIGQUERY_DATASET):
        self.use_cloud = Config.USE_GCP_CLOUD
        self.project_id = project_id
        self.dataset_id = dataset_id
        self.client = None

        if self.use_cloud and HAS_BIGQUERY_SDK:
            try:
                self.client = bigquery.Client(project=self.project_id)
                logger.info(f"BigQuery Client initialized for project '{self.project_id}'")
            except Exception as e:
                logger.warning(f"Could not initialize GCP BigQuery SDK client, using synthetic fallback: {e}")
                self.use_cloud = False
        else:
            self.use_cloud = False

    def get_rfm_segments(self, segment_filter: str = "At-Risk Premium") -> Dict[str, Any]:
        """Queries customer dataset for RFM segmentation metrics."""
        if self.use_cloud and self.client:
            if segment_filter.startswith("All") or segment_filter.upper() == "ALL":
                query = textwrap.dedent(f"""
                SELECT
                    'All Cohorts (Full Dataset)' AS rfm_segment,
                    COUNT(customer_id) AS customer_count,
                    ROUND(AVG(recency_days), 1) AS avg_recency,
                    ROUND(AVG(total_monetary), 2) AS avg_monetary,
                    ROUND(SUM(total_monetary), 2) AS total_revenue_at_risk
                FROM `{self.project_id}.{self.dataset_id}.customer_rfm_summary`
                """).strip()
                job_config = None
            else:
                query = textwrap.dedent(f"""
                SELECT
                    rfm_segment,
                    COUNT(customer_id) AS customer_count,
                    ROUND(AVG(recency_days), 1) AS avg_recency,
                    ROUND(AVG(total_monetary), 2) AS avg_monetary,
                    ROUND(SUM(total_monetary), 2) AS total_revenue_at_risk
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
                        "avg_monetary_val": float(row.avg_monetary or 0),
                        "total_segment_revenue_at_risk": float(row.total_revenue_at_risk or 0),
                        "top_purchased_categories": ["Premium Enterprise Tier", "Custom Connectors", "Dedicated Node"],
                        "sql_executed": query
                    }
                else:
                    logger.warning(f"BigQuery query returned 0 rows for '{segment_filter}'. Falling back to synthetic mock data.")
            except Exception as e:
                logger.error(f"Error executing BigQuery SQL: {e}. Falling back to synthetic mock data.")

        # Synthetic Fallback for Local / CI/CD testing mode
        logger.info(f"Using synthetic BigQuery data fallback for segment '{segment_filter}'")
        is_all = segment_filter.startswith("All") or segment_filter.upper() == "ALL"
        return {
            "total_customers_analyzed": 200,
            "target_segment": segment_filter,
            "count_in_segment": 200 if is_all else 52,
            "avg_recency_days": 90.8 if is_all else 115.4,
            "avg_monetary_val": 2475.76 if is_all else 4250.80,
            "total_segment_revenue_at_risk": 495152.98 if is_all else 221041.60,
            "top_purchased_categories": ["Premium Enterprise Tier", "Custom Connectors", "Dedicated Node"],
            "sql_executed": f"SELECT rfm_segment, COUNT(customer_id) AS customer_count FROM `{self.project_id}.{self.dataset_id}.customer_rfm_summary` WHERE rfm_segment = '{segment_filter}' GROUP BY rfm_segment"
        }

    def get_table_total_rows(self, table_name: str = "customer_rfm_summary") -> int:
        """Fetches live row count from BigQuery table metadata."""
        allowed_tables = ["customer_rfm_summary", "customer_demographics_360", "customer_transactions"]
        if table_name not in allowed_tables:
            table_name = "customer_rfm_summary"

        if self.use_cloud and self.client:
            try:
                table_ref = self.client.get_table(f"{self.project_id}.{self.dataset_id}.{table_name}")
                return table_ref.num_rows
            except Exception as e:
                logger.error(f"Error fetching table metadata for {table_name}: {e}")
                return 200
        return 200

    def get_sample_customers(self, table_name: str = "customer_rfm_summary", limit: int = 10) -> List[Dict[str, Any]]:
        """Returns sample rows of customer profiles from specified BigQuery table."""
        allowed_tables = ["customer_rfm_summary", "customer_demographics_360", "customer_transactions"]
        if table_name not in allowed_tables:
            table_name = "customer_rfm_summary"

        if self.use_cloud and self.client:
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
                logger.error(f"Error executing BigQuery sample query: {e}")

        # Synthetic fallback
        return [
            {"customer_id": "CUST_001", "rfm_segment": "At-Risk Premium", "recency_days": 120, "frequency": 8, "monetary_value": 4500.0},
            {"customer_id": "CUST_002", "rfm_segment": "Champions", "recency_days": 12, "frequency": 25, "monetary_value": 12500.0},
            {"customer_id": "CUST_003", "rfm_segment": "Loyal Customers", "recency_days": 45, "frequency": 14, "monetary_value": 6200.0}
        ]
