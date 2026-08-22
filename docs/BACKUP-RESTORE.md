# Backup & Restore Runbook — Docker Compose topology

> **Applies to:** the active `docker-compose.yml` stack (db, redis, backend,
> celery, frontend, cloudflared). The older `deployment/backup.sh` targets the
> bare-metal systemd topology and does **not** back up this stack's volumes.

## What gets backed up

| Artifact | Source | Destination | Schedule |
|---|---|---|---|
| PostgreSQL dump (custom format `-Fc`) | `db` container (`pg_dump` runs inside it; creds from its own env) | `$BACKUP_DIR/pg-YYYYMMDD-HHMMSS.dump` + `.sha256` | Daily 03:30 (timer) |
| CMS SQLite (`cms.db` + `-wal` + `-shm`) | `frontend_cms_data` volume | `$BACKUP_DIR/cms-YYYYMMDD-HHMMSS.tar.gz` + `.sha256` | Same run |
| Media | Cloudinary (SaaS-side) | — | n/a |

Retention: 7 days (configurable via `RETENTION_DAYS`). Optional offload hook:
set `POST_BACKUP_CMD` in `/etc/malaikanest/backup.env`, e.g.
`POST_BACKUP_CMD="gsutil -m rsync -r /var/backups/malaikanest/compose gs://<bucket>/compose"`.

## Install on the production VM

```bash
# 1. Copy units (adjust paths to where the repo lives)
sudo cp deployment/systemd/malaikanest-compose-backup.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload

# 2. Optional config (backup dir, webhook, offload)
sudo mkdir -p /etc/malaikanest /var/backups/malaikanest/compose /var/log/malaikanest
echo 'ALERT_WEBHOOK=https://hooks.slack.com/services/XXX' | sudo tee /etc/malaikanest/backup.env

# 3. Enable
sudo systemctl enable --now malaikanest-compose-backup.timer
systemctl list-timers malaikanest-compose-backup.timer

# 4. First manual run + inspect output
sudo systemctl start malaikanest-compose-backup.service
journalctl -u malaikanest-compose-backup.service -n 50
ls -lh /var/backups/malaikanest/compose/
```

If line endings were converted to CRLF anywhere in transit:
`sed -i 's/\r$//' scripts/ops/*.sh`

## Restore procedures

### PostgreSQL

```bash
cd /opt/malaikanest   # repo root containing docker-compose.yml
./scripts/ops/restore-compose.sh --db backups/compose/pg-YYYYMMDD-HHMMSS.dump
# non-interactive: append --yes
```

- Uses `pg_restore --clean --if-exists --no-owner` inside the running `db`
  container — no host-side credentials needed.
- Verify afterwards:

```bash
docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt" | head -20
docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "SELECT COUNT(*) FROM orders_order;"
# then restart app services so connections re-establish cleanly
docker compose restart backend backend_replica celery_worker celery_beat
```

### CMS SQLite (branding/content/blog)

```bash
docker compose stop frontend          # restore script also does this
./scripts/ops/restore-compose.sh --cms backups/compose/cms-YYYYMMDD-HHMMSS.tar.gz
```

Script extracts into the `frontend_cms_data` volume and restarts frontend.

### Full-loss drill (test quarterly)

```bash
./scripts/ops/backup-compose.sh                       # fresh backup
docker compose down -v                                # ⚠️ wipes volumes — DRILL ONLY
docker compose up -d db redis
sleep 15                                              # wait for healthy
./scripts/ops/restore-compose.sh --db  <pg dump file> --yes
./scripts/ops/restore-compose.sh --cms <tar.gz file> --yes
docker compose up -d
curl -fsS http://127.0.0.1:8081/api/v1/health/        # expect 200
```

Record drill date + result in the ops log. A backup that has never been
restored is not a backup.

## Failure alerts

`backup-compose.sh` POSTs to `ALERT_WEBHOOK` on any failure and exits non-zero
(systemd shows `failed`). Check with:
`systemctl list-timers --all | grep malaika`
