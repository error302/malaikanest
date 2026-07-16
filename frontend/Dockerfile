FROM node:22-alpine

ENV NODE_ENV=development \
    PORT=3000 \
    HOSTNAME=0.0.0.0

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --no-audit --no-fund

COPY . .

EXPOSE 3000

CMD sh -c "rm -rf .next node_modules/.prisma && npx prisma db push 2>&1; npx prisma generate && npx next dev -p 3000 -H 0.0.0.0 --turbopack"
