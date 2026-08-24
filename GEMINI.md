# GCP Multi-Agent Marketing Platform - Project Guide & State Log

## Overview
This repository implements an enterprise-grade multi-agent marketing application for **Crazy Fashion** (Nordic fashion retailer) using the **Google Agent Development Kit (ADK)**, **Agent-to-Agent (A2A) Protocol**, **Google BigQuery**, **Agent Gateway & Model Armor**, and **Gemini** models.

The system processes marketing objectives for Crazy Fashion, runs BigQuery customer segment analytics across 5 tables (300 customers, 50 products, 900 transactions, 1500 events), formulates omnichannel strategies, and generates brand-aligned creative content.

---

## System Architecture

```
                                    +-----------------------+
                                    |     React Frontend    |
                                    | (Light/Dark Mode, Vite)|
                                    +-----------+-----------+
                                                |
                                                v (REST HTTP/JSON)
                                    +-----------------------+
                                    |    FastAPI Backend     |
                                    |   (Cloud Run / Local)  |
                                    +-----------+-----------+
                                                |
                                                v (:streamQuery)
                                    +-----------------------+
                                    |    Agent Gateway       |
                                    | (Model Armor Enforce)  |
                                    +-----------+-----------+
                                                |
                                    +-----------------------+
                                    | Agent Engine (ADK)     |
                                    | marketing_orchestrator |
                                    +-----------+-----------+
                                                |
                      +-------------------------+-------------------------+
                      | (LLM delegation)        | (LLM delegation)       | (LLM delegation)
                      v                         v                         v
          +-----------------------+ +-----------------------+ +-----------------------+
          |    Analytics Agent    | |  Strategy Pipeline    | |   Content Pipeline    |
          | (BigQuery SQL tool)   | | (SequentialAgent)     | |   (SequentialAgent)   |
          +-----------+-----------+ +-----------------------+ +-----------------------+
                      |
                      v
          +-----------------------+
          |    Google BigQuery    |
          |  (agent-demo-09)      |
          +-----------------------+
```

---

## Active Component Blueprint

