# Deployment & Operations Guide
## GCP Multi-Agent Marketing Platform

> [!TIP]
> For fast single-service updates (e.g. backend or frontend only), see the [Individual GCP Service Deployment Guide](INDIVIDUAL_SERVICE_DEPLOYMENT.md).

---

## 1. Environment Specifications & Parameters

### 1.1 GCP Environment Parameters
- **GCP Project ID**: `agent-demo-09`
- **GCP Region**: `us-central1`
- **Project Number**: `1047232371360`
- **BigQuery Dataset**: `marketing_analytics`
- **Service Account**: `agent-platform-sa@agent-demo-09.iam.gserviceaccount.com`
- **Gemini Enterprise App**: `crazy-furniture-app-dev_1770975798363` (project: `ml-developer-project-fe07`)

### 1.2 Required GCP APIs
```bash
gcloud services enable \
  bigquery.googleapis.com \
  aiplatform.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  modelarmor.googleapis.com \
  networkservices.googleapis.com \
  agentregistry.googleapis.com \
  cloudtrace.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com
```

---

## 2. Project Scaffolding & Local Setup

### 2.1 Prerequisites
- **Python**: 3.12 (container) / 3.11+ (local dev)
- **agents-cli**: `1.3.1` (installed via `uv tool install google-agents-cli`)
- **Node.js**: 18+ (for frontend)

### 2.2 Project Structure (Scaffolded with `agents-cli`)
This project uses the **ADK scaffolded structure** generated and maintained by `agents-cli`. Key infrastructure files are auto-generated and should NOT be hand-edited:

| File | Purpose | Editable? |
|------|---------|-----------|
| `Dockerfile` | Container build for Agent Runtime | ❌ Scaffolded |
| `app/fast_api_app.py` | FastAPI app with lifespan, A2A, reasoning engine routes | ❌ Scaffolded |
| `app/app_utils/services.py` | Session & artifact service factory | ❌ Scaffolded |
| `app/app_utils/reasoning_engine_adapter.py` | `/api/reasoning_engine` routes | ❌ Scaffolded |
| `app/app_utils/a2a.py` | A2A protocol support | ❌ Scaffolded |
| `agents-cli-manifest.yaml` | CLI metadata & project config | ❌ Scaffolded |
| `app/agent.py` | Agent definition & tools | ✅ Your code |
| `app/app_utils/telemetry.py` | Telemetry configuration | ✅ Your code |

### 2.3 Scaffold Commands
```bash
# Upgrade project to latest agents-cli version
agents-cli scaffold upgrade

# Add deployment target (if not already present)
agents-cli scaffold enhance . --deployment-target agent_runtime

# Add CI/CD pipeline
agents-cli scaffold enhance . --cicd-runner github_actions
```

### 2.4 Local Development
```bash
# Install dependencies
agents-cli install

# Run agent locally with playground UI
agents-cli playground

# Quick smoke test
agents-cli run "How many customers are in the Champions segment?"
```

### 2.5 Seed BigQuery Dataset (200 Aligned Rows)
```bash
PYTHONPATH=. ./venv/bin/python deploy/seed_bigquery_data.py
```

### 2.6 Start Full Application Stack (Backend + Frontend)
```bash
./start_local.sh
```
- **Backend API**: `http://localhost:8080`
- **Frontend Dashboard**: `http://localhost:3000`

---

## 3. Agent Runtime Deployment

### 3.1 Deploy Agent to Agent Runtime
The ADK agent deploys to Vertex AI Agent Runtime as a container-based Reasoning Engine:

```bash
# Deploy (creates or updates the Reasoning Engine instance)
agents-cli deploy --project agent-demo-09 --region us-central1 --no-confirm-project
```

This:
1. Packages project files (honoring `.gcloudignore`)
2. Builds container image from `Dockerfile` (using `uv sync --frozen`)
3. Creates/updates the Reasoning Engine instance
4. Writes `deployment_metadata.json` with the engine resource ID

### 3.2 Deployment Architecture
```
Dockerfile CMD: uv run uvicorn app.fast_api_app:app --host 0.0.0.0 --port 8080

app/fast_api_app.py (container entrypoint)
├── get_fast_api_app(web=True, lifespan=..., otel_to_cloud=True)
│   ├── /run_sse, /apps/... (ADK dev UI routes)
│   └── lifespan → Runner + attach_a2a_routes()
├── attach_reasoning_engine_routes(app)
│   ├── /api/reasoning_engine      ← Vertex AI :query contract
│   └── /api/stream_reasoning_engine  ← Vertex AI :streamQuery contract
└── /feedback (structured logging)
```

