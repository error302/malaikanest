FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

WORKDIR /app

COPY package.json package-lock.json* ./

# Install ALL dependencies (dev deps like @tailwindcss/postcss are required for the build)
RUN npm ci --include=dev --no-audit --no-fund

COPY . .

EXPOSE 3000

# Production build: generate Prisma client, build, then run the optimized server.
CMD sh -c "npx prisma generate && npx next build && npx next start -p 3000 -H 0.0.0.0"
