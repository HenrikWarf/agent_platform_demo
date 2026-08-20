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

# Automatically open in default browser on macOS if available
if command -v open >/dev/null 2>&1; then
  (sleep 0.5 && open "http://localhost:${PORT}") &
fi

exec python3 -m http.server "${PORT}" --directory "${DIR}"
