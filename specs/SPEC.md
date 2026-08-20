# Technical & API Specifications
## GCP Multi-Agent Marketing Platform

---

## 1. REST API Specification

### 1.1 Multi-Agent Chat Endpoint
- **URL**: `POST /api/chat`
- **Description**: Main execution entrypoint on the Cloud Run backend. Proxies requests cleanly to the deployed Agent Runtime via `AgentRuntimeClient` using `:streamQuery` governed by Agent Gateway & Model Armor.
- **Request**:
```json
{
  "prompt": "Compare average customer recency and lifetime monetary EUR for 'VIP Fashionistas' vs 'Dormant At-Risk'."
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
    "skill_executed": "bigquery-customer-analytics",
    "summary": "• VIP Fashionistas average recency: 12.4 days, total spend: €4,250...",
    "cohort_details": {
      "total_customers_analyzed": 300,
      "sql_executed": "SELECT rfm_segment, AVG(recency_days), SUM(total_monetary_eur) FROM `agent-demo-09.marketing_analytics.customer_rfm_summary` GROUP BY rfm_segment"
    }
  },
  "strategy": {},
  "content": {},
  "a2a_trace": [
    {
      "sender_id": "orchestrator_agent",
      "receiver_id": "analytics_agent",
      "skill_used": "bigquery-customer-analytics"
    }
  ]
}
```

### 1.2 Dynamic AI Follow-Up Suggestions Endpoint
- **URL**: `POST /api/suggestions/generate`
- **Description**: Inspects recent conversation history and uses Gemini 3.6 Flash on Vertex AI (`location=global`) to generate 6 hyper-relevant, structured follow-up questions mapped to target agents.
- **Request**:
```json
{
  "messages": [
    { "role": "user", "content": "Analyze churn risk for VIP customers." },
    { "role": "assistant", "content": "Found 45 VIP customers with average churn risk 0.12..." }
  ]
}
```
- **Response**:
```json
{
  "questions": [
    {
      "title": "VIP Platinum Fashion Week Preview",
      "prompt": "Create an exclusive private preview campaign for 'VIP Fashionistas' with double Crazy Club points.",
      "agent": "Multi-Agent Orchestrator",
      "badge": "VIP Flow",
      "color": "#3b82f6",
      "category": "campaign"
    }
  ]
}
```

### 1.3 Agent Runtime Endpoints (Container Routes)
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

### 1.4 System Health & Version Endpoints
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

### 1.5 Skill Store Endpoints
- **URL**: `GET /api/skills` — Returns marketing skills (`bigquery-customer-analytics`, `campaign-framework`, `brand-voice-craft`) and filters out `google-agents-cli-*` dev skills.
- **URL**: `GET /api/skills/{skill_id}` — Returns raw `SKILL.md` content.

### 1.6 BigQuery Data Inspector
- **URL**: `GET /api/bigquery/sample`
- **Parameters**: `table_name` (default: `customer_rfm_summary`), `limit` (default: `10`)

### 1.7 Traffic Simulator
- **URL**: `GET /api/simulator/status`
- **URL**: `POST /api/simulator/toggle` — Body: `{"active": true}`

---

## 2. BigQuery Data Architecture (Crazy Fashion — Nordic Retail)
- **Dataset**: `agent-demo-09.marketing_analytics`
- **Currency**: EUR (€)
- **Customer Segments**: `VIP Fashionistas`, `Loyal Regulars`, `Seasonal Shoppers`, `New Explorers`, `Dormant At-Risk`

### 2.1 Table: `customer_rfm_summary` (300 records)
| Column | Type | Description |
|--------|------|-------------|
| `customer_id` | STRING | Unique ID (`CUST_0001` - `CUST_0300`) |
| `rfm_segment` | STRING | RFM Customer Segment |
| `recency_days` | INT64 | Days since last order (1 - 365) |
| `frequency_orders` | INT64 | Total lifetime order count (1 - 42) |
| `total_monetary_eur` | NUMERIC | Lifetime spend in EUR (€45 - €8,400) |

### 2.2 Table: `customer_demographics_360` (300 records)
| Column | Type | Description |
|--------|------|-------------|
| `customer_id` | STRING | Unique customer foreign key |
| `full_name` | STRING | Customer Nordic name (e.g. Astrid Lindgren) |
| `email` | STRING | Customer email address |
| `age` | INT64 | Customer age (18 - 72) |
| `gender` | STRING | Female, Male, Non-Binary |
| `location_city` | STRING | Stockholm, Oslo, Copenhagen, Helsinki, Gothenburg |
| `location_country` | STRING | Sweden, Norway, Denmark, Finland |
| `income_bracket` | STRING | EUR income tier (€30k-€50k, €50k-€80k, €80k-€120k, €120k+) |
| `preferred_communication_channel` | STRING | Email, Instagram, SMS, App Push |
| `preferred_category` | STRING | Womenswear, Menswear, Accessories, Knitwear |
| `loyalty_tier` | STRING | Platinum Member, Gold Member, Silver Member, Bronze Member |
| `crazy_club_points` | INT64 | Crazy Club loyalty reward points |
| `churn_risk_score` | NUMERIC | Churn probability (0.00 - 1.00) |

### 2.3 Table: `customer_transactions` (900 records)
| Column | Type | Description |
|--------|------|-------------|
| `transaction_id` | STRING | Unique transaction ID (`TXN_0001` - `TXN_0900`) |
| `customer_id` | STRING | Customer ID foreign key |
| `product_id` | STRING | Product ID (`PROD_01` - `PROD_50`) |
| `product_name` | STRING | Product catalog name |
| `category` | STRING | Womenswear, Menswear, Accessories, Shoes |
| `amount_eur` | NUMERIC | Transaction line item amount in EUR |
| `quantity` | INT64 | Units purchased |
| `channel` | STRING | Online, In-Store, App |
| `store_city` | STRING | Store location / fulfillment center |
| `transaction_date` | TIMESTAMP | Timestamp of transaction |

### 2.4 Table: `product_catalog` (50 records)
| Column | Type | Description |
|--------|------|-------------|
| `product_id` | STRING | Catalog SKU ID |
| `product_name` | STRING | Nordic fashion item name |
| `category` | STRING | Womenswear, Menswear, Kids & Baby, Accessories |
| `subcategory` | STRING | Knitwear, Denim, Outerwear, Dresses, Footwear |
| `price_eur` | NUMERIC | Retail price in EUR |
| `description` | STRING | Scandinavian design product description |
| `sustainability_certified` | BOOLEAN | Eco-friendly / recycled fabrics certification |
| `collection` | STRING | Autumn Nordic Minimalist, Summer Capsule, Winter Warmth |

### 2.5 Table: `customer_events` (1500 records)
| Column | Type | Description |
|--------|------|-------------|
| `event_id` | STRING | Unique behavioral telemetry ID |
| `customer_id` | STRING | Customer ID foreign key |
| `event_type` | STRING | purchase, website_visit, app_open, newsletter_signup, cart_abandon, wishlist_add |
| `event_date` | TIMESTAMP | Behavioral event timestamp |
| `product_id` | STRING | Associated product SKU |
| `channel` | STRING | Online, App, In-Store |
| `device` | STRING | iOS, Android, Desktop, Tablet |
| `session_duration_seconds` | INT64 | User session length |

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
- Python Ruff Linter (`ruff check .`) for style and syntax consistency
- Python syntax & module compilation across `agents/`, `backend/`, `deploy/`, `eval/`, `app/`
- React ESLint via `cd frontend && npm run lint`
