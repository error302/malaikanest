#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/malaikanest}"
PG_USER="${PG_USER:-malaika_user}"
PG_DB="${PG_DB:-malaika_db}"
PG_HOST="${PG_HOST:-localhost}"
MEDIA_DIR="${MEDIA_DIR:-/home/mohameddosho20/malaikanest/backend/media}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
GCS_BUCKET="${GCS_BUCKET:-}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
DB_FILE="$BACKUP_DIR/db-$TIMESTAMP.sql.gz"
MEDIA_FILE="$BACKUP_DIR/media-$TIMESTAMP.tar.gz"

notify() {
  local msg="$1"
  if [ -n "$ALERT_WEBHOOK" ]; then
    curl -s -X POST -H 'Content-Type: application/json' -d "{\"text\":\"$msg\"}" "$ALERT_WEBHOOK" >/dev/null || true
  fi
}

if ! pg_dump -U "$PG_USER" -h "$PG_HOST" "$PG_DB" | gzip > "$DB_FILE"; then
  notify "Backup failed: DB dump error"
  exit 1
fi

if [ -d "$MEDIA_DIR" ]; then
  tar -czf "$MEDIA_FILE" -C "$MEDIA_DIR" .
fi

sha256sum "$DB_FILE" > "$DB_FILE.sha256"
if [ -f "$MEDIA_FILE" ]; then
  sha256sum "$MEDIA_FILE" > "$MEDIA_FILE.sha256"
fi

find "$BACKUP_DIR" -type f -mtime +"$RETENTION_DAYS" -delete

if [ -n "$GCS_BUCKET" ]; then
  gsutil -m rsync -r "$BACKUP_DIR" "$GCS_BUCKET/malaikanest-backups"
fi

notify "Backup success: $TIMESTAMP"

echo "Backup complete: $TIMESTAMP"