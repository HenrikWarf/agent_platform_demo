#!/usr/bin/env bash
# Kill all local development ports used across the platform
PORTS=(8080 3000 8084 8085 18080 18081 5173)

echo "🧹 Checking and freeing local platform ports..."
for PORT in "${PORTS[@]}"; do
  PIDS=$(lsof -ti :${PORT} 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "Killing process(es) on port ${PORT}: ${PIDS}"
    kill -9 $PIDS 2>/dev/null || true
  else
    echo "Port ${PORT} is clean"
  fi
done
echo "✨ All local development ports are free!"
