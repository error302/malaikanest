#!/usr/bin/env bash
# =============================================================================
# Malaika Nest — backups + the two money-critical cron jobs.
#
# WHY THE EXISTING BACKUP IS NOT PROTECTING YOU
# ---------------------------------------------
# scripts/ops/backup-compose.sh defaults to:
#     COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
# and dumps "$POSTGRES_DB" read from inside the `db` container. But:
#
#   * docker-compose.yml is NOT the file your VM runs. Production runs
#     docker-compose.lean.yml, which is not even in the repo.
#     -> `docker compose -f docker-compose.yml exec db ...` targets a service
#        in a project that is not up. It fails.
#   * The repo's compose defaults the DB name to `kenya_ecom`; your handoff
#     brief says the live database is `malaika_db`; backend/.env.example says
#     `malaika_production`. Three different names across three files.
#     -> If the timer IS running, it may be dumping a database that does not
#        exist, writing a 0-byte file, and exiting non-zero into a log nobody
#        reads.
#   * It also dumps `malaika_cms` unconditionally. That database only exists if
#     the `cms-db-init` one-shot from the full stack ran. On the lean stack it
#     does not exist, so the second dump fails every night.
#
# RUN THIS FIRST to find out the truth:
#     ssh malaikanest-gcp "systemctl list-timers --all | grep -i backup; \
#       ls -la /var/backups/malaikanest/ ~/backups 2>/dev/null; \
#       crontab -l"
# If you do not see a recent multi-megabyte .dump file, you have NO backup.
#
# Install:
#     scp ops/09_backup_and_cron.sh malaikanest-gcp:~/
#     ssh malaikanest-gcp "bash ~/09_backup_and_cron.sh install"
# =============================================================================
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/malaikanest}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.lean.yml}"
COMPOSE="docker compose -f ${APP_DIR}/${COMPOSE_FILE}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
MIN_DUMP_BYTES="${MIN_DUMP_BYTES:-20480}"   # 20 KB: a real catalogue is bigger
LOG_FILE="${BACKUP_DIR}/backup.log"

log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG_FILE"; }

# ─────────────────────────────────────────────────────────────────────────────
backup() {
  mkdir -p "$BACKUP_DIR"
  cd "$APP_DIR"

  # Read the credentials from the RUNNING container's own environment. This is
  # the only way to be certain you are dumping the database Django is actually
  # connected to, rather than a name guessed from a compose default.
  local DB_NAME DB_USER
  DB_NAME=$($COMPOSE exec -T db sh -c 'echo "$POSTGRES_DB"')
  DB_USER=$($COMPOSE exec -T db sh -c 'echo "$POSTGRES_USER"')

  if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
    log "FATAL: could not read POSTGRES_DB/POSTGRES_USER from the db container."
    log "       Is the stack up? Try: $COMPOSE ps"
    return 1
  fi

  local STAMP OUT
  STAMP=$(date +%Y%m%d-%H%M%S)
  OUT="$BACKUP_DIR/malaikanest-${DB_NAME}-${STAMP}.dump"

  log "Dumping database '$DB_NAME' (user $DB_USER) -> $OUT"

  # -Fc = custom format: compressed, and restorable with pg_restore into a
  # database with a DIFFERENT name. Plain SQL cannot do that, which matters
  # because your DB name is already inconsistent across three files.
  if ! $COMPOSE exec -T db pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$OUT"; then
    log "FATAL: pg_dump failed for $DB_NAME"
    rm -f "$OUT"
    return 1
  fi

  local SIZE
  SIZE=$(stat -c%s "$OUT" 2>/dev/null || echo 0)
  if [ "$SIZE" -lt "$MIN_DUMP_BYTES" ]; then
    log "FATAL: dump is only $SIZE bytes (< $MIN_DUMP_BYTES). This is not a real"
    log "       database — it is probably an error message. Refusing to keep it,"
    log "       because a truncated dump silently replacing a good one is how you"
    log "       discover at 3am that you have no backup at all."
    rm -f "$OUT"
    return 1
  fi
  log "OK: $OUT ($((SIZE / 1024)) KB)"

  # Verify it is actually a readable archive. Cheap, and catches the case where
  # pg_dump "succeeded" but wrote a partial file.
  if ! $COMPOSE exec -T db sh -c "pg_restore --list" < "$OUT" >/dev/null 2>&1; then
    log "WARNING: pg_restore --list could not read the archive. Investigate."
  fi

  # Prune
  find "$BACKUP_DIR" -name 'malaikanest-*.dump' -mtime "+$RETENTION_DAYS" -print -delete | tee -a "$LOG_FILE"

  # ── Off-box copy ───────────────────────────────────────────────────────────
  # A backup on the same 30 GB boot disk as the database protects you against a
  # bad migration, not against losing the VM. GCP free tier has no snapshot
  # schedule, so push it off-box. Cloudflare R2 gives you 10 GB free with no
  # egress fees; rclone is a single static binary.
  #
  #   One-off setup:
  #     ssh malaikanest-gcp
  #     curl -O https://downloads.rclone.org/current/rclone-current-linux-amd64.zip
  #     unzip rclone-current-linux-amd64.zip && sudo cp rclone-*/rclone /usr/local/bin/
  #     rclone config    # type=s3, provider=Cloudflare, access key + secret from
  #                      # the R2 dashboard, endpoint = your R2 account S3 URL
  #
  # Then uncomment:
  # if command -v rclone >/dev/null 2>&1; then
  #   rclone copy "$OUT" r2:malaikanest-backups/ --transfers 2 2>>"$LOG_FILE" \
  #     && log "Uploaded to R2" || log "WARNING: R2 upload failed"
  # fi
}