### 1. Agents & Skills (ADK — `app/` directory)
- **Root Orchestrator** ([app/agent.py](file:///Users/henrikw/Projects/agent_platform_demo/app/agent.py)):
  - `marketing_orchestrator` — LLM-driven delegation to sub-agents.
  - Routes data queries → `analytics_agent`; strategy → `strategy_pipeline`; campaigns → all agents.
- **Analytics Agent** ([app/agent.py](file:///Users/henrikw/Projects/agent_platform_demo/app/agent.py)):
  - Binds skill from `skills/bigquery-customer-analytics/`.
  - Tool: `query_customer_data` — executes BigQuery SQL against customer tables.
- **Strategy Pipeline** (SequentialAgent):
  - `strategy_reasoning_agent` (with `skills/campaign-framework/` skill) → `strategy_json_agent` (Pydantic structured output).
- **Content Pipeline** (SequentialAgent):
  - `content_reasoning_agent` (with `skills/brand-voice-craft/` skill) → `content_json_agent` (Pydantic structured output).
- **A2A Protocol**: Agent serves A2A at `/.well-known/agent-card.json` and `/a2a/app` JSON-RPC endpoint ([app/app_utils/a2a.py](file:///Users/henrikw/Projects/agent_platform_demo/app/app_utils/a2a.py)).
- **FastAPI App**: [app/fast_api_app.py](file:///Users/henrikw/Projects/agent_platform_demo/app/fast_api_app.py) — ADK `get_fast_api_app()` with A2A routes, Reasoning Engine adapter, OTel Cloud Trace.

### 2. BigQuery Data Architecture
- **GCP Project**: `agent-demo-09`
- **Dataset**: `marketing_analytics`
- **Company Context**: Crazy Fashion (Nordic fashion retailer, modeled after H&M)
- **Tables**:
  - `customer_rfm_summary`: 300 records (`customer_id`, `rfm_segment`, `recency_days`, `frequency_orders`, `total_monetary_eur`)
  - `customer_demographics_360`: 300 records (`customer_id`, `full_name`, `age`, `gender`, `location_city`, `location_country`, `income_bracket`, `preferred_category`, `loyalty_tier`, `crazy_club_points`, `churn_risk_score`)
  - `customer_transactions`: 900 records (`transaction_id`, `customer_id`, `product_id`, `product_name`, `category`, `amount_eur`, `quantity`, `channel`, `store_city`)
  - `product_catalog`: 50 records (`product_id`, `product_name`, `category`, `subcategory`, `price_eur`, `sustainability_certified`, `collection`)
  - `customer_events`: 1500 records (`event_id`, `customer_id`, `event_type`, `event_date`, `product_id`, `channel`, `device`)
- **Segments**: `VIP Fashionistas`, `Loyal Regulars`, `Seasonal Shoppers`, `New Explorers`, `Dormant At-Risk`
- **Currency**: EUR (€)
- **Data Seeder**: [deploy/seed_bigquery_data.py](file:///Users/henrikw/Projects/agent_platform_demo/deploy/seed_bigquery_data.py) (uses batch `load_table_from_json` with `WRITE_TRUNCATE`).

### 3. Frontend Features
- **Theme**: Light Mode default with Dark Mode toggle switch.
- **Tabs**: Chat, Agent Graph, Skills Inspector, BigQuery Data, A2A Explorer, Traffic Simulator & OTel.
- **A2A Explorer**: Fetch Agent Card (full-screen centered modal), send test A2A JSON-RPC messages.
- **Traffic Simulator**: Real synthetic traffic hitting live Agent Runtime, per-agent KPI breakdown (analytics/strategy/content), recent requests table with agent badges.
- **Collapsible Code Accordion**: BigQuery SQL queries render inside `🔍 View Executed BigQuery SQL Query` accordion.
- **Selective UI Rendering**: Strategy & Content response cards render strictly when data payload is present.

### 4. Observability & Prompt-Response Logging
- **GCS Bucket**: `gs://agent-demo-09-agent-platform-logs` — JSONL completion files.
- **Cloud Trace**: Full prompt/response in OTel spans (`OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=SPAN_AND_EVENT`).
- **Cloud Logging**: GenAI interaction events with content.
- **IAM Bindings** (on logs bucket):
  - `service-...-re` (Reasoning Engine SA) → `roles/storage.admin` (writes)
  - `cloud-aiplatform-api-robot-prod` → `roles/storage.objectViewer` (evaluation reads)
  - `service-...-aiplatform` (Vertex AI P4SA) → `roles/storage.objectViewer` (Console session viewer)
- **Known Limitation**: Online evaluation monitors fail for multi-agent traces (`gen_ai.system_instructions` not uniform).

---

## Quick Reference Commands

### Running Locally
```bash
# Start backend (Port 8080)
PYTHONPATH=. ./venv/bin/python backend/app.py

# Start frontend (Port 3000)
cd frontend && npm run dev

# Start complete application stack
./start_local.sh
```

### Agent Deployment & Publishing
```bash
# Deploy ADK agent to Agent Runtime
agents-cli deploy --project agent-demo-09 --region us-central1 --no-confirm-project

# Update Agent Runtime env vars (e.g. enable logging)
agents-cli deploy --project agent-demo-09 --region us-central1 --no-confirm-project \
  --update-env-vars "LOGS_BUCKET_NAME=agent-demo-09-agent-platform-logs,..."

# Publish agent to Gemini Enterprise
agents-cli publish gemini-enterprise --project agent-demo-09 --region us-central1
```

### Deployed GCP Endpoints & CI/CD Pipeline
- **Cloud Run Backend**: `https://agent-platform-backend-q5c3bhebga-uc.a.run.app`
- **Cloud Run Frontend**: `https://agent-platform-frontend-1047232371360.us-central1.run.app`
- **Crazy Fashion Agent Runtime**: `projects/1047232371360/locations/us-central1/reasoningEngines/2050269777674371072`
- **ICA Sverige Agent Runtime**: `projects/1047232371360/locations/us-central1/reasoningEngines/8710530676601913344`
- **Agent Gateway**: `projects/agent-demo-09/locations/us-central1/agentGateways/marketing-agent-gateway`
- **GitHub Actions Workflow**: `.github/workflows/deploy-gcp.yml`

---

## Session Change Log & User Preferences

1. **Light Mode Standard**: Default theme initialized to light mode (`data-theme="light"`).
2. **Skill Registry**: Developer CLI skills (`google-agents-cli-*`) hidden from UI skill store.
3. **Selective Intent Routing**: Data queries trigger `ANALYTICS_ONLY` workflow without forcing strategy/content generation.
4. **Data Analytics Skill**: Refactored `rfm_customer_segmentation` to `bigquery_customer_analytics`.
5. **Full Dataset Query**: `All Cohorts (Full Dataset)` set as standard default cohort option.
6. **Data Alignment**: Seeded 200 aligned rows across all BigQuery customer tables.
7. **Dynamic KPI**: Total Cohort Size KPI reflects live 200 count from BigQuery table metadata.
8. **UI Card Visibility**: Strategy & Content card containers hide when payload dict is empty (`Object.keys(...).length > 0`).
9. **SQL Formatting & Accordion**: SQL code block is flush left and placed in collapsible `🔍 View Executed BigQuery SQL Query` accordion.
10. **Dual Environment Versioning**: Added `APP_VERSION` (`v1.2.0`), `ENVIRONMENT`, `/api/health`, and `/api/version` endpoints in `Config` and `app.py`.
11. **Skill Store Registration**: Created `deploy/register_skills.py` to register marketing skills in Agent Registry.
12. **GitHub Actions CI/CD Workflow**: Created `.github/workflows/deploy-gcp.yml` for automated eval, building container images, deploying to Cloud Run & Agent Engine Runtime, and publishing skills.
13. **ADK Agent Refactor**: Migrated from custom `BaseAgent` with `cloudpickle` to `google.adk.agents.Agent` in `app/` directory. Enables `google-adk` framework tag, Cloud Trace telemetry, and `agents-cli deploy`.
14. **Agent Registry Fix**: Replaced per-skill registration (`publish_skills.py`) with single-agent `agents-cli publish gemini-enterprise`. Agent Runtime auto-registers in Agent Registry.
15. **Agent Gateway Clarification**: Renamed `backend/gateway.py` to `backend/safety.py` (`PromptSafetyGuard`). The real Agent Gateway is a managed GCP infra resource provisioned in `deploy/agent_gateway.yaml`.
16. **CI/CD Pipeline Update**: Steps 4-5 now use `agents-cli deploy` + `agents-cli publish` instead of legacy `deploy_agent_engine.py`.
17. **Skill Directory Rename**: Renamed `skills/marketing_analytics/` → `bigquery-customer-analytics/`, `omnichannel_strategy/` → `campaign-framework/`, `brand_voice/` → `brand-voice-craft/`. Updated `deploy/register_skills.py` to match.
18. **Prompt-Response Logging**: Enabled GCS completions, Cloud Trace span content, and Cloud Logging events via 7 env vars on Agent Runtime. Created `gs://agent-demo-09-agent-platform-logs` bucket.
19. **Logging IAM Bindings**: Granted 3 service accounts access to logs bucket (RE SA for writes, API robot for eval reads, Vertex AI P4SA for Console reads).
20. **Online Eval Limitation**: Documented that online evaluation monitors fail for multi-agent traces due to non-uniform `gen_ai.system_instructions`.
21. **A2A Agent Card Modal**: Expanded inline agent card display to full-screen centered modal overlay with blurred backdrop.
22. **RE SA IAM Fix**: Granted `roles/aiplatform.user` to Reasoning Engine SA to fix 401 UNAUTHENTICATED errors when calling Gemini models.
23. **GEMINI_API_KEY Removal**: Removed `GEMINI_API_KEY` env var from Agent Runtime — it conflicted with Vertex AI ADC auth, causing 401 errors. Agent now authenticates via SA credentials only.
24. **Crazy Fashion Rebrand**: Created `app/company_context.py` with full Crazy Fashion company profile. Rewrote BigQuery seed data (3→5 tables: 300 customers with Nordic names, 50 fashion products, 900 transactions, 1500 behavioral events, all EUR). Updated all agent instructions, skills, backend, and frontend branding.
25. **Live Contextual Follow-Up Suggestions**: Built `backend/suggestions_generator.py` and `/api/suggestions/generate` endpoint using `gemini-3.6-flash` on Vertex AI to inspect conversation history & active customer cohorts and generate 6 hyper-relevant, structured follow-up objectives with target agent mappings (`Analytics Agent`, `Strategy Pipeline`, `Content Pipeline`, `Multi-Agent Orchestrator`). Added **"✨ Generate AI Follow-ups"** interactive button to the UI accordion.
26. **Full-Screen Chat Focus View**: Added `[Expand View]` / `[Exit Fullscreen]` toggle button in the top chat control bar with `Escape` key support. Expanding covers all menus, navbar headers, and the A2A protocol visualizer column into a full-view overlay (`position: fixed; inset: 0; z-index: 10000`) for a clean, distraction-free chat experience.
27. **Target Cohort Filter & Prompt Injection Removal**: Removed the `Target Cohort` select dropdown from the chat control bar and eliminated the automatic injection of `\n\nTarget customer segment: ...` into prompts. Chat messages are now sent directly and cleanly as typed by the user or chosen from suggestions without altering the LLM conversation context.
28. **Removed Security & Red-Team Objective Category**: Cleaned up the objective steering catalog in [`ChatInterface.jsx`](file:///Users/henrikw/Projects/agent_platform_demo/frontend/src/components/ChatInterface.jsx) by removing the adversarial `Security & Red-Team` category and questions, focusing user steering entirely on high-value business objectives (`Dynamic & Follow-ups`, `BigQuery Data`, `Campaign Strategy`, `Creative Copy`, and `Full Omnichannel`).
29. **Live Background Execution & Multi-Agent Skill Trace**: Added Server-Sent Events (SSE) streaming (`POST /api/chat/stream`) and interactive UI step visualizer in [`ChatInterface.jsx`](file:///Users/henrikw/Projects/agent_platform_demo/frontend/src/components/ChatInterface.jsx). When a prompt is dispatched, the UI displays real-time agent movements (Orchestrator ➔ Analytics ➔ Strategy ➔ Content ➔ Model Armor), skill activations (`bigquery-customer-analytics`, `campaign-framework`, `brand-voice-craft`), BigQuery SQL tool calls, and provides an expandable background step audit accordion on every completed message.
30. **Channel-Selective Content Generation**: Refactored [`ContentSchema`](file:///Users/henrikw/Projects/agent_platform_demo/app/schemas.py) and [`content_reasoner`](file:///Users/henrikw/Projects/agent_platform_demo/app/agent.py) to make `email_template`, `social_posts`, and `sms_copy` optional. The Content Agent now scopes output strictly to the specific marketing channel(s) requested in the user prompt (e.g. Email-only, Social-only, SMS-only), only generating the full multi-channel suite when explicitly asked. Added dedicated SMS deliverable card rendering in [`ChatInterface.jsx`](file:///Users/henrikw/Projects/agent_platform_demo/frontend/src/components/ChatInterface.jsx).
32. **Visual Agent Identity & Themed Step Tracing**: Upgraded background execution step rendering across live streaming timelines and completed message accordions with distinct, vibrant colors, active glow accents, and 4px left-border indicators for all 6 agents (Orchestrator: Royal Indigo `#4f46e5`, Analytics: Sky Cyan `#0284c7`, Recommender: Emerald Mint `#059669`, Strategy: Electric Violet `#7c3aed`, Content: Warm Amber `#d97706`, Model Armor: Rose Crimson `#e11d48`).
33. **Persistent Multi-Turn Session Management**: Refactored frontend and backend session management to maintain a consistent session across all conversation turns until the user clicks "Clear Chat" or reloads the page. Added session tracking in `App.jsx`, wired `session_id` & `user_id` in `ChatInterface.jsx`, `ChatRequest` in `backend/app.py`, and session caching with `get_or_create_session` in `backend/agent_runtime_client.py`.
34. **Dedicated A2UI Pipeline Agent**: Introduced `a2ui_pipeline` (`SequentialAgent: a2ui_reasoner → a2ui_formatter`) utilizing `A2UIComponentSchema` in `app/agent.py`. Removed false-positive text heuristic rendering in `ChatInterface.jsx` so UI components render strictly when `msg.data.a2ui` is present.
35. **Dual-Client A2UI Component Styling (ICA Stammis Deal Banner & H&M Crazy Fashion Drop Card)**: Designed distinct interactive UI components in `frontend/src/components/A2UIOfferBanner.jsx`:
    - **ICA Sverige**: Swedish grocery Stammis deal banner with red/white styling, deal price numerals (`24:90 kr/st`), comparison price (`16:60/l`), discount savings (`Spara 10:-`), Swedish origin/eco badges, and "Ladda till kortet" Stammis card button.
    - **Crazy Fashion**: H&M-style high-fashion editorial drop card with high contrast, editorial collection headline (`STUDIO COLLECTION // AUTUMN 2026`), member exclusive pill, sustainable materials tag (`100% Recycled Italian Wool 🌿`), interactive size selector (`XS`, `S`, `M`, `L`, `XL`), interactive color swatches, member pricing (`€59.99` vs `€79.99`), Crazy Club points (`+150 Club Points`), garment recycling voucher perk, and interactive bag CTA.
36. **ADR: Native ADK Agent Registry Decision**: Retained **Native ADK (Non-A2A)** registration type in Google Cloud Agent Registry for deployed Reasoning Engine on Vertex AI Agent Runtime (`:streamQuery` binary RPC execution, zero HTTP proxy overhead, direct IAM ADC auth, and full Cloud Trace correlation), while maintaining complete in-runtime A2A protocol endpoint serving (`/.well-known/agent-card.json` and `/a2a/app`). Documented in `specs/ARCHITECTURE_BLUEPRINT.md` and `specs/SPEC.md`.
37. **Dual-Instance Enterprise Deployment & Selective CI/CD Pipeline**: Parameterized ADK agent engine (`TENANT_ID`) and deployed two independent Reasoning Engine instances to Vertex AI Agent Runtime: `crazy-fashion-marketing-agent` (`reasoningEngines/2050269777674371072`) and `ica-sverige-marketing-agent` (`reasoningEngines/8710530676601913344`). Both published to Gemini Enterprise & Agent Registry. Upgraded `.github/workflows/deploy-gcp.yml` with granular path filtering to deploy each agent strictly when its respective code or shared components change.
38. **A2UI Cardinality & Single-Product Quantity Alignment**: Added strict cardinality rules and negative constraints to `a2ui_reasoner` and `a2ui_formatter` in [`app/agent.py`](file:///Users/henrikw/Projects/agent_platform_demo/app/agent.py), and created [`skills/a2ui-personalization/SKILL.md`](file:///Users/henrikw/Projects/agent_platform_demo/skills/a2ui-personalization/SKILL.md). When the user asks for a single product banner, the agent generates strictly 1 hero product deal and leaves `additional_deals` (ICA) and `additional_look_items` (Crazy Fashion) as `null`, avoiding unwanted multi-product bundling unless explicitly requested.


