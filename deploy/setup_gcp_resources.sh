#!/usr/bin/env bash
# ==============================================================================
# Setup GCP Infrastructure & IAM for Google Cloud Agent Platform
# ==============================================================================
set -e

PROJECT_ID=${GCP_PROJECT_ID:-"agent-demo-09"}
REGION=${GCP_REGION:-"us-central1"}
DATASET_NAME=${BIGQUERY_DATASET:-"marketing_analytics"}

echo "======================================================================"
echo "🚀 Initializing Google Cloud Agent Platform Setup"
echo "Project ID: ${PROJECT_ID} | Region: ${REGION}"
echo "======================================================================"

# 1. Set default project
gcloud config set project "${PROJECT_ID}"

# 2. Enable Required Google Cloud APIs
echo "📌 Enabling Google Cloud APIs..."
gcloud services enable \
  aiplatform.googleapis.com \
  bigquery.googleapis.com \
  run.googleapis.com \
  apigateway.googleapis.com \
  cloudtrace.googleapis.com \
  logging.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com

# 3. Create BigQuery Dataset for Marketing Data
echo "📊 Creating BigQuery dataset '${DATASET_NAME}'..."
bq --location="${REGION}" mk --dataset --if_not_exists "${PROJECT_ID}:${DATASET_NAME}"

# 4. Create BigQuery Schema & Tables
echo "📝 Creating Customer Transactions & RFM Summary tables in BigQuery..."
bq query --use_legacy_sql=false "
CREATE TABLE IF NOT EXISTS \`${PROJECT_ID}.${DATASET_NAME}.customer_transactions\` (
  transaction_id STRING,
  customer_id STRING,
  customer_name STRING,
  email STRING,
  segment STRING,
  amount NUMERIC,
  transaction_date TIMESTAMP
);"

# 5. Create Service Account for Agent Engine & Cloud Run
SA_NAME="agent-platform-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🔐 Configuring IAM Service Account '${SA_EMAIL}'..."
if ! gcloud iam service-accounts describe "${SA_EMAIL}" &>/dev/null; then
  gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="Agent Platform Cloud Run Service Account"
fi

# Grant Roles
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/bigquery.dataViewer"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/bigquery.jobUser"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudtrace.agent"

echo "✅ GCP Setup Complete! You can now run deploy_cloud_run.sh to deploy services."
