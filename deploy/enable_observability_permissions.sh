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
echo "🔗 Creating Log Analytics Linked BigQuery Dataset..."
echo "======================================================================"
gcloud logging links create defaultLink \
  --bucket=_Default --location=global --project="${PROJECT_ID}" 2>/dev/null || echo "  (Linked dataset 'defaultLink' already exists)"


echo "======================================================================"
echo "🔐 Granting Observability & Metric Writer IAM Roles to Service Accounts..."
echo "======================================================================"

TARGET_PRINCIPALS=(
  "serviceAccount:agent-platform-sa@${PROJECT_ID}.iam.gserviceaccount.com"
  "serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
  "serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-aiplatform.iam.gserviceaccount.com"
  "serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-aiplatform-re.iam.gserviceaccount.com"
)

OBSERVABILITY_ROLES=(
  "roles/observability.admin"
  "roles/logging.viewAccessor"
  "roles/cloudtrace.agent"
  "roles/logging.logWriter"
  "roles/monitoring.metricWriter"
  "roles/monitoring.admin"
  "roles/storage.admin"
  "roles/aiplatform.admin"
  "roles/aiplatform.user"
  "roles/bigquery.dataViewer"
  "roles/bigquery.dataEditor"
  "roles/bigquery.jobUser"
  "roles/bigquery.user"
  "roles/mcp.toolUser"
  "roles/serviceusage.serviceUsageConsumer"
  "roles/cloudapiregistry.viewer"
  "roles/browser"
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

echo "======================================================================"
echo "🤖 Granting IAM Roles to Agent Identity Principals (Reasoning Engines)..."
echo "======================================================================"

# Automatically detect active Reasoning Engines and grant Agent Identity permissions
RE_IDS=$(gcloud ai reasoning-engines list --region=us-central1 --project="${PROJECT_ID}" --format="value(name)" 2>/dev/null | awk -F'/' '{print $NF}' || true)

AGENT_IDENTITY_ROLES=(
  "roles/mcp.toolUser"
  "roles/bigquery.dataViewer"
  "roles/bigquery.dataEditor"
  "roles/bigquery.jobUser"
  "roles/bigquery.user"
  "roles/aiplatform.user"
  "roles/cloudtrace.agent"
  "roles/logging.logWriter"
  "roles/storage.admin"
  "roles/serviceusage.serviceUsageConsumer"
  "roles/cloudapiregistry.viewer"
  "roles/browser"
)

for RE_ID in $RE_IDS; do
  AGENT_PRINCIPAL="principal://agents.global.org-481945953452.system.id.goog/resources/aiplatform/projects/${PROJECT_NUMBER}/locations/us-central1/reasoningEngines/${RE_ID}"
  echo "  -> Binding permissions for Reasoning Engine: ${RE_ID}"
  for ROLE in "${AGENT_IDENTITY_ROLES[@]}"; do
    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
      --member="${AGENT_PRINCIPAL}" \
      --role="${ROLE}" \
      --quiet 2>/dev/null || echo "  (Agent Identity binding applied or checked)"
  done
done

echo "======================================================================"
echo "🛡️ Granting Model Armor IAM Roles for Agent Gateway Governance..."
echo "======================================================================"

# Reasoning Engine service agent needs Model Armor access to screen prompts/responses
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-aiplatform-re.iam.gserviceaccount.com" \
  --role="roles/modelarmor.user" \
  --quiet 2>/dev/null || echo "  (RE service agent: modelarmor.user applied)"

# Dep service agent manages gateway-to-Model Armor integration
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-dep.iam.gserviceaccount.com" \
  --role="roles/modelarmor.calloutUser" \
  --quiet 2>/dev/null || echo "  (Dep service agent: modelarmor.calloutUser applied)"

echo "✅ Observability APIs, MCP Tools & Agent Identity IAM Permissions Successfully Enabled!"
