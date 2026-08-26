#!/usr/bin/env bash
# ==============================================================================
# Multi-Agent Observability & Quality Triage Platform Startup Script
# ==============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT=8081
FRONTEND_PORT=3001

echo "🔍 === Starting GCP Multi-Agent Observability Platform ==="

# Free ports if previously occupied
lsof -ti:${BACKEND_PORT} | xargs kill -9 2>/dev/null || true
lsof -ti:${FRONTEND_PORT} | xargs kill -9 2>/dev/null || true

# 1. Start Observability Backend (FastAPI on Port 8081)
echo "🐍 Starting Observability Backend on http://localhost:${BACKEND_PORT}..."
cd "${ROOT_DIR}"
PYTHONPATH=. ./venv/bin/python observability_app/backend/app.py &
BACKEND_PID=$!

# 2. Start Observability Frontend (Vite on Port 3001)
echo "⚛️  Starting Observability React Frontend on http://localhost:${FRONTEND_PORT}..."
cd "${ROOT_DIR}/observability_app/frontend"
npm run dev &
FRONTEND_PID=$!

echo "✨ Observability Platform is running!"
echo "   📊 Frontend Dashboard: http://localhost:${FRONTEND_PORT}"
echo "   🔌 Telemetry Backend:  http://localhost:${BACKEND_PORT}/api/obs/overview"
echo "   💬 Observability Copilot Chat is active in the bottom right corner."

# Cleanup on exit
trap "echo 'Stopping Observability Platform...'; kill ${BACKEND_PID} ${FRONTEND_PID} 2>/dev/null || true; exit 0" SIGINT SIGTERM EXIT

wait
