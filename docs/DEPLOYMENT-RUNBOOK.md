# Deployment Runbook (MVP)

Краткая инструкция для запуска и проверки системы перед демонстрацией.

## 1) Предусловия

- Docker + Docker Compose
- Node.js 20+
- npm 10+

## 2) Подготовка окружения

### Backend

```bash
cd backend
cp .env.example .env
```

Проверьте значения:

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5434/beauty_championship?schema=public`
- `JWT_SECRET=<длинная случайная строка>`
- `CORS_ORIGIN=http://localhost:5173`

### Frontend (опционально)

Если нужно явно указать API:

```bash
cd frontend
echo 'VITE_API_URL=http://localhost:3000' > .env.local
```

## 3) Запуск инфраструктуры

Из корня проекта:

```bash
docker compose up -d postgres
```

Проверка:

```bash
docker compose ps
```

`postgres` должен быть в состоянии `healthy`.

## 4) Миграции и seed

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
```

## 5) Запуск приложения

В двух терминалах:

```bash
# Terminal 1
cd backend
npm run start:dev
```

```bash
# Terminal 2
cd frontend
npm install
npm run dev
```

## 6) Smoke-check перед показом

1. Открыть `http://localhost:5173`.
2. Войти под `admin/admin123`.
3. Проверить:
   - список чемпионатов,
   - номинации,
   - назначения,
   - подачу работ,
   - судейство и финализацию оценки,
   - страницу результатов.

## 7) Production-like сборка (локально)

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

## 8) Типичные проблемы

- **Порт 5434 занят**: сменить внешний порт в `docker-compose.yml` и в `backend/.env`.
- **401 на фронте**: проверить `JWT_SECRET` и повторно войти.
- **CORS ошибка**: сверить `CORS_ORIGIN` и фактический URL фронта.
- **Миграция не применяется**: проверить `DATABASE_URL` и состояние контейнера БД.
