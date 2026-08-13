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

### 6.1 OpenTelemetry Cloud Trace Environment Variables
The application backend and Agent Engine instances record trace spans via OpenTelemetry:
- `OTEL_TRACES_EXPORTER=google_cloud_trace`
- `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=SPAN_AND_EVENT`
- `OTEL_INSTRUMENTATION_GENAI_COMPLETION_HOOK=upload`
- `GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY=true`

Traces can be visualized in the **GCP Cloud Trace Console** or via the **Traffic Simulator & OTel** tab in the web dashboard.

