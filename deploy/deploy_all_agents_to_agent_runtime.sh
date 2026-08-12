#!/usr/bin/env bash
# ==============================================================================
# Deploy Standalone Agent Instances to GCP Agent Runtime (formerly Agent Engine)
# ==============================================================================
set -e

PROJECT_ID=${GCP_PROJECT_ID:-"agent-demo-09"}
REGION=${GCP_REGION:-"us-central1"}
AGENTS_CLI=${AGENTS_CLI:-"agents-cli"}

echo "======================================================================"
echo "🚀 Deploying 4 Standalone Agent Instances to Agent Runtime..."
echo "======================================================================"

AGENT_SERVICES=("agent-analytics" "agent-strategy" "agent-content" "agent-orchestrator")

for SERVICE in "${AGENT_SERVICES[@]}"; do
  echo ""
  echo "📦 Deploying Agent Runtime Instance: [${SERVICE}]..."
  ${AGENTS_CLI} deploy \
    --deployment-target agent_runtime \
    --service-name "${SERVICE}" \
    --project "${PROJECT_ID}" \
    --region "${REGION}" \
    --agent-identity \
    --update-env-vars "GCP_PROJECT_ID=${PROJECT_ID},GCP_REGION=${REGION},AGENT_ROLE=${SERVICE},USE_GCP_CLOUD=true,GEMINI_MODEL=gemini-3.6-flash,GEMINI_LOCATION=global,GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY=true,ADK_CAPTURE_MESSAGE_CONTENT_IN_SPANS=true,OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=SPAN_AND_EVENT,OTEL_INSTRUMENTATION_GENAI_COMPLETION_HOOK=upload,LOGS_BUCKET_NAME=${PROJECT_ID}-agent-engine-staging" \
    --no-confirm-project
done

echo ""
echo "✅ All 4 Standalone Agents Successfully Deployed to Agent Runtime!"
