# Timeweb Cloud — деплой Leadership Architect (монорепа)

## TL;DR (структура в Timeweb)

- **PostgreSQL (Managed DB)**: отдельный ресурс в Timeweb Cloud.
- **App Platform: API**: NestJS (`apps/api`) — деплоится **отдельным приложением**.
- **App Platform: WEB**: Next.js (`apps/web`) — деплоится **отдельным приложением**.

Ограничение Timeweb, которое влияет на архитектуру деплоя: **Dockerfile берётся из корня репозитория** → для фронта и бэка практично держать **разные ветки** с разным корневым `Dockerfile`.

---

## Репозиторий и ветки

### Ветка `main` — API

- В корне `Dockerfile` ориентирован на сборку и запуск `apps/api`.
- На старте контейнера выполняются Prisma миграции (через entrypoint), чтобы не ловить ошибки вида “таблица не существует”.

### Ветка `web` — фронтенд

- В корне `Dockerfile` ориентирован на сборку и запуск `apps/web`.
- `NEXT_PUBLIC_API_URL` должен быть доступен **на этапе build** (если UI Timeweb не даёт build args — задаём через `ENV` в Dockerfile).

---

## Структура ресурсов в Timeweb Cloud (рекомендованная)

### 1) Managed PostgreSQL

- **Сеть**: приватная сеть Timeweb (чтобы App Platform мог ходить в БД по приватному IP).
- **Доступы**:
  - пользователь/пароль
  - имя БД
  - host + port (обычно 5432)

### 2) App Platform: API (NestJS)

- **Source**: GitHub repo
- **Branch**: `main`
- **Dockerfile**: корневой `Dockerfile` (из `main`)
- **Env** (минимум):
  - `DATABASE_URL` (PostgreSQL)
  - `PORT` (если требуется, обычно `3001`)
  - `NODE_ENV=production`
  - (если есть) любые секреты/ключи, которые использует API
- **Network**:
  - приложение должно быть в той же сети, что и БД (или иметь маршрут до приватного IP БД)

### 3) App Platform: WEB (Next.js)

- **Source**: GitHub repo
- **Branch**: `web`
- **Dockerfile**: корневой `Dockerfile` (из `web`)
- **Env**:
  - `NEXT_PUBLIC_API_URL` = публичный URL API (или внутренний, если фронт и бэк в одной приватной сети и есть внутренний роутинг/домен)
  - `PORT` (если Timeweb требует)
  - `NODE_ENV=production`

---

## DATABASE_URL (шаблон)

Формат Prisma/Postgres:

```
postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public
```

Если Timeweb требует SSL:

```
postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public&sslmode=require
```

Важно: если используешь **приватный IP** БД (например `192.168.x.x`) — убедись, что API‑приложение реально подключено к той же приватной сети.

---

## Типовые проблемы Timeweb (и что делать)

### A) Timeweb деплоит не тот коммит / старую версию

Симптомы:
- в логах ошибки, которые уже исправлены в репо

Решение:
- в настройках приложения Timeweb **вручную обновить выбранный commit** на последний
- либо включить auto‑deploy при push

### B) “Table does not exist” после успешного запуска API

Причина:
- Prisma миграции не применились

Решение:
- запускать `prisma migrate deploy` при старте контейнера API (entrypoint)

### C) Next.js build падает на типизации/линтинге

Причина:
- реальные ошибки типов/импортов (не лечить через `ignoreBuildErrors`)

Решение:
- чинить типы/импорты
- прогонять локально: `pnpm --filter @leadership-architect/web build`

### D) Next.js: `useSearchParams() should be wrapped in a suspense boundary`

Причина:
- Next 14 требует `Suspense` вокруг `useSearchParams` в app router при пререндере

Решение:
- оборачивать страницу в `Suspense` и выносить содержимое в `*Inner` компонент

Файлы, где это уже применялось:
- `apps/web/src/app/architecture/page.tsx`
- `apps/web/src/app/experiments/page.tsx`
- `apps/web/src/app/evidence/new/page.tsx`

---

## Чеклист тестирования после “запуск состоялся”

### 1) Проверка API (в браузере/через curl)

- Health endpoint (если есть): `GET /health`
- Swagger (если есть): `/api` или `/swagger`
- Любой endpoint, который делает запрос к БД (чтобы убедиться в миграциях)

### 2) Проверка WEB

- Открывается главная страница
- Страницы с данными (quests/builds/architecture/traces) не падают
- В DevTools Network:
  - запросы идут на `NEXT_PUBLIC_API_URL`
  - нет CORS/401 (если есть авторизация — проверить токен/куки)

### 3) Логи в Timeweb

- API:
  - виден успешный connect к БД
  - `prisma migrate deploy` не падает
- WEB:
  - нет runtime ошибок Next

---

## Локальная “проверка перед пушем” (минимум)

Из корня монорепы:

```bash
corepack enable
corepack prepare pnpm@10.26.2 --activate
pnpm install --frozen-lockfile
pnpm --filter @leadership-architect/web build
```

Для API (если нужно):

```bash
pnpm --filter @leadership-architect/api build
```

---

## Примечания по безопасности

- `DATABASE_URL` и любые секреты — только через Env Variables в Timeweb, не коммитить.
- `NEXT_PUBLIC_*` попадает в клиентский бандл — не класть туда секреты.

