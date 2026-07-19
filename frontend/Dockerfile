FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

WORKDIR /app

COPY package.json package-lock.json* ./

# Install ALL dependencies (dev deps like @tailwindcss/postcss are required for the build)
RUN npm ci --include=dev --no-audit --no-fund

COPY . .

# NEXT_PUBLIC_* variables are inlined into the client bundle at BUILD time, so they
# must be present here (not just at runtime). The browser on malaikanest.com must
# reach the API at api.malaikanest.com (cloudflared routes that host to the backend).
ARG NEXT_PUBLIC_API_URL="https://api.malaikanest.com"
ARG NEXT_PUBLIC_SITE_URL="https://malaikanest.com"
ARG NEXT_PUBLIC_GA_ID=""
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=$NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION

# The runtime CMS database lives in a mounted volume at /app/data/cms.db. During
# the image build we only need a valid DATABASE_URL for `prisma generate` and the
# Next.js build; no real DB is touched at build time.
ENV DATABASE_URL="file:/app/data/cms.db"

# Preserve any pre-configured CMS content as a seed used on first boot only.
RUN if [ -f prisma/dev.db ]; then cp prisma/dev.db prisma/seed.db; fi

# Generate the Prisma client and build the optimized production bundle at image
# build time so container startup is fast.
RUN npx prisma generate && npx next build

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

CMD ["sh", "docker-entrypoint.sh"]
