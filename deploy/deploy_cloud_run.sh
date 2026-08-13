#!/usr/bin/env bash
# ==============================================================================
# Build & Deploy Google Cloud Agent Platform Backend & Frontend to Cloud Run
# ==============================================================================
set -e

PROJECT_ID=${GCP_PROJECT_ID:-"agent-demo-09"}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME="agent-platform-backend"
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/agent-platform/backend:latest"

echo "======================================================================"
echo "🚀 Building Container & Deploying to Cloud Run"
echo "======================================================================"

# 1. Build Container Image using Cloud Build
echo "📦 Building container image via Cloud Build..."
gcloud builds submit --config=<(cat <<EOF
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', '${IMAGE_TAG}', '-f', 'deploy/Dockerfile.backend', '.']
images:
- '${IMAGE_TAG}'
EOF
) .

# 2. Deploy Backend to Cloud Run
echo "🚀 Deploying Cloud Run service: [agent-platform-backend]..."
gcloud run deploy "agent-platform-backend" \
  --image="${IMAGE_TAG}" \
  --region="${REGION}" \
  --platform=managed \
  --port=8080 \
  --allow-unauthenticated \
  --service-account="agent-platform-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID},GCP_REGION=${REGION},USE_GCP_CLOUD=true,ENVIRONMENT=gcp_cloud,GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY=true,OTEL_TRACES_EXPORTER=google_cloud_trace,OTEL_METRICS_EXPORTER=google_cloud_monitoring,OTEL_LOGS_EXPORTER=google_cloud_logging,ADK_CAPTURE_MESSAGE_CONTENT_IN_SPANS=true"

echo ""
echo "ℹ️  To deploy Frontend and Simulator, use their dedicated scripts:"
echo "    bash deploy/deploy_frontend.sh"
echo ""
echo "✅ Cloud Run Backend Service Deployed Successfully!"
