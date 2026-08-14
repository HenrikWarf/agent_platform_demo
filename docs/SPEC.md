# Technical & API Specifications
## GCP Multi-Agent Marketing Platform

---

## 1. REST API Specification

### 1.1 Multi-Agent Chat Endpoint
- **URL**: `POST /api/chat`
- **Description**: Main execution entrypoint on the Cloud Run backend. Proxies requests to the deployed Agent Runtime via `AgentRuntimeClient`.
- **Request**:
```json
{
  "prompt": "What is the average age of customers in the Champions segment?",
  "target_segment": "Champions"
}
```
- **Response** (`ANALYTICS_ONLY` intent):
```json
{
  "status": "SUCCESS",
  "model_armor_passed": true,
  "intent": "ANALYTICS_ONLY",
  "summary": "📊 BigQuery Data Query Result...",
  "analytics": {
    "status": "SUCCESS",
    "skill_executed": "bigquery_customer_analytics",
    "summary": "• Average age for Champions is 42.5 years...",
    "cohort_details": {
      "total_customers_analyzed": 52,
      "target_segment": "Champions",
      "sql_executed": "SELECT AVG(demo.age) ..."
    }
  },
  "strategy": {},
  "content": {},
  "a2a_trace": [
    {
      "sender_id": "orchestrator_agent",
      "receiver_id": "analytics_agent",
      "skill_used": "bigquery_customer_analytics"
    }
  ]
}
```

### 1.2 Agent Runtime Endpoints (Container Routes)
These routes are served by `app/fast_api_app.py` inside the Agent Runtime container:

| Route | Method | Consumer |
|-------|--------|----------|
| `/api/reasoning_engine` | POST | Vertex AI `:query` contract |
| `/api/stream_reasoning_engine` | POST | Vertex AI `:streamQuery` contract |
| `/run_sse` | POST | ADK dev UI streaming |
| `/apps/{app_name}/users/{user_id}/sessions` | Various | ADK session management |
| `/a2a/{app_name}` | POST | A2A JSON-RPC protocol |
| `/a2a/{app_name}/.well-known/agent-card.json` | GET | A2A agent card discovery |
| `/feedback` | POST | Structured feedback logging |

### 1.3 System Health & Version Endpoints
- **URL**: `GET /api/health` & `GET /health`
```json
{
  "status": "HEALTHY",
  "service": "gcp-agent-platform-backend",
  "version": "v1.2.0",
  "environment": "production",
  "gcp_project": "agent-demo-09"
}
```
- **URL**: `GET /api/version` — Returns deployment parameters, Agent Runtime resource ID, and Model Armor metadata.

### 1.4 Skill Store Endpoints
- **URL**: `GET /api/skills` — Returns marketing skills (filters out `google-agents-cli-*` dev skills).
- **URL**: `GET /api/skills/{skill_id}` — Returns raw `SKILL.md` content.

### 1.5 BigQuery Data Inspector
- **URL**: `GET /api/bigquery/sample`
- **Parameters**: `table_name` (default: `customer_rfm_summary`), `limit` (default: `10`)

### 1.6 Traffic Simulator
- **URL**: `GET /api/simulator/status`
- **URL**: `POST /api/simulator/toggle` — Body: `{"active": true}`

---

## 2. BigQuery Data Architecture

### 2.1 Table: `customer_rfm_summary` (200 rows)
| Column | Type | Description |
|--------|------|-------------|
| `customer_id` | STRING | Unique ID (`CUST_001`) |
| `rfm_segment` | STRING | Segment (At-Risk Premium, Champions, Loyal Customers, Recent Buyers, Lost Customers) |
| `recency_days` | INT64 | Days since last transaction |
| `frequency_orders` | INT64 | Total completed orders |
| `total_monetary` | NUMERIC | Lifetime monetary value ($) |

### 2.2 Table: `customer_demographics_360` (200 rows)
| Column | Type | Description |
|--------|------|-------------|
| `customer_id` | STRING | Unique ID |
| `full_name` | STRING | Customer name |
| `email` | STRING | Email address |
| `age` | INT64 | Age in years |
| `location_city` | STRING | Primary metro city |
| `location_country` | STRING | Primary country |
| `income_bracket` | STRING | Income bracket ($100k-$150k) |
| `preferred_communication_channel` | STRING | Email, LinkedIn, SMS |
| `churn_risk_score` | NUMERIC | Churn probability (0.00–1.00) |
| `lifetime_value_tier` | STRING | Tier 1 VIP, Tier 2 Enterprise, Tier 3 Standard |

### 2.3 Table: `customer_transactions` (400 rows)
| Column | Type | Description |
|--------|------|-------------|
| `transaction_id` | STRING | Unique transaction ID |
| `customer_id` | STRING | Foreign key |
| `amount` | NUMERIC | Transaction amount ($) |
| `transaction_date` | TIMESTAMP | Purchase timestamp |

---

## 3. Evaluation & Benchmarking

### 3.1 ADK Eval Framework (`agents-cli eval`)
The project uses the scaffolded evaluation framework:

```bash
# Generate eval traces from dataset
agents-cli eval generate

# Grade agent responses
agents-cli eval grade
```

- **Dataset**: `tests/eval/datasets/basic-dataset.json`
- **Config**: `tests/eval/eval_config.yaml`
- **Custom Scorer**: `tests/eval/response_quality.py`

### 3.2 Legacy Eval Suite (`eval/run_eval.py`)
- **Runner**: `PYTHONPATH=. ./venv/bin/python eval/run_eval.py`
- **Dataset**: `eval/dataset/golden_marketing_prompts.json`
- **Scoring**: Intent validation, A2A routing, NL2SQL generation, Model Armor blocking
- **Target**: `100.0% (3/3 Passed)`

---

## 4. Deployment Metadata

### 4.1 `deployment_metadata.json`
Written by `agents-cli deploy`:
```json
{
  "remote_agent_runtime_id": "projects/1047232371360/locations/us-central1/reasoningEngines/3829020106671783936",
  "deployment_target": "agent_runtime",
  "is_a2a": false,
  "agent_directory": "app"
}
```

### 4.2 `agents-cli-manifest.yaml`
Project metadata for the CLI:
```yaml
name: agent-platform-demo
base_template: adk
agent_directory: app
acli_version: 1.3.1
create_params:
  deployment_target: agent_runtime
```

---

## 5. Observability Specifications

### 5.1 Cloud Logging Log Analytics
- **Bucket**: `projects/agent-demo-09/locations/global/buckets/_Default`
- **Analytics**: Enabled via `gcloud logging buckets update _Default --enable-analytics`

### 5.2 Telemetry IAM
- **Service Accounts**: `agent-platform-sa`, Compute Engine SA, Vertex AI Service Agent
- **Roles**: `cloudtrace.agent`, `logging.logWriter`, `monitoring.metricWriter`, `monitoring.admin`, `aiplatform.admin`

### 5.3 Pre-Commit Linter (`scripts/pre_commit_lint.sh`)
- Python `py_compile` across `agents/`, `backend/`, `deploy/`, `eval/`, `app/`
- React ESLint via `cd frontend && npm run lint`
