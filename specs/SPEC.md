# Technical & API Specifications
## GCP Multi-Agent Marketing Platform

---

## 1. REST API Specification

### 1.1 Multi-Agent Chat Endpoint
- **URL**: `POST /api/chat`
- **Description**: Main execution entrypoint on the Cloud Run backend. Proxies requests cleanly to the deployed Agent Runtime via `AgentRuntimeClient` using `:streamQuery` governed by Agent Gateway & Model Armor. Supports stateful multi-turn sessions.
- **Request Schema**:
```json
{
  "prompt": "Recommend 5 products for the Loyal Regulars segment.",
  "target_segment": "Loyal Regulars",
  "session_id": "session-1740045890-a1b2c",
  "user_id": "user-8f92ab1c"
}
```
- **Response** (`RECOMMENDATIONS_ONLY` intent example):
```json
{
  "status": "SUCCESS",
  "model_armor_passed": true,
  "intent": "RECOMMENDATIONS_ONLY",
  "session_id": "session-1740045890-a1b2c",
  "user_id": "user-8f92ab1c",
  "summary": "Curated 5 data-driven Nordic fashion recommendations tailored to Loyal Regulars...",
  "analytics": {},
  "recommendation": {
    "segment_name": "Loyal Regulars",
    "merchandising_strategy": "Highlight sustainable everyday essentials and reward loyalty with Crazy Club point boosters.",
    "projected_impact": "Expected 14% increase in basket size and €42 average order uplift.",
    "recommended_products": [
      {
        "product_id": "PROD_04",
        "product_name": "Recycled Wool Knit Sweater",
        "category": "Womenswear",
        "price_eur": 89.0,
        "sustainability_certified": true,
        "reasoning": "High historical repeat purchase affinity in Knitwear with high sustainability preference."
      }
    ]
  },
  "strategy": {},
  "content": {},
  "a2a_trace": [
    {
      "sender_id": "marketing_orchestrator",
      "receiver_id": "recommendation_pipeline",
      "skill_used": "product-recommender"
    }
  ],
  "steps": [
    {
      "id": "step_orch_1",
      "timestamp": "12:38:15",
      "stage": "orchestrating",
      "agent": "marketing_orchestrator",
      "agent_name": "Orchestrator Agent (A2A Supervisor)",
      "title": "A2A Multi-Agent Supervisor (Active Session)",
      "detail": "Continuing session session-1740045890... Evaluating follow-up context and routing path...",
      "status": "completed",
      "icon": "cpu",
      "session_id": "session-1740045890-a1b2c"
    }
  ]
}
```

### 1.2 Live Background Execution Streaming Endpoint
- **URL**: `POST /api/chat/stream`
- **Media Type**: `text/event-stream` (Server-Sent Events)
- **Description**: Streams live multi-agent execution steps, sub-agent transitions, skill invocations, and BigQuery tool calls in real time from Vertex AI Agent Runtime, concluding with the final structured deliverable cards payload and session ID.
- **Event Types**:
  - `data: {"type": "step", "step": { "id": "...", "timestamp": "...", "stage": "reasoning", "agent": "recommendation_pipeline", "agent_name": "Product Recommendation Pipeline", "title": "Curating 5-Product Assortment", "detail": "Applying skill 'product-recommender' against product_catalog...", "skill": "product-recommender", "status": "running", "icon": "shopping-bag" }}`
  - `data: {"type": "final", "data": { ... full deliverable response ... }, "session_id": "...", "user_id": "...", "steps": [ ... full execution trace ... ]}`
- **Description**: Streams live multi-agent execution steps, sub-agent transitions, skill invocations, and BigQuery tool calls as they occur in real time on Vertex AI Agent Runtime, culminating in the final deliverable cards payload.
- **Event Types**:
  - `data: {"type": "step", "step": { "id": "...", "timestamp": "...", "stage": "delegation", "agent": "analytics_agent", "title": "Routing to Analytics Agent", "detail": "Activating skill 'bigquery-customer-analytics'...", "skill": "bigquery-customer-analytics", "status": "running", "icon": "database" }}`
  - `data: {"type": "final", "data": { ... full deliverable response ... }, "steps": [ ... full execution trace ... ]}`

### 1.3 Dynamic AI Follow-Up Suggestions Endpoint
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
- **URL**: `GET /api/skills` — Returns production marketing skills (`bigquery-customer-analytics`, `product-recommender`, `campaign-framework`, `brand-voice-craft`) and automatically filters out `google-agents-cli-*` developer CLI skills.
- **URL**: `GET /api/skills/{skill_id}` — Returns raw `SKILL.md` content and schema instructions.

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
| `product_id` | STRING | Catalog SKU ID (`PROD_01` - `PROD_50`) |
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

## 3. Evaluation & Quality Flywheel Benchmarking

