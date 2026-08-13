# Technical & API Specifications (SPEC.md)
## GCP Multi-Agent Marketing Platform

---

## 1. REST API Specification & Endpoint Specs

### 1.1 Multi-Agent Chat & Orchestration Endpoint
- **URL**: `POST /api/chat`
- **Description**: Main execution entrypoint. Validates user prompt through Model Armor, determines intent (`ANALYTICS_ONLY`, `STRATEGY_ONLY`, `FULL_CAMPAIGN`), and dispatches A2A messages across subagents.
- **Request Parameters**:
  - `prompt` (*string*, required): User's natural language question, objective, or marketing command.
  - `target_segment` (*string*, optional, default: `"At-Risk Premium"`): Cohort target filter (`"All Cohorts (Full Dataset)"`, `"At-Risk Premium"`, `"Champions"`, `"Loyal Customers"`, `"Recent Buyers"`).

- **Request Example**:
```json
{
  "prompt": "What is the average age of customers in the Champions segment?",
  "target_segment": "Champions"
}
```

- **Response Schema (`ANALYTICS_ONLY` Intent)**:
```json
{
  "status": "SUCCESS",
  "model_armor_passed": true,
  "intent": "ANALYTICS_ONLY",
  "user_prompt": "What is the average age of customers in the Champions segment?",
  "summary": "📊 **BigQuery Data Query Result**:\n\n• Average age for Champions is 42.5 years with average monetary spend of $12,500.00.\n\n**BigQuery SQL Executed:**\n```sql\nSELECT AVG(demo.age) AS avg_age FROM `agent-demo-09.marketing_analytics.customer_demographics_360` demo JOIN `agent-demo-09.marketing_analytics.customer_rfm_summary` rfm ON demo.customer_id = rfm.customer_id WHERE rfm.rfm_segment = 'Champions'\n```",
  "analytics": {
    "status": "SUCCESS",
    "skill_executed": "bigquery_customer_analytics",
    "summary": "• Average age for Champions is 42.5 years...",
    "cohort_details": {
      "total_customers_analyzed": 52,
      "target_segment": "Champions",
      "count_in_segment": 52,
      "sql_executed": "SELECT AVG(demo.age) ...",
      "custom_results": [{"avg_age": 42.5}]
    }
  },
  "strategy": {},
  "content": {},
  "model_armor": {
    "passed": true,
    "filter_reason": "Clean",
    "sanitized_prompt": "What is the average age of customers in the Champions segment?"
  },
  "a2a_trace": [
    {
      "sender_id": "orchestrator_agent",
      "receiver_id": "analytics_agent",
      "intent": "ANALYZE_CUSTOMER_COHORTS",
      "skill_used": "bigquery_customer_analytics"
    }
  ]
}
```

### 1.2 Vertex AI Reasoning Engine Streaming Endpoint
- **URL**: `POST /api/query_reasoning_engine` & `POST /api/stream_reasoning_engine`
- **Request Body**: Accepts standard Reasoning Engine request wrapper:
```json
{
  "input": {
    "prompt": "Analyze churn risk for At-Risk Premium customer segment and generate win-back strategy",
    "target_segment": "At-Risk Premium"
  }
}
```

### 1.3 System Health & Version Endpoints
- **URL**: `GET /api/health` & `GET /health`
- **Response**:
```json
{
  "status": "HEALTHY",
  "service": "gcp-agent-platform-backend",
  "version": "v1.2.0",
  "environment": "production",
  "gcp_project": "agent-demo-09",
  "region": "us-central1",
  "cloud_mode": true
}
```

- **URL**: `GET /api/version`
- **Response**: Returns active deployment parameters, Agent Runtime Reasoning Engine resource IDs, Agent Gateway URLs, and Model Armor floor metadata.

### 1.4 Agent Registry & Skill Store Endpoints
- **URL**: `GET /api/skills`
- **Response**: Returns active application marketing skills while filtering out CLI dev skills (`google-agents-cli-*`).
```json
{
  "skills": [
    {
      "name": "bigquery_customer_analytics",
      "description": "Queries customer RFM segmentation metrics and demographic data in BigQuery.",
      "bound_agent": "AnalyticsAgent"
    },
    {
      "name": "omnichannel_strategy",
      "description": "Formulates omnichannel campaign strategy frameworks and ROI projections.",
      "bound_agent": "StrategyAgent"
    },
    {
      "name": "brand_voice",
      "description": "Generates brand-aligned subject lines, email templates, and LinkedIn ad copy.",
      "bound_agent": "ContentAgent"
    }
  ]
}
```

