#!/bin/sh
set -e

# The CMS database is PostgreSQL (`malaika_cms`, created by the cms-db-init
# one-shot compose service). CMS data lives in the postgres_data volume, so
# admin edits survive container rebuilds/redeploys. All we do here is
# idempotently sync the Prisma schema on every boot.
echo "[entrypoint] Syncing Prisma schema (db push)"
npx prisma db push --skip-generate --accept-data-loss

# `next.config.ts` uses `output: 'standalone'` so the optimized server bundle is
# `.next/standalone/server.js`. Falling back to `next start` would skip the
# standalone build (the server logs a warning) — always use the standalone entry.
echo "[entrypoint] Starting Next.js standalone server"
cd /app
if [ -f .next/standalone/server.js ]; then
  HOSTNAME=0.0.0.0 PORT=3000 exec node .next/standalone/server.js
else
  # Belt and suspenders: if the standalone build is somehow missing, fall back
  # to `next start` so the container still serves traffic.
  exec npx next start -p 3000 -H 0.0.0.0
fi
