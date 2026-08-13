# Individual GCP Service Deployment Guide

This guide details how to update and deploy each component of the **Google Cloud Agent Platform** individually directly from your local terminal or CLI without waiting for the full GitHub Actions CI/CD matrix pipeline.

---

## Quick Reference Summary

| GCP Service / Component | Target Deployment Environment | Recommended Command / Executable Script | Estimated Time |
| :--- | :--- | :--- | :--- |
| **FastAPI Backend** | Cloud Run (`agent-platform-backend`) | `./deploy/deploy_backend.sh` | **~45-60s** |
| **React Frontend** | Cloud Run (`agent-platform-frontend`) | `./deploy/deploy_frontend.sh` | **~30-45s** |
| **Vertex AI Agent Engine (All Agents)** | Vertex AI Reasoning Engines | `PYTHONPATH=. ./venv/bin/python deploy/deploy_all_agents_to_agent_runtime.sh` | **~90s** |
| **Single Agent Engine Instance** | Vertex AI Reasoning Engine | `PYTHONPATH=. ./venv/bin/python deploy/deploy_agent_engine.py --agent <agent_id>` | **~30s** |
| **Agent Registry Marketing Skills** | Gemini Enterprise Agent Registry | `PYTHONPATH=. ./venv/bin/python deploy/publish_skills.py` | **~10s** |
| **BigQuery Customer Analytics Dataset** | Google BigQuery | `PYTHONPATH=. ./venv/bin/python deploy/seed_bigquery_data.py` | **~15s** |
| **Agent Gateway & Model Armor** | GCP Network Services & Model Armor | `gcloud alpha network-services agent-gateways import marketing-agent-gateway --source=deploy/agent_gateway.yaml --location=us-central1 --project=agent-demo-09` | **~15s** |
| **Observability, Telemetry & IAM** | Cloud Trace, Cloud Logging & IAM | `./deploy/enable_observability_permissions.sh` | **~20s** |

---

## Detailed Step-by-Step Service Updates

### 1. Update FastAPI Backend (`agent-platform-backend`)

Use this when modifying `backend/app.py`, `backend/gateway.py`, `backend/bq_client.py`, `backend/config.py`, or agent logic called by the server.

#### Option A: Convenient 1-Command Script
```bash
./deploy/deploy_backend.sh
```

#### Option B: Manual `gcloud` Execution
```bash
# 1. Build and push container image via Cloud Build
gcloud builds submit --tag us-central1-docker.pkg.dev/agent-demo-09/agent-platform/backend:latest .

# 2. Deploy revision to Cloud Run
gcloud run deploy agent-platform-backend \
  --image us-central1-docker.pkg.dev/agent-demo-09/agent-platform/backend:latest \
  --region us-central1 \
  --platform managed \
  --port 8080 \
  --allow-unauthenticated \
  --set-env-vars ENVIRONMENT=gcp_cloud,USE_GCP_CLOUD=true,GCP_PROJECT_ID=agent-demo-09,BIGQUERY_DATASET=marketing_analytics,GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY=true,OTEL_TRACES_EXPORTER=google_cloud_trace,OTEL_METRICS_EXPORTER=google_cloud_monitoring,OTEL_LOGS_EXPORTER=google_cloud_logging,ADK_CAPTURE_MESSAGE_CONTENT_IN_SPANS=true,OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=SPAN_AND_EVENT
```

---

### 2. Update React Frontend (`agent-platform-frontend`)

Use this when modifying React components (`frontend/src/components/*`), styles, theme modes, or UI layout.

#### Option A: Convenient 1-Command Script
```bash
./deploy/deploy_frontend.sh
```

#### Option B: Manual `gcloud` Execution
```bash
# 1. Build and push frontend image via Cloud Build
gcloud builds submit --tag us-central1-docker.pkg.dev/agent-demo-09/agent-platform/frontend:latest ./frontend

# 2. Deploy frontend container to Cloud Run
gcloud run deploy agent-platform-frontend \
  --image us-central1-docker.pkg.dev/agent-demo-09/agent-platform/frontend:latest \
  --region us-central1 \
  --platform managed \
  --port 80 \
  --allow-unauthenticated \
  --set-env-vars VITE_BACKEND_URL=https://agent-platform-backend-1047232371360.us-central1.run.app
```

---

### 3. Update Vertex AI Agent Engine Agents

Use this when updating ADK agent logic, prompt definitions, or A2A message handlers in `agents/`.

#### Option A: Deploy All 4 Agents (`analytics_agent`, `strategy_agent`, `content_agent`, `orchestrator_agent`)
```bash
PYTHONPATH=. ./venv/bin/python deploy/deploy_all_agents_to_agent_runtime.sh
```

#### Option B: Deploy a Single Specific Agent
```bash
# Target options: analytics_agent | strategy_agent | content_agent | orchestrator_agent
PYTHONPATH=. ./venv/bin/python deploy/deploy_agent_engine.py --agent analytics_agent
```

---

### 4. Update Agent Registry Marketing Skills

Use this when adding, updating, or re-indexing marketing skills (`skills/marketing_analytics`, `skills/omnichannel_strategy`, `skills/brand_voice`).

```bash
PYTHONPATH=. ./venv/bin/python deploy/publish_skills.py
```

---

### 5. Reseed BigQuery Customer Dataset & Tables

Use this when modifying customer schema or resetting RFM metrics/demographics data.

```bash
PYTHONPATH=. ./venv/bin/python deploy/seed_bigquery_data.py
```

---

### 6. Update Agent Gateway & Model Armor Policies

Use this when updating `deploy/agent_gateway.yaml` routing specifications or Model Armor floor policies.

```bash
# Import Agent Gateway specification
gcloud alpha network-services agent-gateways import marketing-agent-gateway \
  --source=deploy/agent_gateway.yaml \
  --location=us-central1 \
  --project=agent-demo-09 \
  --quiet

# Re-apply Model Armor Security Floor Policy
PYTHONPATH=. ./venv/bin/python deploy/setup_model_armor.py
```

---

### 7. Re-apply Observability, Telemetry & IAM Permissions

Use this when updating OpenTelemetry APIs, Log Analytics on `_Default` bucket, or Service Account IAM roles.

```bash
./deploy/enable_observability_permissions.sh
```

---

## Local Pre-Commit Check (Recommended Before Deploying)

Run the pre-commit quality check locally before executing individual service deployments:

```bash
./scripts/pre_commit_lint.sh
```
