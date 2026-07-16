# Frontend (Next.js 16 + Prisma + bun) — dev run for local testing.
FROM oven/bun:1.1

ENV NODE_ENV=development \
    PORT=3000 \
    HOSTNAME=0.0.0.0

WORKDIR /app

# Prisma needs DATABASE_URL at generate time; supply a local SQLite file URL.
ENV DATABASE_URL=file:./dev.db

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

COPY . .

EXPOSE 3000
# Generate Prisma client + push SQLite schema at startup, then clear any stale
# Turbopack cache so Next.js picks up the fresh Prisma client binary hash.
CMD sh -c "rm -rf .next node_modules/.prisma && bunx prisma db push --skip-generate && bunx prisma generate && bun next dev --webpack -p 3000 -H 0.0.0.0"
