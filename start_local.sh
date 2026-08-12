#!/usr/bin/env bash
# ==============================================================================
# Google Cloud Agent Platform - Local Start & Test Script
# ==============================================================================
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "======================================================================"
echo "🚀 Starting Google Cloud Agent Platform (Local Testing Mode)"
echo "======================================================================"

# 1. Environment Setup
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "📋 .env file not found. Copying default settings from .env.example..."
    cp .env.example .env
  fi
fi

# Load variables from .env if present
if [ -f ".env" ]; then
  echo "🔑 Loading configuration from .env file..."
  set -a
  source .env
  set +a
fi

echo "   Project ID    : ${GCP_PROJECT_ID}"
echo "   Cloud Mode    : ${USE_GCP_CLOUD}"
echo "   Backend Port  : ${PORT}"

# 2. Python Virtual Environment Setup
if [ ! -d "venv" ]; then
  echo "📦 Creating Python virtual environment (venv)..."
  python3 -m venv venv
fi

source venv/bin/activate

echo "📦 Verifying Python dependencies..."
pip install -q -r backend/requirements.txt

# 3. Node.js Frontend Dependencies Setup
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing Frontend npm packages..."
  (cd frontend && npm install)
fi

# 4. Process Cleanup Handler on Exit (Ctrl+C)
cleanup() {
  echo ""
  echo "🛑 Stopping services..."
  if [ -n "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID 2>/dev/null || true
  fi
  echo "✅ Application stopped cleanly."
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 5. Start FastAPI Backend Server
echo "⚡ Starting FastAPI Backend Server on http://localhost:${PORT}..."
python backend/app.py &
BACKEND_PID=$!

# Wait briefly to let backend bind port
sleep 2

# 6. Start Vite Frontend Server
echo "🌐 Starting React Dark-Mode Frontend on http://localhost:3000..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "======================================================================"
echo "✨ Google Cloud Agent Platform is running!"
echo "   👉 Chat UI & Dashboard : http://localhost:3000"
echo "   👉 Backend API Endpoint: http://localhost:${PORT}"
echo "   Press Ctrl+C to stop all services."
echo "======================================================================"

wait
