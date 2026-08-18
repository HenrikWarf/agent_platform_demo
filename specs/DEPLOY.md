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
The ADK agent deploys to Agent Runtime as a container-based Reasoning Engine:

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

#### Backend Deployment
The backend uses a hybrid URL approach for Agent Gateway governance:
```bash
# Build backend image (uses deploy/Dockerfile.backend)
# NOTE: Temporarily modify .gcloudignore to include backend/ and skills/
gcloud builds submit . \
  --config cloudbuild-backend.yaml \
  --project agent-demo-09

# Deploy to Cloud Run
gcloud run deploy agent-platform-backend \
  --image us-central1-docker.pkg.dev/agent-demo-09/agent-platform/backend:latest \
  --region us-central1 --platform managed --port 8080 --allow-unauthenticated \
  --set-env-vars "ENVIRONMENT=gcp_cloud,USE_GCP_CLOUD=true,GCP_PROJECT_ID=agent-demo-09,BIGQUERY_DATASET=marketing_analytics,GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY=true"
```

#### Frontend Deployment
```bash
gcloud run deploy agent-platform-frontend \
  --image us-central1-docker.pkg.dev/agent-demo-09/agent-platform/frontend:latest \
  --region us-central1 --platform managed --port 80 --allow-unauthenticated
```

**Live Endpoints**:
- **Backend**: `https://agent-platform-backend-1047232371360.us-central1.run.app`
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

### 6.2 Log Analytics Setup
```bash
# Enable analytics on _Default bucket
gcloud logging buckets update _Default \
  --location=global --project=agent-demo-09 --enable-analytics

# Create linked BigQuery dataset
gcloud logging links create defaultLink \
  --bucket=_Default --location=global --project=agent-demo-09
```

> [!IMPORTANT]
> The linked dataset is named `defaultLink`, NOT `global._Default`.
> - **Observability Analytics page**: Use `global._Default._AllLogs` (Log Analytics engine)
> - **BigQuery Studio direct queries**: Use `agent-demo-09.defaultLink._AllLogs` (location: US)

### 6.3 Agent Gateway Observability Dashboard
The Agent Gateway dashboard queries use the Log Analytics view path `global._Default._AllLogs`.
For the dashboard to show data:
1. Observability Analytics must be enabled on the `_Default` bucket ✓
2. The `_AllLogs` view must exist ✓
3. Traffic must flow through `:streamQuery` or `:query` (NOT `/api` passthrough) ✓
4. Model Armor audit logging must be enabled ✓

### 6.4 Model Armor Audit Logging
```bash
# Enable Data Access audit logs for Model Armor
gcloud projects get-iam-policy agent-demo-09 \
  --format=json > /tmp/policy.json
# Add modelarmor.googleapis.com to auditConfigs with DATA_READ/DATA_WRITE
```

Audit log entries:
- `google.cloud.modelarmor.v1main.ModelArmor.SanitizeUserPrompt` — request screening
- `google.cloud.modelarmor.v1main.ModelArmor.SanitizeModelResponse` — response screening

### 6.5 Telemetry IAM Permissions
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

---

## 8. Troubleshooting & Known Issues

### 8.1 Agent Tool Looping (71s+ Latency)

**Symptom**: Analytics queries take 60-70+ seconds and Cloud Trace shows 4-5 redundant tool calls in a loop. Gateway returns 504 timeouts.

**Root Cause**: Two overlapping tools (`run_bigquery_sql` and `query_customer_cohorts`) both contained internal `generate_content()` calls to Gemini for SQL generation. The agent would call one tool, get results, then call the other tool with the same intent, creating a loop of nested LLM invocations.

**Fix**: Consolidated into a single `query_customer_data(sql_query)` tool that only executes SQL. Moved SQL generation responsibility to the agent's system instruction which contains the full BigQuery table schema. Added explicit "call EXACTLY ONCE" and "STOP after results" directives.

**Result**: 71s → 11s latency. 1 tool call per query instead of 4-5.

**Files changed**:
- `app/tools.py`: Merged two tools into `query_customer_data`
- `app/agent.py`: Updated `analytics_agent` instructions with schema + single-call directive

---

### 8.2 Agent Gateway Observability Dashboard Empty

**Symptom**: The Agent Gateway Observability dashboard shows zero data. No gateway traffic logs or Model Armor metrics appear. The dashboard alert says "Observability Analytics must be enabled on the _Default bucket."

**Root Cause (Layer 1 — Log Analytics path)**: The dashboard queries `global._Default._AllLogs` which is a Log Analytics view path. This works in the Observability Analytics page but NOT in BigQuery Studio. The linked dataset is named `defaultLink`, not `global._Default`.

**Root Cause (Layer 2 — Gateway bypass)**: The backend was calling `/api/run_sse` (the `/api` passthrough) which bypasses Agent Gateway governance entirely. The gateway only governs `:query` and `:streamQuery` Reasoning Engine methods. Since all traffic used the passthrough, zero traffic was screened by Model Armor and zero gateway logs were generated.

**Fix**:
1. Switched backend from `/api/run_sse` passthrough to `:streamQuery` with `class_method: "stream_query"` (governed path)
2. Kept session creation on `/api` passthrough (sessions don't need governance)
3. Relaxed Model Armor PI/Jailbreak filter from `LOW_AND_ABOVE` to `MEDIUM_AND_ABOVE` (LOW triggers false positives on marketing content)

**Files changed**:
- `backend/agent_runtime_client.py`: Hybrid URL approach — `/api` for sessions, `:streamQuery` for queries

---

### 8.3 Model Armor Blocking Legitimate Content

**Symptom**: `:streamQuery` returns `403 PERMISSION_DENIED` with "Response violates content security configurations."

**Root Cause**: Model Armor template `marketing-security-template` had the PI & Jailbreak filter set to `LOW_AND_ABOVE`. Marketing content with persuasive language triggers low-confidence prompt injection detection.

**Fix**:
```bash
curl -X PATCH \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  "https://modelarmor.us-central1.rep.googleapis.com/v1/projects/agent-demo-09/locations/us-central1/templates/marketing-security-template?updateMask=filterConfig.piAndJailbreakFilterSettings.confidenceLevel" \
  -d '{"filterConfig": {"piAndJailbreakFilterSettings": {"filterEnforcement": "ENABLED", "confidenceLevel": "MEDIUM_AND_ABOVE"}}}'
```

---

### 8.4 `:streamQuery` Returns 404 for `class_method: "run_sse"`

**Symptom**: Calling `:streamQuery` with `class_method: "run_sse"` returns 404.

**Root Cause**: The ADK container's `reasoning_engine_adapter.py` only allows methods registered by `AdkApp.register_operations()`. The valid streaming methods are `stream_query`, `async_stream_query`, and `streaming_agent_run_with_events`. `run_sse` is an ADK dev UI endpoint, not a Reasoning Engine class method.

**Fix**: Use `class_method: "stream_query"` for `:streamQuery` calls.

---

### 8.5 `.gcloudignore` Excludes Backend from Cloud Build

**Symptom**: `gcloud builds submit` fails with "file not found: backend/requirements.txt".

**Root Cause**: The `.gcloudignore` excludes `backend/`, `deploy/`, and `skills/` directories (designed for `agents-cli deploy` which only needs `app/`). But the backend Cloud Build needs these directories.

**Fix**: Temporarily modify `.gcloudignore` before backend builds to include the required directories, or use a `cloudbuild.yaml` that generates the Dockerfile inline.
