#!/usr/bin/env bash
set -euo pipefail
BACKUP_DIR=/var/backups/malaikanest
TS=$(date +%F_%H%M%S)
mkdir -p "$BACKUP_DIR"
source /var/www/malaikanest/backend/.env.production
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo 'DATABASE_URL missing' >&2
  exit 1
fi
pg_dump "$DATABASE_URL" -F c -f "$BACKUP_DIR/malaika_db_${TS}.dump"
find "$BACKUP_DIR" -type f -name '*.dump' -mtime +7 -delete
