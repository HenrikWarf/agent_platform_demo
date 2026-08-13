# GCP Multi-Agent Marketing Platform - Project Guide & State Log

## Overview
This repository implements an enterprise-grade multi-agent marketing application using the **Google Agent Development Kit (ADK)**, **Agent-to-Agent (A2A) Protocol**, **Google BigQuery**, **Model Armor**, and **Vertex AI Gemini** models.

The system processes marketing objectives, runs BigQuery customer segment analytics, formulates omnichannel strategies, and generates targeted brand content.

---

## System Architecture

```
                                    +-----------------------+
                                    |     React Frontend    |
                                    | (Light/Dark Mode, Vite)|
                                    +-----------+-----------+
                                                |
                                                v
                                    +-----------------------+
                                    |    FastAPI Backend    |
                                    |    (backend/app.py)   |
                                    +-----------+-----------+
                                                |
                                                v
                                    +-----------------------+
                                    |  Orchestrator Agent   |
                                    | (Model Armor & Intent) |
                                    +-----------+-----------+
                                                |
                      +-------------------------+-------------------------+
                      | (A2A Protocol)          | (A2A Protocol)          | (A2A Protocol)
                      v                         v                         v
          +-----------------------+ +-----------------------+ +-----------------------+
          |    Analytics Agent    | |    Strategy Agent     | |     Content Agent     |
          | (bigquery_analytics)  | | (omnichannel_strat)  | |     (brand_voice)     |
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

### 1. Agents & Skills
- **Orchestrator Agent** ([agents/orchestrator_agent.py](file:///Users/henrikw/Projects/agent_platform_demo/agents/orchestrator_agent.py)):
  - Enforces **Model Armor** prompt injection safety checks.
  - Dynamically classifies user request intent:
    - `ANALYTICS_ONLY`: Executes `AnalyticsAgent` only. Returns data summary + collapsible SQL query accordion.
    - `STRATEGY_ONLY`: Executes `AnalyticsAgent` + `StrategyAgent`.
    - `FULL_CAMPAIGN`: Executes `AnalyticsAgent` -> `StrategyAgent` -> `ContentAgent`.
- **Analytics Agent** ([agents/analytics_agent.py](file:///Users/henrikw/Projects/agent_platform_demo/agents/analytics_agent.py)):
  - Binds skill `bigquery_customer_analytics` ([skills/marketing_analytics/SKILL.md](file:///Users/henrikw/Projects/agent_platform_demo/skills/marketing_analytics/SKILL.md)).
  - Queries customer RFM summary and demographics in BigQuery.
- **Strategy Agent** ([agents/strategy_agent.py](file:///Users/henrikw/Projects/agent_platform_demo/agents/strategy_agent.py)):
  - Binds skill `omnichannel_strategy` ([skills/omnichannel_strategy/SKILL.md](file:///Users/henrikw/Projects/agent_platform_demo/skills/omnichannel_strategy/SKILL.md)).
  - Generates campaign frameworks, channel mix, and ROI projections.
- **Content Agent** ([agents/content_agent.py](file:///Users/henrikw/Projects/agent_platform_demo/agents/content_agent.py)):
  - Binds skill `brand_voice` ([skills/brand_voice/SKILL.md](file:///Users/henrikw/Projects/agent_platform_demo/skills/brand_voice/SKILL.md)).
  - Drafts subject lines, email templates, and ad copy.

### 2. BigQuery Data Architecture
- **GCP Project**: `agent-demo-09`
- **Dataset**: `marketing_analytics`
- **Tables**:
  - `customer_rfm_summary`: 200 records (`customer_id`, `rfm_segment`, `recency_days`, `frequency`, `monetary_value`)
  - `customer_demographics_360`: 200 records (`customer_id`, `age`, `income`, `location`, `industry`)
  - `customer_transactions`: 400 records
- **Data Seeder**: [deploy/seed_bigquery_data.py](file:///Users/henrikw/Projects/agent_platform_demo/deploy/seed_bigquery_data.py) (uses batch `load_table_from_json` with `WRITE_TRUNCATE`).

### 3. Frontend Features
- **Theme**: Light Mode default with Dark Mode toggle switch.
- **Default Target Cohort**: `All Cohorts (Full Dataset)` standard option.
- **Skill Filtering**: Filters out dev/CLI skills (`google-agents-cli-*`), displaying application marketing skills only.
- **Collapsible Code Accordion**: BigQuery SQL queries render inside a left-aligned `<details><summary>` accordion (`🔍 View Executed BigQuery SQL Query`).
- **Selective UI Rendering**: Strategy & Content response cards render strictly when data payload is present.

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

### Seeding & Agent Publishing
```bash
# Seed 200 aligned rows to BigQuery
PYTHONPATH=. ./venv/bin/python deploy/seed_bigquery_data.py

# Deploy ADK agent to Agent Runtime
agents-cli deploy --project agent-demo-09 --region us-central1 --no-confirm-project

# Publish agent to Gemini Enterprise
python deploy/publish_agent.py
```

### Deployed GCP Endpoints & CI/CD Pipeline
- **Cloud Run Backend**: `https://agent-platform-backend-q5c3bhebga-uc.a.run.app`
- **Cloud Run Frontend**: `https://agent-platform-frontend-q5c3bhebga-uc.a.run.app`
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
11. **Skill Store Registration**: Created `deploy/publish_skills.py` to register marketing skills in Agent Registry.
12. **GitHub Actions CI/CD Workflow**: Created `.github/workflows/deploy-gcp.yml` for automated eval, building container images, deploying to Cloud Run & Agent Engine Runtime, and publishing skills.
13. **ADK Agent Refactor**: Migrated from custom `BaseAgent` with `cloudpickle` to `google.adk.agents.Agent` in `app/` directory. Enables `google-adk` framework tag, Cloud Trace telemetry, and `agents-cli deploy`.
14. **Agent Registry Fix**: Replaced per-skill registration (`publish_skills.py`) with single-agent `agents-cli publish gemini-enterprise`. Agent Runtime auto-registers in Agent Registry.
15. **Agent Gateway Clarification**: Renamed `backend/gateway.py` to `backend/safety.py` (`PromptSafetyGuard`). The real Agent Gateway is a managed GCP infra resource provisioned in `deploy/agent_gateway.yaml`.
16. **CI/CD Pipeline Update**: Steps 4-5 now use `agents-cli deploy` + `agents-cli publish` instead of legacy `deploy_agent_engine.py`.

