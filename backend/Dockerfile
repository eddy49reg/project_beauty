# Сборка Nest + Prisma Client
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY nest-cli.json ./
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

# Продакшен-образ: только runtime-зависимости + Prisma CLI для migrate deploy
FROM node:22-bookworm-slim AS production

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
  && npm install prisma@7.5.0 --no-save

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

# Сначала применяем миграции к БД в Docker-сети, затем стартуем API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