### 3.3 Query Deployed Agent
```bash
# Via agents-cli
agents-cli run --url https://us-central1-aiplatform.googleapis.com/v1/projects/1047232371360/locations/us-central1/reasoningEngines/3829020106671783936 --mode adk "Hello"

# Via Python SDK
import vertexai
client = vertexai.Client(location="us-central1")
agent = client.agent_engines.get(name="projects/.../reasoningEngines/ID")
async for event in agent.async_stream_query(message="Hello!", user_id="test"):
    print(event)
```

### 3.4 Publish to Gemini Enterprise
```bash
agents-cli publish gemini-enterprise \
  --project agent-demo-09 \
  --location us-central1 \
  --display-name "Marketing Campaign Orchestrator" \
  --gemini-enterprise-app-id projects/ml-developer-project-fe07/locations/global/collections/default_collection/engines/crazy-furniture-app-dev_1770975798363
```

### 3.5 Cloud Run Services (Backend API & Frontend)
```bash
# Backend
gcloud run deploy agent-platform-backend \
  --image us-central1-docker.pkg.dev/agent-demo-09/agent-platform/backend:latest \
  --region us-central1 --platform managed --port 8080 --allow-unauthenticated

# Frontend
gcloud run deploy agent-platform-frontend \
  --image us-central1-docker.pkg.dev/agent-demo-09/agent-platform/frontend:latest \
  --region us-central1 --platform managed --port 80 --allow-unauthenticated
```

**Live Endpoints**:
- **Backend**: `https://agent-platform-backend-q5c3bhebga-uc.a.run.app`
- **Frontend**: `https://agent-platform-frontend-q5c3bhebga-uc.a.run.app`

---

## 4. Terraform Infrastructure (`deployment/terraform/`)

The scaffolded Terraform configuration in `deployment/terraform/single-project/` codifies:
- GCP APIs enablement
- IAM roles and service accounts
- Agent Runtime (Reasoning Engine) resource
- Storage and telemetry infrastructure

```bash
cd deployment/terraform/single-project
terraform init
terraform plan -var-file=vars/env.tfvars -out=tfplan
terraform apply tfplan
```

> [!IMPORTANT]
> The Reasoning Engine resource uses `lifecycle.ignore_changes` for `container_spec`, `source_code_spec`, and `deployment_spec` — the image and source are updated by `agents-cli deploy`, not Terraform.

---

## 5. CI/CD Pipeline (`.github/workflows/deploy-gcp.yml`)

On push to `main`, GitHub Actions executes:
1. **Evaluation**: Runs `agents-cli eval` post-deployment benchmark against live Agent Runtime.
2. **Authentication**: GCP Workload Identity Federation.
3. **Agent Deployment**: `agents-cli deploy` to Agent Runtime.
4. **Backend Build**: Container image → Cloud Run (`agent-platform-backend`).
5. **Frontend Build**: Container image → Cloud Run (`agent-platform-frontend`).
6. **Gemini Enterprise Registration**: `agents-cli publish gemini-enterprise` (non-blocking).

Selective deployment: only changed services are redeployed based on path filters.

---

## 6. Observability & Telemetry

### 6.1 OpenTelemetry Configuration
The scaffolded `app/app_utils/telemetry.py` configures:
- Cloud Trace span export (gated on `GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY=true`)
- Prompt-response logging to GCS (when `LOGS_BUCKET_NAME` is set)
- GenAI content capture mode (`NO_CONTENT` metadata-only by default)

### 6.2 Log Analytics
```bash
gcloud logging buckets update _Default \
  --location=global --project=agent-demo-09 --enable-analytics
```

### 6.3 Telemetry IAM Permissions
```bash
bash deploy/enable_observability_permissions.sh
```

---

## 7. Developer Experience

### 7.1 Pre-Commit Quality Linter
```bash
./scripts/pre_commit_lint.sh
```
Validates Python syntax/imports and React ESLint rules on every `git commit`.

### 7.2 Evaluation
```bash
# Generate eval dataset
agents-cli eval generate

# Grade agent responses
agents-cli eval grade
```
