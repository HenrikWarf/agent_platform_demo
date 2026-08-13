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

PYTHONPATH=. ./venv/bin/python deploy/deploy_agent_engine.py --project "${PROJECT_ID}" --region "${REGION}"

echo ""
echo "✅ All 4 Standalone Agents Successfully Deployed to Agent Runtime!"