### 3.1 Golden Marketing Evaluation Benchmark (`eval/dataset/golden_marketing_prompts.json`)
The platform includes an automated 20-case golden benchmark suite spanning 5 core marketing capabilities:
- **BigQuery Customer Analytics (`eval_01` - `eval_06`)**: Direct NL2SQL generation, aggregation, RFM segment comparisons, and multi-table joins.
- **Product Recommendation (`eval_07`, `eval_19`, `eval_20`)**: 5-product assortment curation, price validation in EUR, sustainability matching, and segment attribute alignment.
- **Campaign Strategy (`eval_08` - `eval_11`)**: 3-pillar strategic frameworks, 100% channel mix weightings, and ROI projections.
- **Channel-Selective Creative Content (`eval_12` - `eval_15`)**: Scoped copywriting (Email-only, Social-only, SMS-only under 160 chars, Full omnichannel).
- **Security & Model Armor Adversarial (`eval_16` - `eval_18`)**: Prompt injection, system prompt exfiltration, and jailbreak defense.

### 3.2 Evaluation Execution
```bash
# Run automated golden benchmark evaluation
PYTHONPATH=. ./venv/bin/python eval/run_eval.py

# Run ADK agent evaluation framework
agents-cli eval generate
agents-cli eval grade
```

---

## 4. Visual Agent Identity & Themed Step Tracing

Each agent and platform role is visually distinct across both live streaming execution cards and completed message accordions:

| Agent / Component | Identifier | Hex Color | Left Border | Background Tint | Badge Style |
|---|---|---|---|---|---|
| **Marketing Orchestrator** | `marketing_orchestrator` | `#4f46e5` | `4px solid #4f46e5` | `rgba(79, 70, 229, 0.06)` | Royal Indigo Badge |
| **Customer Insights & Analytics** | `analytics_agent` | `#0284c7` | `4px solid #0284c7` | `rgba(2, 132, 199, 0.06)` | Sky Cyan Badge |
| **Product Recommendation Pipeline** | `recommendation_pipeline` | `#059669` | `4px solid #10b981` | `rgba(16, 185, 129, 0.06)` | Emerald Mint Badge |
| **Omnichannel Strategy Pipeline** | `strategy_pipeline` | `#7c3aed` | `4px solid #7c3aed` | `rgba(124, 58, 237, 0.06)` | Electric Violet Badge |
| **Brand Voice Content Pipeline** | `content_pipeline` | `#d97706` | `4px solid #d97706` | `rgba(217, 119, 6, 0.06)` | Warm Amber Badge |
| **Agent Gateway & Model Armor** | `agent_gateway` | `#e11d48` | `4px solid #e11d48` | `rgba(225, 29, 72, 0.06)` | Rose Coral Badge |

---

## 5. Stateful Session Management & Lifecycle

- **Client Session Persistence**: Maintained via React state in `App.jsx` and `ChatInterface.jsx`. `sessionId` and `userId` are passed in every request payload.
- **Backend Session Caching**: `AgentRuntimeClient.get_or_create_session(user_id, session_id)` registers and verifies sessions on Vertex AI Agent Runtime, allowing the LLM to retain multi-turn context and previous message history.
- **Dynamic Step 1 Header**:
  - Turn 1 / New Session: `A2A Multi-Agent Supervisor Initialized`
  - Subsequent Turns: `A2A Multi-Agent Supervisor (Active Session)`
- **Session Reset**: Triggered explicitly when the user clicks **Clear Chat** or reloads the application page.

---

## 6. Deployment Metadata

### 6.1 `deployment_metadata.json`
Written by `agents-cli deploy`:
```json
{
  "remote_agent_runtime_id": "projects/1047232371360/locations/us-central1/reasoningEngines/3829020106671783936",
  "deployment_target": "agent_runtime",
  "is_a2a": false,
  "agent_directory": "app"
}
```

### 6.2 `agents-cli-manifest.yaml`
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

## 7. Observability Specifications

### 7.1 Cloud Logging Log Analytics
- **Bucket**: `projects/agent-demo-09/locations/global/buckets/_Default`
- **Analytics**: Enabled via `gcloud logging buckets update _Default --enable-analytics`

### 7.2 Telemetry IAM
- **Service Accounts**: `agent-platform-sa`, Compute Engine SA, Vertex AI Service Agent
- **Roles**: `cloudtrace.agent`, `logging.logWriter`, `monitoring.metricWriter`, `monitoring.admin`, `aiplatform.admin`

### 7.3 Pre-Commit Linter (`scripts/pre_commit_lint.sh`)
- Python Ruff Linter (`ruff check .`) for style and syntax consistency
- Python syntax & module compilation across `agents/`, `backend/`, `deploy/`, `eval/`, `app/`
- React ESLint via `cd frontend && npm run lint`
