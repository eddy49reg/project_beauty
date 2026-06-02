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
- `CORS_ORIGIN=http://localhost:5173` (при необходимости несколько origin через запятую)

### Фото работ (Яндекс.Диск)

Для загрузки изображений к черновику работы backend вызывает [REST API Яндекс.Диска](https://yandex.ru/dev/disk/api/) с авторизацией **OAuth**.

**Почему в `.env` только `client_id` и `client_secret`.** Это не логин/пароль к Диску: это ключи **вашего приложения** в Яндексе. Сервер Яндекса выдаёт `refresh_token` и `access_token` только после того, как **владелец Диска** подтвердил доступ (страница с кодом подтверждения). Ни `client_secret`, ни backend сами по себе не могут «сгенерировать» refresh без этого шага — так устроен OAuth.

**Первичная привязка (делает администратор, один раз на окружение):**

1. В кабинете OAuth создайте приложение: scope `cloud_api:disk.read`, `cloud_api:disk.write`, Redirect URI **`https://oauth.yandex.ru/verification_code`**.
2. В `backend/.env` укажите `YANDEX_DISK_OAUTH_CLIENT_ID` и `YANDEX_DISK_OAUTH_CLIENT_SECRET`, перезапустите backend.
3. Авторизуйтесь в системе под пользователем с ролью **ADMIN**, получите JWT.
4. Вызовите **`GET /admin/yandex-disk/oauth/authorize-url`** — в ответе поле `authorizeUrl`. Откройте его в браузере и войдите в **тот** аккаунт Яндекса, к которому привязывается Диск.
5. Со страницы подтверждения Яндекса скопируйте **код**.
6. Вызовите **`POST /admin/yandex-disk/oauth/exchange-code`** с телом JSON `{ "code": "ВАШ_КОД" }` и заголовком `Authorization: Bearer <JWT>`. Backend обменяет код на токены у Яндекса и сохранит `refresh_token` и `access_token` в таблицу **`yandex_disk_oauth_state`**. Дальше access обновляется сам по refresh.

Опционально `YANDEX_DISK_ROOT_FOLDER` — имя папки в корне Диска (по умолчанию `beauty-championship-uploads`).

Пока в БД нет refresh, `GET /meta/client` вернёт `workPhotoUploadEnabled: false`. После успешного `exchange-code` и перезагрузки страницы загрузка фото включится; **отправка работы на судейство** потребует хотя бы одно изображение, пока Диск настроен.

**Пересборка backend / перезапуск контейнера.** Повторять шаги 1–6 **не нужно**: `refresh_token` и актуальные access лежат в **PostgreSQL** (`yandex_disk_oauth_state`), а не в образе приложения. Заново пройти привязку придётся только если вы **очистили БД** (новый том Postgres), удалили строку в этой таблице, сменили `client_secret` в кабинете Яндекса или пользователь **отозвал доступ** приложению к Диску.

**Срок жизни токенов.** Короткоживущий **access_token** backend сам обновляет по **refresh_token** перед запросами к API Диска (запрос `grant_type=refresh_token` к `oauth.yandex.ru/token`, ответ сохраняется в БД). Если Яндекс в ответе пришлёт **новый** `refresh_token` (ротация), он тоже записывается в ту же строку. Если refresh перестал быть валидным (отзыв, политика Яндекса, смена пароля аккаунта и т.д.) — снова выполните шаги 4–6.

**Ручной обмен без админ-API** (эквивалент тому, что делает `exchange-code`):

```bash
curl -sS -X POST https://oauth.yandex.ru/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=authorization_code' \
  --data-urlencode 'code=ВАШ_КОД' \
  --data-urlencode 'client_id=ВАШ_CLIENT_ID' \
  --data-urlencode 'client_secret=ВАШ_CLIENT_SECRET' \
  --data-urlencode 'redirect_uri=https://oauth.yandex.ru/verification_code'
```

Дальше вручную перенесите `refresh_token` и `access_token` из ответа в строку таблицы `yandex_disk_oauth_state` (id=1) — проще использовать шаг 6 выше.

### Frontend (опционально)

Если нужно явно указать API **вне** docker/nginx-прокси:

```bash
cd frontend
echo 'VITE_API_URL=http://localhost:3000' > .env.local
```

В docker-compose фронт ходит на API через префикс `/api` того же хоста — `VITE_API_URL` не нужен.

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
   - подачу работ (создать черновик → **прикрепить фото**, если настроен Яндекс.Диск → отправить),
   - судейство и финализацию оценки (просмотр фото на странице оценки),
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

## 9) Production на VPS (my-chemp.online)

Предполагается Ubuntu, Docker, проект в `/opt/project_beauty`, DNS A‑записи `@` и `www` → IP VPS.

### 9.1) Файлы окружения на сервере

```bash
cd /opt/project_beauty
cp .env.prod.example .env.prod
nano .env.prod   # DOMAIN, POSTGRES_PASSWORD, JWT_SECRET (openssl rand -hex 32)

cp backend/.env.example backend/.env
nano backend/.env   # Yandex OAuth client id/secret при необходимости
```

### 9.2) Запуск

```bash
docker compose --env-file .env.prod \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d --build
```

Проверка: `docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml ps`

Caddy сам получит HTTPS для `DOMAIN` из `.env.prod`.

### 9.3) Seed (один раз)

```bash
chmod +x scripts/run-prod-seed.sh
./scripts/run-prod-seed.sh
```

Логин для комиссии: `admin` / `admin123`.

### 9.4) Smoke-check

1. `https://my-chemp.online` — открывается SPA.
2. Вход `admin/admin123`.
3. Список чемпионатов, судейство, результаты.

### 9.5) Яндекс.Диск на проде

OAuth привязку выполнить заново под боевым доменом (см. раздел 2). После `exchange-code` загрузка фото работ включится.
