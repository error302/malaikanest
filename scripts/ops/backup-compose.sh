#!/bin/bash
# Malaika Nest — Docker Compose native backup
#
# Backs up, from the ACTIVE docker-compose.yml topology:
#   1. PostgreSQL  -> custom-format dump via `docker compose exec db pg_dump`
#   2. CMS SQLite  -> tar snapshot of the frontend_cms_data volume (cms.db/-wal/-shm)
#
# Credentials are read INSIDE the db container from its own POSTGRES_* env,
# so this script needs no secrets on the host.
#
# Schedule (see deployment/systemd/malaikanest-compose-backup.*):
#   Systemd timer daily, or cron:
#   30 3 * * * /opt/malaikanest/scripts/ops/backup-compose.sh >> /var/log/malaikanest/backup.log 2>&1
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
COMPOSE="docker compose -f ${COMPOSE_FILE}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/malaikanest/compose}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"
POST_BACKUP_CMD="${POST_BACKUP_CMD:-}"
MIN_DUMP_BYTES="${MIN_DUMP_BYTES:-1024}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
notify() {
  local msg="$1"
  if [ -n "$ALERT_WEBHOOK" ]; then
    curl -sS -X POST -H 'Content-Type: application/json' \
      -d "{\"text\":\"$msg\"}" "$ALERT_WEBHOOK" >/dev/null || true
  fi
}

cd "$(dirname "$0")/../.." || exit 1

mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DB_FILE="$BACKUP_DIR/pg-$TIMESTAMP.dump"
CMS_FILE="$BACKUP_DIR/cms-$TIMESTAMP.tar.gz"
FAILED=0

trap 'notify "Malaika Nest compose backup FAILED at $TIMESTAMP"; log "Backup FAILED"' ERR

# --- 1. PostgreSQL -----------------------------------------------------------
if ! $COMPOSE exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' > "$DB_FILE"; then
  log "ERROR: pg_dump failed"
  FAILED=1
elif [ ! -s "$DB_FILE" ] || [ "$(wc -c < "$DB_FILE")" -lt "$MIN_DUMP_BYTES" ]; then
  log "ERROR: dump file suspiciously small (< ${MIN_DUMP_BYTES} bytes)"
  rm -f "$DB_FILE"
  FAILED=1
else
  sha256sum "$DB_FILE" > "$DB_FILE.sha256"
  log "Postgres dump OK: $DB_FILE ($(du -h "$DB_FILE" | cut -f1))"
fi

# --- 2. CMS SQLite volume ----------------------------------------------------
if ! $COMPOSE config --volumes 2>/dev/null | grep -q '^frontend_cms_data$'; then
  log "WARN: frontend_cms_data volume not found in compose config; skipping CMS snapshot"
  CMS_VOLUME=""
else
  CMS_VOLUME="frontend_cms_data"
fi

if [ -n "${CMS_VOLUME:-}" ]; then
  FULL_VOLUME="$(docker volume ls --format '{{.Name}}' | grep -E '(^|[_-])frontend_cms_data$' | head -n1 || true)"
  [ -z "$FULL_VOLUME" ] && FULL_VOLUME="$CMS_VOLUME"
  log "Snapshotting volume: $FULL_VOLUME"
  if docker run --rm \
       -v "${FULL_VOLUME}:/data:ro" \
       -v "${BACKUP_DIR}:/backup" \
       alpine sh -c "tar czf /backup/$(basename "$CMS_FILE") -C /data cms.db cms.db-wal cms.db-shm 2>/dev/null || tar czf /backup/$(basename "$CMS_FILE") -C /data cms.db"; then
    sha256sum "$CMS_FILE" > "$CMS_FILE.sha256"
    log "CMS snapshot OK: $CMS_FILE ($(du -h "$CMS_FILE" | cut -f1))"
  else
    log "ERROR: CMS SQLite snapshot failed"
    FAILED=1
  fi
fi

# --- 3. Retention ------------------------------------------------------------
find "$BACKUP_DIR" -type f \( -name 'pg-*.dump*' -o -name 'cms-*.tar.gz*' \) \
  -mtime +"$RETENTION_DAYS" -delete
log "Retention applied: keeping last $RETENTION_DAYS days in $BACKUP_DIR"

# --- 4. Optional offload hook -------------------------------------------------
if [ -n "$POST_BACKUP_CMD" ] && [ "$FAILED" -eq 0 ]; then
  log "Running POST_BACKUP_CMD..."
  bash -c "$POST_BACKUP_CMD" || log "WARN: POST_BACKUP_CMD exited non-zero"
fi

if [ "$FAILED" -ne 0 ]; then
  notify "Malaika Nest compose backup PARTIALLY FAILED at $TIMESTAMP (check logs)"
  exit 1
fi

notify "Malaika Nest compose backup OK: $TIMESTAMP"
log "Backup complete: $TIMESTAMP"
