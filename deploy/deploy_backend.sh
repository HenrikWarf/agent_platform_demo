#!/usr/bin/env bash
# ==============================================================================
# Fast Single-Service Deploy: Cloud Run Backend
# ==============================================================================
set -e

PROJECT_ID=${GCP_PROJECT_ID:-"agent-demo-09"}
REGION=${GCP_REGION:-"us-central1"}
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/agent-platform/backend:latest"

echo "======================================================================"
echo "📦 Building Backend Image via Cloud Build..."
echo "======================================================================"
gcloud builds submit --tag "${IMAGE_TAG}" -f deploy/Dockerfile.backend .

echo "======================================================================"
echo "🚀 Deploying Backend to Cloud Run (agent-platform-backend)..."
echo "======================================================================"
gcloud run deploy agent-platform-backend \
  --image "${IMAGE_TAG}" \
  --region "${REGION}" \
  --platform managed \
  --port 8080 \
  --allow-unauthenticated \
  --service-account "agent-platform-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars "ENVIRONMENT=gcp_cloud,USE_GCP_CLOUD=true,GCP_PROJECT_ID=${PROJECT_ID},BIGQUERY_DATASET=marketing_analytics,GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY=true,OTEL_TRACES_EXPORTER=google_cloud_trace,OTEL_METRICS_EXPORTER=google_cloud_monitoring,OTEL_LOGS_EXPORTER=google_cloud_logging,ADK_CAPTURE_MESSAGE_CONTENT_IN_SPANS=true,OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=SPAN_AND_EVENT"

echo "✅ FastAPI Backend Cloud Run Service Successfully Deployed!"
