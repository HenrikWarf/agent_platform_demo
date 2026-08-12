# Deployment & Operations Guide (DEPLOY.md)
## GCP Multi-Agent Marketing Platform

---

## 1. Prerequisites & Environment Setup

### 1.1 GCP Project Configuration
- **GCP Project ID**: `agent-demo-09`
- **GCP Region**: `us-central1`
- **BigQuery Dataset**: `marketing_analytics`

### 1.2 Required GCP APIs
Ensure the following APIs are enabled on your GCP project:
```bash
gcloud services enable \
  bigquery.googleapis.com \
  aiplatform.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  modelarmor.googleapis.com
```

---

## 2. Local Environment Execution

### 2.1 Virtual Environment Setup
```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 2.2 Seed BigQuery Dataset
To populate or realign 200 customer rows in BigQuery:
```bash
PYTHONPATH=. ./venv/bin/python deploy/seed_bigquery_data.py
```

### 2.3 Running Complete Application Stack
Use the helper script to launch backend and frontend simultaneously:
```bash
./start_local.sh
```
- **FastAPI Backend**: `http://localhost:8080`
- **Vite React Frontend**: `http://localhost:3000`

---

## 3. Production Cloud Run Deployment

### 3.1 Container Build & Deploy (Backend)
```bash
# Build Container Image
gcloud builds submit --tag gcr.io/agent-demo-09/agent-platform-backend:latest .

# Deploy Backend to Cloud Run
gcloud run deploy agent-platform-backend \
  --image gcr.io/agent-demo-09/agent-platform-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars USE_GCP_CLOUD=true,GCP_PROJECT_ID=agent-demo-09,BIGQUERY_DATASET=marketing_analytics
```

### 3.2 Production Cloud Run Endpoints
- **Live Cloud Run Backend**: `https://agent-platform-backend-q5c3bhebga-uc.a.run.app`
- **Live Cloud Run Frontend**: `https://agent-platform-frontend-q5c3bhebga-uc.a.run.app`

---

## 4. Terraform Infrastructure Provisioning
The `terraform/` directory contains declarative Infrastructure-as-Code modules:
- `terraform/main.tf`: Defines BigQuery dataset, tables, IAM roles, and Cloud Run services.
- `terraform/variables.tf`: Configures GCP project and region variables.

### Provisioning Commands
```bash
cd terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

---

## 5. Operations & Observability

### 5.1 OpenTelemetry & Cloud Trace
Tracing spans are recorded for:
1. `ModelArmor:validate_prompt`
2. `OrchestratorAgent:determine_intent`
3. `A2ARouter:dispatch_message`
4. `BigQueryClient:execute_query`

Tracing logs can be viewed in GCP Cloud Trace console or via the **Traffic Simulator & OTel** tab in the frontend web application.
