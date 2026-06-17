#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PORT="${WOLFIE_API_PORT:-8000}"
WEB_PORT="${WOLFIE_WEB_PORT:-3000}"
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:${API_PORT}}"
# Default frontend command is equivalent to: next dev -p 3000

cd "$ROOT_DIR"

if [ ! -x ".venv/bin/python" ]; then
  python3 -m venv .venv
fi

.venv/bin/python -m pip install -r apps/api/requirements.txt >/tmp/wolfie-api-install.log

cleanup() {
  if [ -n "${API_PID:-}" ]; then kill "$API_PID" 2>/dev/null || true; fi
  if [ -n "${WEB_PID:-}" ]; then kill "$WEB_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT

.venv/bin/uvicorn apps.api.main:app --host 127.0.0.1 --port "$API_PORT" &
API_PID=$!

cd "$ROOT_DIR/apps/web"
if [ ! -d "node_modules" ]; then
  npm install
fi

NEXT_PUBLIC_API_BASE_URL="$NEXT_PUBLIC_API_BASE_URL" npx next dev -p "$WEB_PORT" &
WEB_PID=$!

cat <<MSG
Wolfie local dev is starting.

Backend:  http://localhost:${API_PORT}
Frontend: http://localhost:${WEB_PORT}
API base: ${NEXT_PUBLIC_API_BASE_URL}

Press Ctrl+C to stop both servers.
MSG

wait