# ─────────────────────────────────────────────────────────────────────────────
# The two scheduled jobs that actually protect revenue, if you are NOT running
# docker-compose.worker.yml. `manage.py <task>` is not a thing — these wrap the
# Celery task bodies in a one-shot Django shell call, which needs no broker.
# ─────────────────────────────────────────────────────────────────────────────
reconcile() {
  cd "$APP_DIR"
  log "Running M-Pesa reconciliation (recovers payments whose callback was lost)"
  $COMPOSE exec -T web python manage.py shell -c \
    "from apps.payments.tasks import reconcile_payments_task; print(reconcile_payments_task(5, 500))" \
    2>&1 | tee -a "$LOG_FILE"
}

cancel_stale() {
  cd "$APP_DIR"
  log "Cancelling stale pending orders and releasing their reserved stock"
  $COMPOSE exec -T web python manage.py shell -c \
    "from apps.orders.tasks import cancel_stale_pending_orders; print(cancel_stale_pending_orders())" \
    2>&1 | tee -a "$LOG_FILE"
}

drain_outbox() {
  cd "$APP_DIR"
  # Safety net: if any OutboxEvent is still pending (web restarted mid-drain),
  # flush it. This is what guarantees no paid order is left without an invoice.
  $COMPOSE exec -T web python manage.py shell -c \
    "from apps.core.tasks import process_outbox; print(process_outbox(200))" \
    2>&1 | tee -a "$LOG_FILE"
}

install_cron() {
  local CRON
  CRON=$(mktemp)
  crontab -l 2>/dev/null | grep -v 'malaikanest-ops' > "$CRON" || true

  cat >> "$CRON" <<EOF
# malaikanest-ops — installed by 09_backup_and_cron.sh
17 3 * * *  bash $HOME/09_backup_and_cron.sh backup      >> $BACKUP_DIR/cron.log 2>&1
*/15 * * * * bash $HOME/09_backup_and_cron.sh reconcile   >> $BACKUP_DIR/cron.log 2>&1
*/10 * * * * bash $HOME/09_backup_and_cron.sh drain       >> $BACKUP_DIR/cron.log 2>&1
23 * * * *  bash $HOME/09_backup_and_cron.sh cancel-stale >> $BACKUP_DIR/cron.log 2>&1
EOF

  crontab "$CRON" && rm -f "$CRON"
  log "Installed crontab:"
  crontab -l | grep malaikanest-ops

  cat <<'EOF'

NOTE on egress cost: GCP free tier gives 1 GB/month of network egress from a
VM. A pg_dump of a small catalogue is a few MB, so a daily upload to R2 costs
roughly 100-200 MB/month of that allowance — fine, but not unlimited. If you
add product images to Postgres instead of Cloudinary, this changes.
EOF
}

verify() {
  log "=== timer/cron status ==="
  crontab -l 2>/dev/null | grep malaikanest-ops || echo "  (no malaikanest cron installed)"
  systemctl list-timers --all 2>/dev/null | grep -i backup || echo "  (no backup systemd timer)"
  echo "=== existing backups ==="
  ls -lah "$BACKUP_DIR" 2>/dev/null || echo "  $BACKUP_DIR does not exist"
  echo "=== newest dump readable? ==="
  local NEWEST
  NEWEST=$(ls -1t "$BACKUP_DIR"/malaikanest-*.dump 2>/dev/null | head -1 || true)
  if [ -n "$NEWEST" ]; then
    cd "$APP_DIR"
    $COMPOSE exec -T db sh -c "pg_restore --list" < "$NEWEST" | head -5 && echo "  ^ readable: $NEWEST"
  else
    echo "  NO DUMPS FOUND. You currently have no backup."
  fi
}

case "${1:-}" in
  backup)       backup ;;
  reconcile)    reconcile ;;
  cancel-stale) cancel_stale ;;
  drain)        drain_outbox ;;
  install)      install_cron ;;
  verify)       verify ;;
  *)
    cat <<EOF
Usage: $0 {install|backup|verify|reconcile|drain|cancel-stale}

  install       add the cron entries (backup 03:17, reconcile */15, drain */10,
                cancel-stale hourly)
  backup        take a dump now
  verify        show whether you actually have a usable backup   <-- RUN THIS FIRST
  reconcile     recover M-Pesa payments whose callback never arrived
  drain         flush any pending outbox events (invoices, receipt emails)
  cancel-stale  release stock held by abandoned pending orders
EOF
    exit 1
    ;;
esac
