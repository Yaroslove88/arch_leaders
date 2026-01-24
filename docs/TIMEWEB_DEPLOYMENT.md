# Timeweb Cloud — деплой Leadership Architect (монорепа)

> **Единственный источник документации по деплою на Timeweb Cloud.**
> 
> Для быстрого старта см. секцию "Быстрый старт: ENV переменные".

## Архитектура

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   PostgreSQL    │
│   (Next.js)     │     │    (NestJS)     │     │   (Managed DB)  │
│   Dockerfile.web│     │   Dockerfile.api│     │   Timeweb DBaaS │
│   Branch: web   │     │   Branch: main  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ↓                       ↓
   Port: 3000              Port: 3001
```

**Деплоим 2 отдельных приложения** в App Platform с разных веток:
- **API (NestJS)**: ветка `main`, использует `Dockerfile.api`
- **WEB (Next.js)**: ветка `web`, использует `Dockerfile.web` (переименован в `Dockerfile`)

---

## Быстрый старт: ENV переменные

### API (NestJS) — прописать в Timeweb App Platform

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public
PORT=3001
NODE_ENV=production
WEB_URL=https://yaroslove88-arch-leaders-3cd4.twc1.net
JWT_SECRET=eb9dcb841e6d5b8e0c052e00a035b98b0ad602d1e7198c1fe5e24b5397699849
JWT_EXPIRES_IN=604800
TELEGRAM_BOT_TOKEN=8118350067:AAGYxV6LfNYV74tqyHOnVlNyQJ8u7gtLXfY
```

### WEB (Next.js) — прописать в Timeweb App Platform

```bash
NEXT_PUBLIC_API_URL=https://yaroslove88-arch-leaders-12c6.twc1.net
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=arhitecture_leaders_bot
```

---

## Настройка Telegram Mini App

### 1. Настроить бота через @BotFather

```
/mybots
→ @arhitecture_leaders_bot
→ Bot Settings
→ Menu Button → Configure menu button
→ URL: https://yaroslove88-arch-leaders-3cd4.twc1.net
→ Текст: Открыть
```

### 2. Результат

После настройки у бота появится кнопка "Открыть" которая запустит сайт как Mini App внутри Telegram с автоматической авторизацией.

---

## Создание админа

### Через SSH/Console в Timeweb App Platform

Подключись к контейнеру API и выполни:

```bash
# Применить миграции (если ещё не применены)
npx prisma migrate deploy

# Создать админа yaroslav с паролем LeaderArch2025!
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createAdmin() {
  const username = 'yaroslav';
  const password = 'LeaderArch2025!';
  
  const existing = await prisma.user.findUnique({ where: { telegramUsername: username } });
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { role: 'admin' } });
    console.log('✅ Upgraded to admin:', username);
  } else {
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { telegramUsername: username, password: hash, role: 'admin', status: 'active' } });
    console.log('✅ Created admin:', username);
  }
}
createAdmin().finally(() => prisma.\$disconnect());
"
```

### Через ENV переменные (автоматически при деплое)

Добавь в ENV приложения API:
```
ADMIN_USERNAME=yaroslav
ADMIN_PASSWORD=LeaderArch2025!
```

Entrypoint автоматически создаст админа при старте.

---

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

