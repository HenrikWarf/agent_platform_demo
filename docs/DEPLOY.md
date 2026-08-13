# Deployment & Operations Guide (DEPLOY.md)
## GCP Multi-Agent Marketing Platform

---

## 1. Environment Specifications & Parameters

### 1.1 GCP Environment Parameters
- **GCP Project ID**: `agent-demo-09`
- **GCP Region**: `us-central1`
- **Project Number**: `1047232371360`
- **BigQuery Dataset**: `marketing_analytics`
- **Service Account**: `agent-platform-sa@agent-demo-09.iam.gserviceaccount.com`

### 1.2 Required GCP APIs (22 Codified APIs)
Ensure the following APIs are activated on project `agent-demo-09`:
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
  iap.googleapis.com \
  apptopology.googleapis.com \
  observability.googleapis.com \
  telemetry.googleapis.com \
  clouderrorreporting.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com
```

---

## 2. Local Setup & Execution Workflow

### 2.1 Virtual Environment Setup
```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r backend/requirements.txt
```

### 2.2 Seed Live BigQuery Dataset (200 Aligned Rows)
Populates or realigns customer records across all 3 BigQuery tables (`customer_rfm_summary`, `customer_demographics_360`, `customer_transactions`):
```bash
PYTHONPATH=. ./venv/bin/python deploy/seed_bigquery_data.py
```

### 2.3 Publish Marketing Skills to Agent Registry
Registers marketing skills with Agent Registry in `us-central1`:
```bash
PYTHONPATH=. ./venv/bin/python deploy/publish_skills.py
```

### 2.4 Run Local Golden Evaluation Suite
Runs benchmark quality eval suite across natural language prompts:
```bash
PYTHONPATH=. ./venv/bin/python eval/run_eval.py
```

### 2.5 Start Application Stack
Launches FastAPI backend (Port 8080) and React frontend (Port 3000):
```bash
./start_local.sh
```
- **Backend API**: `http://localhost:8080`
- **Frontend Dashboard**: `http://localhost:3000`

---

## 3. Production Cloud Run & Agent Engine Deployment

### 3.1 Container Build & Deploy
```bash
# Submit Container Build
gcloud builds submit --tag gcr.io/agent-demo-09/agent-platform-backend:latest .

# Deploy Backend to Cloud Run
gcloud run deploy agent-platform-backend \
  --image gcr.io/agent-demo-09/agent-platform-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars USE_GCP_CLOUD=true,GCP_PROJECT_ID=agent-demo-09,BIGQUERY_DATASET=marketing_analytics,GEMINI_LOCATION=global
```

### 3.2 Live Deployed Endpoints
- **Backend API**: `https://agent-platform-backend-q5c3bhebga-uc.a.run.app`
- **Frontend App**: `https://agent-platform-frontend-q5c3bhebga-uc.a.run.app`

---

## 4. Terraform Infrastructure-as-Code (`terraform/main.tf`)
The Terraform configuration in `terraform/main.tf` codifies:
- All 22 GCP APIs.
- IAM roles (`roles/bigquery.dataViewer`, `roles/modelarmor.user`, `roles/modelarmor.calloutUser`, `roles/cloudtrace.agent`, `roles/agentregistry.editor`).
- Agent Gateway `marketing-agent-gateway` with `googleManaged: {governedAccessPath: CLIENT_TO_AGENT}`.

```bash
cd terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

---

## 5. Automated CI/CD Workflow (`.github/workflows/deploy-gcp.yml`)
On push to `main` branch, GitHub Actions executes:
1. Python unit & golden benchmark evaluation suite (`eval/run_eval.py`).
2. GCP Workload Identity authentication.
3. Enabling required GCP APIs.
4. Container image build & Cloud Run deployment.
5. Agent Engine Reasoning Engine deployment (`deploy/deploy_all_agents_to_agent_runtime.sh`).
6. Agent Registry skill publishing (`deploy/publish_skills.py`).

---

## 6. Observability & Telemetry Configuration

### 6.1 Log Analytics Prerequisites for Agent Gateway & Agent Engine
To enable telemetry dashboards, request counts, turn metrics, and latency charts in the GCP Console for Agent Gateway and Agent Engine:
- **Cloud Logging Log Analytics**: Must be enabled on the global `_Default` log bucket with an active `_AllLogs` view:
```bash
gcloud logging buckets update _Default \
  --location=global \
  --project=agent-demo-09 \
  --enable-analytics
```

### 6.2 Service Account Observability & IAM Permissions (`deploy/enable_observability_permissions.sh`)
The script `deploy/enable_observability_permissions.sh` provisions required APIs and binds telemetry roles across:
- `agent-platform-sa@agent-demo-09.iam.gserviceaccount.com`
- `1047232371360-compute@developer.gserviceaccount.com` (Compute Engine SA)
- `service-1047232371360@gcp-sa-aiplatform.iam.gserviceaccount.com` (Vertex AI Service Agent)

**Roles Provisioned**:
- `roles/cloudtrace.agent` (Trace exporter)
- `roles/logging.logWriter` (Cloud Logging)
- `roles/monitoring.metricWriter` (Cloud Monitoring metric exporter)
- `roles/monitoring.admin` (Observability dashboards)
- `roles/aiplatform.admin` (Agent Engine runtime control)
- `roles/bigquery.dataEditor` & `roles/bigquery.jobUser` (Agent Analytics export)

Run permission script:
```bash
bash deploy/enable_observability_permissions.sh
```

### 6.3 OpenTelemetry & Telemetry Flags
Application backend and Standalone Agent Engine instances output tracing, metrics, and logs using OpenTelemetry environment variables:
- `GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY=true`
- `OTEL_TRACES_EXPORTER=google_cloud_trace`
- `OTEL_METRICS_EXPORTER=google_cloud_monitoring`
- `OTEL_LOGS_EXPORTER=google_cloud_logging`
- `OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED=true`
- `ADK_CAPTURE_MESSAGE_CONTENT_IN_SPANS=true`
- `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=SPAN_AND_EVENT`
- `OTEL_INSTRUMENTATION_GENAI_COMPLETION_HOOK=upload`

Traces and metrics can be visualized in the **GCP Cloud Trace Console**, **GCP Monitoring Dashboards**, or via the **Traffic Simulator & OTel** tab in the web interface.

---

## 7. Developer Experience & Code Quality Automation

### 7.1 Git Pre-Commit Quality Linter Hook (`scripts/pre_commit_lint.sh`)
An automated Git pre-commit hook is installed at `.git/hooks/pre-commit` and executed prior to every commit:
- **Backend (Python)**: Executes `python3 -m py_compile` across all Python source files and validates module imports.
- **Frontend (React / JSX)**: Executes `cd frontend && npm run lint` using ESLint (`frontend/eslint.config.js`).

Trigger manual pre-commit check:
```bash
./scripts/pre_commit_lint.sh
```

### 7.2 IDE Language Server & Pyrefly Configuration
To prevent missing import warnings in Pyrefly / Pyright / VS Code:
- **[.vscode/settings.json](file:///Users/henrikw/Projects/agent_platform_demo/.vscode/settings.json)**: Sets `"python.defaultInterpreterPath": "${workspaceFolder}/venv/bin/python"` and extra search paths.
- **[pyrightconfig.json](file:///Users/henrikw/Projects/agent_platform_demo/pyrightconfig.json)**: Directs Pyright/Pyrefly to `venv/lib/python3.14/site-packages`.


