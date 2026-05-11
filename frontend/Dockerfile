# Сборка Vite → nginx. API с браузера: префикс /api (см. nginx.conf), без CORS.
# При необходимости вынести API на другой домен: docker build --build-arg VITE_API_URL=https://api.example.com
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
ENV HUSKY=0
RUN npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json eslint.config.js ./
COPY public ./public
COPY src ./src

# Опционально: --build-arg VITE_API_URL=https://api.example.com (иначе в коде используется /api)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
