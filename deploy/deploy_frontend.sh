#!/usr/bin/env bash
# ==============================================================================
# Fast Single-Service Deploy: Cloud Run Frontend
# ==============================================================================
set -e

PROJECT_ID=${GCP_PROJECT_ID:-"agent-demo-09"}
REGION=${GCP_REGION:-"us-central1"}
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/agent-platform/frontend:latest"
BACKEND_URL=${BACKEND_URL:-"https://agent-platform-backend-1047232371360.us-central1.run.app"}

echo "======================================================================"
echo "📦 Building Frontend Image via Cloud Build..."
echo "======================================================================"
gcloud builds submit --tag "${IMAGE_TAG}" ./frontend

echo "======================================================================"
echo "🚀 Deploying Frontend to Cloud Run (agent-platform-frontend)..."
echo "======================================================================"
gcloud run deploy agent-platform-frontend \
  --image "${IMAGE_TAG}" \
  --region "${REGION}" \
  --platform managed \
  --port 8080 \
  --allow-unauthenticated \
  --set-env-vars "VITE_BACKEND_URL=${BACKEND_URL}"

echo "✅ React Frontend Cloud Run Service Successfully Deployed!"
