#!/bin/bash
# GCP Agent Platform Linter Script (Ruff + Python Compilation + Frontend ESLint)

set -e

echo "🔍 === Running GCP Agent Platform Quality Checks ==="
ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

# 1. Python Ruff Linting & Quality Checks
echo "⚡ [1/3] Running Python Ruff Linter..."
if [ -f ".venv/bin/ruff" ]; then
    RUFF_BIN=".venv/bin/ruff"
elif [ -f "venv/bin/ruff" ]; then
    RUFF_BIN="venv/bin/ruff"
elif command -v ruff >/dev/null 2>&1; then
    RUFF_BIN="ruff"
else
    echo "⚠️ Ruff not found in virtual environment. Attempting uv run ruff..."
    RUFF_BIN="uv run ruff"
fi

$RUFF_BIN check app backend deploy eval tests specs
echo "✅ Ruff linting checks passed (0 errors)."

# 2. Python Syntax & Import Validation
echo "🐍 [2/3] Checking Backend Python Syntax & Module Imports..."
if [ -f ".venv/bin/python" ]; then
    PYTHON_BIN=".venv/bin/python"
elif [ -f "venv/bin/python" ]; then
    PYTHON_BIN="venv/bin/python"
else
    PYTHON_BIN="python3"
fi

find backend deploy eval app tests specs -name "*.py" -exec $PYTHON_BIN -m py_compile {} +
PYTHONPATH=. $PYTHON_BIN -c "from backend.app import app; print('✅ Backend Python modules compiled cleanly.')"

# 3. Frontend React / ESLint Validation
echo "⚛️  [3/3] Checking Frontend JavaScript & React Components..."
if [ -d "frontend" ]; then
    cd frontend
    if command -v npm >/dev/null 2>&1; then
        npm run lint
        echo "✅ Frontend React ESLint check passed."
    fi
    cd "$ROOT_DIR"
fi

echo "✨ === Quality & Linting Complete: ALL CHECKS PASSED ==="
exit 0
