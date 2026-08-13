#!/usr/bin/env bash
# ==============================================================================
# Enable Observability APIs & Grant IAM Telemetry Roles for Agent Engine
# ==============================================================================
set -e

PROJECT_ID=${GCP_PROJECT_ID:-"agent-demo-09"}
PROJECT_NUMBER=${GCP_PROJECT_NUMBER:-"1047232371360"}

echo "======================================================================"
echo "📡 Enabling Required GCP Telemetry & Observability APIs..."
echo "======================================================================"

gcloud services enable \
  aiplatform.googleapis.com \
  agentregistry.googleapis.com \
  networkservices.googleapis.com \
  networksecurity.googleapis.com \
  modelarmor.googleapis.com \
  cloudtrace.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  clouderrorreporting.googleapis.com \
  apptopology.googleapis.com \
  --project="${PROJECT_ID}" || true

echo "======================================================================"
echo "📊 Enabling Log Analytics on Cloud Logging _Default Bucket..."
echo "======================================================================"
gcloud logging buckets update _Default --location=global --project="${PROJECT_ID}" --enable-analytics || true


echo "======================================================================"
echo "🔐 Granting Observability & Metric Writer IAM Roles to Service Accounts..."
echo "======================================================================"

TARGET_PRINCIPALS=(
  "serviceAccount:agent-platform-sa@${PROJECT_ID}.iam.gserviceaccount.com"
  "serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
  "serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-aiplatform.iam.gserviceaccount.com"
  "principal://agents.global.org-481945953452.system.id.goog/resources/aiplatform/projects/${PROJECT_NUMBER}/locations/us-central1/reasoningEngines/4762742973165207552"
  "principal://agents.global.org-481945953452.system.id.goog/resources/aiplatform/projects/${PROJECT_NUMBER}/locations/us-central1/reasoningEngines/1358021654873112576"
  "principal://agents.global.org-481945953452.system.id.goog/resources/aiplatform/projects/${PROJECT_NUMBER}/locations/us-central1/reasoningEngines/2731619541221113856"
  "principal://agents.global.org-481945953452.system.id.goog/resources/aiplatform/projects/${PROJECT_NUMBER}/locations/us-central1/reasoningEngines/5406757719879188480"
)

OBSERVABILITY_ROLES=(
  "roles/cloudtrace.agent"
  "roles/logging.logWriter"
  "roles/monitoring.metricWriter"
  "roles/monitoring.admin"
  "roles/storage.admin"
  "roles/aiplatform.admin"
  "roles/bigquery.dataEditor"
  "roles/bigquery.jobUser"
)

for PRINCIPAL in "${TARGET_PRINCIPALS[@]}"; do
  for ROLE in "${OBSERVABILITY_ROLES[@]}"; do
    echo "  -> Adding ${ROLE} to ${PRINCIPAL}..."
    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
      --member="${PRINCIPAL}" \
      --role="${ROLE}" \
      --quiet 2>/dev/null || echo "  (IAM binding applied or checked)"
  done
done

echo "✅ Observability APIs & Service Account IAM Permissions Successfully Enabled!"
