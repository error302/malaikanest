#!/usr/bin/env bash
# Run certbot renew using the bundled certbot container then restart nginx if renewed
set -euo pipefail
REPO_DIR="/home/ubuntu/malaika_nest" # <-- change this to your deployment path
COMPOSE_FILE="docker-compose.prod.yml"
LOG_FILE="$REPO_DIR/logs/cert_renew.log"

mkdir -p "$(dirname "$LOG_FILE")"
echo "["$(date -u +"%Y-%m-%dT%H:%M:%SZ")"] Running certbot renew..." >> "$LOG_FILE"

cd "$REPO_DIR"

# Run renewal; if certs renewed, restart nginx via docker compose
if docker compose run --rm certbot renew --quiet >> "$LOG_FILE" 2>&1; then
  echo "["$(date -u +"%Y-%m-%dT%H:%M:%SZ")"] Certbot renew executed (no errors). Restarting nginx to pick up certs." >> "$LOG_FILE"
  docker compose -f "$COMPOSE_FILE" restart nginx >> "$LOG_FILE" 2>&1 || true
  exit 0
else
  echo "["$(date -u +"%Y-%m-%dT%H:%M:%SZ")"] Certbot renew failed. See logs." >> "$LOG_FILE"
  exit 1
fi
