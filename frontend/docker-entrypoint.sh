#!/bin/sh
set -e

# Persistent SQLite location (backed by a Docker volume). The Prisma schema's
# DATABASE_URL points here via env. We keep runtime CMS data out of the image so
# admin edits survive rebuilds/redeploys.
DATA_DIR="/app/data"
DB_FILE="$DATA_DIR/cms.db"
SEED_DB="/app/prisma/seed.db"

mkdir -p "$DATA_DIR"

# First boot: if no persisted DB yet but a baked-in seed exists, copy it so the
# store starts with any pre-configured CMS content. Never overwrite an existing
# volume DB (that would wipe live admin edits).
if [ ! -f "$DB_FILE" ] && [ -f "$SEED_DB" ]; then
  echo "[entrypoint] Seeding CMS database from baked-in seed.db"
  cp "$SEED_DB" "$DB_FILE"
fi

# Idempotently ensure the schema exists / is up to date on the persisted DB.
echo "[entrypoint] Syncing Prisma schema (db push)"
npx prisma db push --skip-generate --accept-data-loss

echo "[entrypoint] Starting Next.js server"
exec npx next start -p 3000 -H 0.0.0.0
