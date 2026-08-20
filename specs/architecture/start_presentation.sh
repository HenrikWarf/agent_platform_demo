#!/usr/bin/env bash
# Start script for GCP Agent Platform Architecture Presentation Deck
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=8084

echo "================================================================="
echo "🚀 Starting Architecture Presentation Deck"
echo "📍 Directory: ${DIR}"
echo "🌐 Local URL: http://localhost:${PORT}"
echo "💡 Press Ctrl+C to stop the server"
echo "================================================================="
echo ""

# Free port if already in use
STALE_PID=$(lsof -ti :${PORT} 2>/dev/null || true)
if [ -n "$STALE_PID" ]; then
  echo "⚠️  Port ${PORT} in use by PID ${STALE_PID}. Freeing port..."
  kill -9 $STALE_PID 2>/dev/null || true
  sleep 1
fi

# Automatically open in default browser on macOS if available
if command -v open >/dev/null 2>&1; then
  (sleep 0.5 && open "http://localhost:${PORT}") &
fi

exec python3 -m http.server "${PORT}" --directory "${DIR}"
