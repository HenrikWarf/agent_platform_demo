#!/bin/bash
# GCP Agent Platform Pre-Commit Linter Hook
# Validates both Backend (Python) and Frontend (React / ESLint) before allowing a git commit.

set -e

echo "🔍 === Running GCP Agent Platform Pre-Commit Quality Checks ==="
ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

# 1. Backend Python Syntax & Import Validation
echo "🐍 [1/2] Checking Backend Python Syntax & Module Imports..."
if [ -f "venv/bin/python" ]; then
    PYTHON_BIN="venv/bin/python"
else
    PYTHON_BIN="python3"
fi

find agents backend deploy eval -name "*.py" -exec $PYTHON_BIN -m py_compile {} +
PYTHONPATH=. $PYTHON_BIN -c "from backend.app import app; from agents.orchestrator_agent import OrchestratorAgent; print('✅ Backend Python modules compiled cleanly.')"

# 2. Frontend React / ESLint Validation
echo "⚛️  [2/2] Checking Frontend JavaScript & React Components..."
if [ -d "frontend" ]; then
    cd frontend
    if command -v npm >/dev/null 2>&1; then
        npm run lint
        echo "✅ Frontend React ESLint check passed."
    fi
    cd "$ROOT_DIR"
fi

echo "✨ === Pre-Commit Linting Complete: ALL CHECKS PASSED ==="
exit 0
