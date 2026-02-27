#!/usr/bin/env bash
# Simple healthcheck runner for Malaika Nest
# Exits 0 on success, non-zero on failure

set -euo pipefail
# Parameters (can override via env)
REPO_DIR="${REPO_DIR:-/home/ubuntu/malaika_nest}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
LOG_FILE="${LOG_FILE:-$REPO_DIR/logs/healthcheck.log}"
# Optional webhook for alerts (Slack, Discord, MS Teams incoming webhook etc.)
NOTIFY_WEBHOOK="${NOTIFY_WEBHOOK:-}"

mkdir -p "$(dirname "$LOG_FILE")"

timestamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log() { echo "[$(timestamp)] $*" >> "$LOG_FILE"; }

notify() {
  local level="$1"
  local msg="$2"
  log "$level: $msg"
  if [ -n "$NOTIFY_WEBHOOK" ]; then
    # Try to send a simple JSON payload with a `text` field (Slack compatible)
    payload="{\"text\": \"[$(hostname)] $level: $msg\"}"
    curl -s -X POST -H 'Content-Type: application/json' -d "$payload" "$NOTIFY_WEBHOOK" > /dev/null 2>&1 || true
  fi
}

log "Running healthcheck..."

cd "$REPO_DIR"

if docker compose -f "$COMPOSE_FILE" exec -T backend python manage.py healthcheck >> "$LOG_FILE" 2>&1; then
  notify "INFO" "HEALTH OK"
  exit 0
else
  notify "ERROR" "HEALTH FAILED - attempting restart of backend"
  docker compose -f "$COMPOSE_FILE" restart backend >> "$LOG_FILE" 2>&1 || true
  # attempt a second check
  if docker compose -f "$COMPOSE_FILE" exec -T backend python manage.py healthcheck >> "$LOG_FILE" 2>&1; then
    notify "INFO" "HEALTH OK after restart"
    exit 0
  else
    notify "CRITICAL" "HEALTH STILL FAILING - manual intervention required"
    exit 2
  fi
fi
