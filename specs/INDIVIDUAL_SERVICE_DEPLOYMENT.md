# Individual GCP Service Deployment Guide

This guide details how to update and deploy each component individually from your local terminal without waiting for the full CI/CD pipeline.

---

## Quick Reference

| Component | Target | Command | Time |
|-----------|--------|---------|------|
| **ADK Agent** | Agent Runtime (Reasoning Engine) | `agents-cli deploy` | **~2-5 min** |
| **FastAPI Backend** | Cloud Run (`agent-platform-backend`) | `./deploy/deploy_backend.sh` | **~45-60s** |
| **React Frontend** | Cloud Run (`agent-platform-frontend`) | `./deploy/deploy_frontend.sh` | **~30-45s** |
| **Gemini Enterprise** | Agent Registry | `agents-cli publish gemini-enterprise` | **~15s** |
| **BigQuery Data** | BigQuery tables | `PYTHONPATH=. ./venv/bin/python deploy/seed_bigquery_data.py` | **~15s** |
| **Agent Gateway** | Network Services | `gcloud alpha network-services agent-gateways import ...` | **~15s** |
| **Observability IAM** | IAM & APIs | `./deploy/enable_observability_permissions.sh` | **~20s** |

---

## Detailed Step-by-Step

### 1. Deploy ADK Agent to Agent Runtime

Use this when modifying agent logic in `app/agent.py`, tools, or the orchestrator/subagent code.

```bash
# Deploy or update the Reasoning Engine instance
agents-cli deploy --project agent-demo-09 --region us-central1 --no-confirm-project
```

This packages the `app/` directory, builds a container from `Dockerfile` (using `uv sync --frozen`), and creates/updates the Reasoning Engine. The result is written to `deployment_metadata.json`.

**Verify the deployed agent:**
```bash
# Quick test
agents-cli run --url <RUNTIME_URL> --mode adk "How many customers are in the Champions segment?"
```

> [!IMPORTANT]
> Do NOT hand-edit `Dockerfile`, `app/fast_api_app.py`, or `app/app_utils/services.py`. These are scaffolded by `agents-cli` and auto-generated on `scaffold upgrade`.

---

### 2. Update FastAPI Backend (`agent-platform-backend`)

Use this when modifying `backend/app.py`, `backend/agent_runtime_client.py`, `backend/bq_client.py`, or `backend/config.py`.

#### Option A: Script
```bash
./deploy/deploy_backend.sh
```

#### Option B: Manual
```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/agent-demo-09/agent-platform/backend:latest .

gcloud run deploy agent-platform-backend \
  --image us-central1-docker.pkg.dev/agent-demo-09/agent-platform/backend:latest \
  --region us-central1 --platform managed --port 8080 --allow-unauthenticated \
  --set-env-vars ENVIRONMENT=gcp_cloud,USE_GCP_CLOUD=true,GCP_PROJECT_ID=agent-demo-09,BIGQUERY_DATASET=marketing_analytics
```

---

### 3. Update React Frontend (`agent-platform-frontend`)

Use this when modifying React components (`frontend/src/components/*`), styles, or UI layout.

#### Option A: Script
```bash
./deploy/deploy_frontend.sh
```

#### Option B: Manual
```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/agent-demo-09/agent-platform/frontend:latest ./frontend

gcloud run deploy agent-platform-frontend \
  --image us-central1-docker.pkg.dev/agent-demo-09/agent-platform/frontend:latest \
  --region us-central1 --platform managed --port 80 --allow-unauthenticated \
  --set-env-vars VITE_BACKEND_URL=https://agent-platform-backend-1047232371360.us-central1.run.app
```

---

### 4. Publish to Gemini Enterprise

Use this after deploying a new agent version to register it in the Gemini Enterprise app.

```bash
agents-cli publish gemini-enterprise \
  --project agent-demo-09 \
  --location us-central1 \
  --display-name "Marketing Campaign Orchestrator" \
  --gemini-enterprise-app-id projects/ml-developer-project-fe07/locations/global/collections/default_collection/engines/crazy-furniture-app-dev_1770975798363
```

> [!NOTE]
> Requires `roles/discoveryengine.editor` on `ml-developer-project-fe07` for the service account.

---

### 5. Reseed BigQuery Customer Dataset

Use this when modifying customer schema or resetting RFM/demographics data.

```bash
PYTHONPATH=. ./venv/bin/python deploy/seed_bigquery_data.py
```

---

### 6. Update Agent Gateway & Model Armor

```bash
# Import Agent Gateway specification
gcloud alpha network-services agent-gateways import marketing-agent-gateway \
  --source=deploy/agent_gateway.yaml \
  --location=us-central1 --project=agent-demo-09 --quiet

# Re-apply Model Armor Security Floor Policy
PYTHONPATH=. ./venv/bin/python deploy/setup_model_armor.py
```

---

### 7. Re-apply Observability & IAM Permissions

```bash
./deploy/enable_observability_permissions.sh
```

---

## Pre-Deploy Quality Check

Always run before deploying:
```bash
./scripts/pre_commit_lint.sh
```

## Scaffold Upgrade

When `agents-cli` releases a new version, upgrade the project scaffolding:
```bash
agents-cli scaffold upgrade --dry-run   # Preview changes
agents-cli scaffold upgrade             # Apply upgrade
```
