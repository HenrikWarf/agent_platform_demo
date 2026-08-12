# Technical & API Specifications (SPEC.md)
## GCP Multi-Agent Marketing Platform

---

## 1. REST API Specification

### 1.1 Chat & Agent Execution Endpoint
- **URL**: `POST /api/chat`
- **Request Body**:
```json
{
  "prompt": "How many customers do we have in total?",
  "target_segment": "All Cohorts (Full Dataset)"
}
```
- **Response Schema**:
```json
{
  "status": "SUCCESS",
  "model_armor_passed": true,
  "intent": "ANALYTICS_ONLY",
  "summary": "📊 **BigQuery Cohort Data Query Result for 'All Cohorts (Full Dataset)'**:\n\n• **Customer Count:** `200`\n• **Average Recency:** `90.8` days\n• **Average Monetary Spend:** `$2,475.76`\n• **Total Revenue at Risk:** `$495,152.98`\n\n**BigQuery SQL Executed:**\n```sql\nSELECT ...\n```",
  "analytics": {
    "total_customers_analyzed": 200,
    "target_segment": "All Cohorts (Full Dataset)",
    "count_in_segment": 200,
    "avg_recency_days": 90.8,
    "avg_monetary_val": 2475.76,
    "total_segment_revenue_at_risk": 495152.98,
    "sql_executed": "SELECT ..."
  },
  "strategy": {},
  "content": {}
}
```

### 1.2 BigQuery Sample Inspector Endpoint
- **URL**: `GET /api/bigquery/sample?table_name=customer_rfm_summary`
- **Response Schema**:
```json
{
  "status": "SUCCESS",
  "table_name": "customer_rfm_summary",
  "total_rows": 200,
  "sample_rows": [
    {
      "customer_id": "CUST_001",
      "rfm_segment": "At-Risk Premium",
      "recency_days": 120,
      "frequency": 8,
      "monetary_value": 4500.0
    }
  ]
}
```

### 1.3 Skill Store Endpoint
- **URL**: `GET /api/skills`
- **Response Schema**: Returns active marketing domain skills while filtering out CLI dev skills (`google-agents-cli-*`).
```json
[
  {
    "name": "bigquery_customer_analytics",
    "description": "Queries BigQuery RFM customer segment statistics.",
    "agent": "AnalyticsAgent"
  },
  {
    "name": "omnichannel_strategy",
    "description": "Formulates multi-channel campaign strategy frameworks.",
    "agent": "StrategyAgent"
  },
  {
    "name": "brand_voice",
    "description": "Generates brand-aligned email and ad creative copy.",
    "agent": "ContentAgent"
  }
]
```

---

## 2. BigQuery Data Schema Specs

### 2.1 Table: `agent-demo-09.marketing_analytics.customer_rfm_summary`
| Column Name | Data Type | Mode | Description |
| :--- | :--- | :--- | :--- |
| `customer_id` | STRING | REQUIRED | Unique customer identifier (e.g. `CUST_001`) |
| `rfm_segment` | STRING | REQUIRED | RFM segment (`At-Risk Premium`, `Champions`, `Loyal Customers`, `Need Attention`) |
| `recency_days` | INTEGER | NULLABLE | Days since last purchase |
| `frequency` | INTEGER | NULLABLE | Total number of completed transactions |
| `total_monetary` | FLOAT | NULLABLE | Lifetime monetary value ($) |

### 2.2 Table: `agent-demo-09.marketing_analytics.customer_demographics_360`
| Column Name | Data Type | Mode | Description |
| :--- | :--- | :--- | :--- |
| `customer_id` | STRING | REQUIRED | Unique customer identifier |
| `age` | INTEGER | NULLABLE | Customer age in years |
| `income` | FLOAT | NULLABLE | Annual household income ($) |
| `location` | STRING | NULLABLE | Primary geographical state/region |
| `industry` | STRING | NULLABLE | Customer industry sector |

---

## 3. Evaluation Benchmark Dataset (`eval/dataset/golden_marketing_prompts.json`)
The application includes a quality evaluation suite that benchmarks model performance across prompt inputs against expected intent routing and skill bindings:
- **Test Scenarios**:
  - Analytics Query Intent test -> expected skill `bigquery_customer_analytics`.
  - Strategy Generation Intent test -> expected skill `omnichannel_strategy`.
  - Creative Asset Generation test -> expected skill `brand_voice`.
  - Model Armor Injection Defense test -> expected status `BLOCKED`.
