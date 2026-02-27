#!/usr/bin/env bash
set -euo pipefail

# Helper to run Django migrations, collectstatic and seed categories in production
# Usage: sudo bash deployment/run_migrations.sh /path/to/repo

REPO_DIR=${1:-$(pwd)}
COMPOSE_FILE=${2:-docker-compose.prod.yml}

cd "$REPO_DIR"

echo "Running migrations and collectstatic via docker compose (${COMPOSE_FILE})"
docker compose -f "$COMPOSE_FILE" exec -T backend python manage.py migrate --noinput
docker compose -f "$COMPOSE_FILE" exec -T backend python manage.py collectstatic --noinput
echo "Seeding categories (idempotent)"
docker compose -f "$COMPOSE_FILE" exec -T backend python manage.py seed_categories || true

echo "Done. Run 'docker compose -f $COMPOSE_FILE up -d' if not already running."
