#!/usr/bin/env bash
# ==============================================================================
# Lean Monolith PostgreSQL Backup Script
# Creates an atomic compressed SQL dump of the production database before cutover.
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/malaikanest}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/malaika_db_backup_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="${CONTAINER_NAME:-malaikanest-db-1}"
DB_USER="${POSTGRES_USER:-kenya}"
DB_NAME="${POSTGRES_DB:-kenya_ecom}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date -u +%FT%TZ)] Starting PostgreSQL backup for ${DB_NAME}..."

# Dump directly from postgres container
if docker ps --format '{{.Names}}' | grep -q "${CONTAINER_NAME}"; then
  docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"
elif docker ps --format '{{.Names}}' | grep -q "db"; then
  DB_C="$(docker ps --format '{{.Names}}' | grep "db" | head -n 1)"
  docker exec "${DB_C}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"
else
  echo "[ERROR] Database container not found running!" >&2
  exit 1
fi

SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
echo "[$(date -u +%FT%TZ)] Backup completed successfully: ${BACKUP_FILE} (${SIZE})"

# Retention: keep last 14 days of backups
find "${BACKUP_DIR}" -type f -name "malaika_db_backup_*.sql.gz" -mtime +14 -delete
echo "[$(date -u +%FT%TZ)] Cleaned up backups older than 14 days."
