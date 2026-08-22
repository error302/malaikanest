#!/bin/bash
# Malaika Nest — Docker Compose native restore
#
# Restores artifacts produced by backup-compose.sh:
#   ./restore-compose.sh --db   backups/compose/pg-YYYYMMDD-HHMMSS.dump
#   ./restore-compose.sh --cms  backups/compose/cms-YYYYMMDD-HHMMSS.tar.gz
#
# Postgres restore uses pg_restore --clean --if-exists inside the db container
# (credentials read from the container's own env). CMS restore extracts the
# tarball into the frontend_cms_data volume; restart the frontend service after.
#
# DESTRUCTIVE: replaces current data. Prompts unless --yes is passed.
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
COMPOSE="docker compose -f ${COMPOSE_FILE}"
MODE=""
FILE=""
ASSUME_YES=0

usage() {
  echo "Usage: $0 (--db|--cms) <backup-file> [--yes]"
  exit 2
}

while [ $# -gt 0 ]; do
  case "$1" in
    --db)  MODE="db";  shift ;;
    --cms) MODE="cms"; shift ;;
    --yes) ASSUME_YES=1; shift ;;
    -h|--help) usage ;;
    *) if [ -z "$FILE" ]; then FILE="$1"; shift; else usage; fi ;;
  esac
done

[ -n "$MODE" ] && [ -n "$FILE" ] || usage
if [ ! -f "$FILE" ]; then
  echo "ERROR: file not found: $FILE"
  exit 1
fi

cd "$(dirname "$0")/../.." || exit 1

# Verify checksum when a sidecar .sha256 exists (run from the file's directory).
if [ -f "$FILE.sha256" ]; then
  echo "Verifying checksum..."
  (cd "$(dirname "$FILE")" && sha256sum -c "$(basename "$FILE").sha256")
fi

TARGET="$($COMPOSE ps --services 2>/dev/null | grep -x 'db' || true)"
if [ "$MODE" = "db" ] && [ -z "$TARGET" ]; then
  echo "ERROR: db service is not running. Start the stack first: docker compose up -d db"
  exit 1
fi

echo
echo "About to restore:"
echo "  mode : $MODE"
echo "  file : $FILE ($(du -h "$FILE" | cut -f1))"
[ "$MODE" = "db" ] && echo "  into : running PostgreSQL container 'db' (--clean will DROP existing objects)"
[ "$MODE" = "cms" ] && echo "  into : frontend_cms_data volume (frontend service should be stopped)"
echo

if [ "$ASSUME_YES" -ne 1 ]; then
  read -r -p "Type RESTORE to continue: " answer
  [ "$answer" = "RESTORE" ] || { echo "Aborted."; exit 1; }
fi

case "$MODE" in
  db)
    $COMPOSE exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < "$FILE"
    echo "Postgres restore complete."
    echo "Sanity check: $COMPOSE exec db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c '\\dt' | head"
    ;;
  cms)
    $COMPOSE stop frontend || true
    VOLUME="$(docker volume ls --format '{{.Name}}' | grep -E '(^|[_-])frontend_cms_data$' | head -n1 || true)"
    if [ -z "$VOLUME" ]; then
      echo "ERROR: could not resolve frontend_cms_data volume name"
      exit 1
    fi
    echo "Restoring into volume: $VOLUME"
    docker run --rm -i \
      -v "${VOLUME}:/data" \
      alpine sh -c "rm -f /data/cms.db /data/cms.db-wal /data/cms.db-shm && tar xzf - -C /data" < "$FILE"
    $COMPOSE start frontend || true
    echo "CMS restore complete. Frontend restarted."
    ;;
esac

echo "Done."