- **URL**: `GET /api/skills/{skill_id}`
- **Parameters**: `skill_id` (path parameter, string, e.g. `bigquery_customer_analytics`)
- **Response**: Returns complete raw markdown contents of `SKILL.md`.

### 1.5 BigQuery Data Inspector Endpoint
- **URL**: `GET /api/bigquery/sample`
- **Parameters**:
  - `table_name` (*string*, optional, default: `"customer_rfm_summary"`): Target table (`"customer_rfm_summary"`, `"customer_demographics_360"`, `"customer_transactions"`).
  - `limit` (*integer*, optional, default: `10`): Number of sample rows to retrieve.
- **Response**:
```json
{
  "dataset": "marketing_analytics",
  "table": "customer_rfm_summary",
  "total_rows": 200,
  "sample_data": [
    {
      "customer_id": "CUST_001",
      "rfm_segment": "At-Risk Premium",
      "recency_days": 120,
      "frequency_orders": 8,
      "total_monetary": 4500.0
    }
  ]
}
```

### 1.6 Traffic Load Simulator Controls
- **URL**: `GET /api/simulator/status` -> Returns `{"active": false, "generated_count": 42}`
- **URL**: `POST /api/simulator/toggle` -> Request body: `{"active": true}`

---

## 2. BigQuery Data Architecture Schemas

### 2.1 Table: `agent-demo-09.marketing_analytics.customer_rfm_summary`
| Column Name | Data Type | Mode | Description |
| :--- | :--- | :--- | :--- |
| `customer_id` | STRING | REQUIRED | Unique customer identifier (e.g. `CUST_001`) |
| `rfm_segment` | STRING | REQUIRED | Segment (`At-Risk Premium`, `Champions`, `Loyal Customers`, `Recent Buyers`, `Lost Customers`) |
| `recency_days` | INT64 | NULLABLE | Days elapsed since last completed transaction |
| `frequency_orders` | INT64 | NULLABLE | Total completed orders count |
| `total_monetary` | NUMERIC | NULLABLE | Total lifetime monetary value ($) |

### 2.2 Table: `agent-demo-09.marketing_analytics.customer_demographics_360`
| Column Name | Data Type | Mode | Description |
| :--- | :--- | :--- | :--- |
| `customer_id` | STRING | REQUIRED | Unique customer identifier |
| `full_name` | STRING | NULLABLE | Customer primary contact full name |
| `email` | STRING | NULLABLE | Primary email address |
| `age` | INT64 | NULLABLE | Customer age in years |
| `location_city` | STRING | NULLABLE | Primary metro location city |
| `location_country` | STRING | NULLABLE | Primary location country |
| `income_bracket` | STRING | NULLABLE | Household income bracket (e.g. `$100k-$150k`) |
| `preferred_communication_channel` | STRING | NULLABLE | Preferred outreach channel (`Email`, `LinkedIn`, `SMS`) |
| `favorite_product_features` | STRING | NULLABLE | Primary product module used |
| `churn_risk_score` | NUMERIC | NULLABLE | Predicted churn probability score (`0.00` to `1.00`) |
| `lifetime_value_tier` | STRING | NULLABLE | Value tier (`Tier 1 VIP`, `Tier 2 Enterprise`, `Tier 3 Standard`) |

### 2.3 Table: `agent-demo-09.marketing_analytics.customer_transactions`
| Column Name | Data Type | Mode | Description |
| :--- | :--- | :--- | :--- |
| `transaction_id` | STRING | REQUIRED | Unique transaction transaction ID |
| `customer_id` | STRING | REQUIRED | Foreign key customer identifier |
| `customer_name` | STRING | NULLABLE | Customer name |
| `email` | STRING | NULLABLE | Customer email |
| `segment` | STRING | NULLABLE | Transaction segment tag |
| `amount` | NUMERIC | NULLABLE | Transaction amount ($) |
| `transaction_date` | TIMESTAMP | NULLABLE | ISO timestamp of purchase |

---

## 3. Benchmark Quality Evaluation Suite (`eval/run_eval.py`)
- **Evaluation Runner**: `PYTHONPATH=. ./venv/bin/python eval/run_eval.py`
- **Dataset File**: `eval/dataset/golden_marketing_prompts.json`
- **Scoring Criteria**:
  1. `eval_01`: Validates `FULL_CAMPAIGN` intent, A2A routing, live Gemini NL2SQL generation, strategy matrix, and email copy.
  2. `eval_02`: Validates `Champions` cohort analytics, high-value retention strategy, and social copy.
  3. `eval_03`: Prompt injection attack simulation -> verifies Model Armor returns status `BLOCKED_BY_MODEL_ARMOR`.
- **Target Pass Benchmark**: `100.0% (3/3 Passed)`.

