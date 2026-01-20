# Руководство по удалению NestJS бэкенда

## Предпосылки

После полной миграции на PayloadCMS, NestJS бэкенд (`apps/api`) становится избыточным. Это руководство описывает безопасный процесс удаления.

## Предварительные условия

Перед удалением NestJS убедитесь, что:

1. **PayloadCMS полностью настроен**
   - [ ] Все Collections созданы и работают
   - [ ] Админка доступна на `/admin`
   - [ ] REST API работает на `/api/*`

2. **Данные мигрированы**
   - [ ] Запущен `scripts/migrate-to-payload.ts`
   - [ ] Все пользователи перенесены
   - [ ] Все entries, sessions, quests, evidence перенесены
   - [ ] Дерево способностей перенесено

3. **Фронтенд переключен**
   - [ ] Компоненты используют `payload-api.ts` вместо `api.ts`
   - [ ] Все API вызовы работают через Payload

4. **Специфическая логика перенесена**
   - [ ] LLM пайплайн адаптирован (см. ниже)
   - [ ] Telegram интеграция работает
   - [ ] Core Loop логика работает

## Специфическая логика для переноса

### 1. LLM Pipeline (`apps/api/src/pipeline/`)

**Опции:**
- Перенести в Payload Hooks (afterChange, beforeChange)
- Создать отдельный сервис и вызывать через Server Actions
- Использовать Next.js API routes (`app/api/llm/route.ts`)

**Пример через Next.js API route:**
```typescript
// apps/web/src/app/api/llm/analyze/route.ts
import { getPayload } from 'payload'
import config from '@payload-config'
import { analyzeSituation } from '@/lib/llm-pipeline'

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const { entryId } = await request.json()
  
  const entry = await payload.findByID({
    collection: 'entries',
    id: entryId,
  })
  
  const analysis = await analyzeSituation(entry.text)
  
  await payload.update({
    collection: 'sessions',
    id: entry.session,
    data: {
      summary: analysis.summary,
      themes: analysis.themes,
      status: 'succeeded',
    },
  })
  
  return Response.json({ success: true })
}
```

### 2. Telegram Bot Integration

**Опции:**
- Отдельный микросервис (рекомендуется)
- Serverless функции (Vercel Functions, AWS Lambda)
- Next.js API routes для webhooks

**Пример webhook:**
```typescript
// apps/web/src/app/api/telegram/webhook/route.ts
export async function POST(request: Request) {
  const update = await request.json()
  // Обработка Telegram update
  return Response.json({ ok: true })
}
```

### 3. Core Loop Logic

Перенести в:
- Server Actions (`'use server'`)
- Payload Hooks
- Отдельные API routes

### 4. Jobs/Queue System

**Опции:**
- Vercel Cron Jobs
- Upstash QStash
- Отдельный worker сервис

## Процесс удаления

### Шаг 1: Создать резервную копию

```bash
# Backup apps/api
cp -r apps/api apps/api.backup

# Backup database
pg_dump leadership_architect > backup_before_migration.sql
```

### Шаг 2: Проверить, что Payload работает

```bash
cd apps/web
pnpm dev

# Проверить:
# - http://localhost:3000/admin
# - http://localhost:3000/api/users
# - http://localhost:3000/api/entries
```

### Шаг 3: Обновить переменные окружения

Удалить из `apps/web/.env`:
```env
# Удалить эти строки (NestJS больше не нужен)
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Шаг 4: Удалить зависимости от api

Обновить `package.json` в корне:
```json
{
  "scripts": {
    // Удалить
    // "dev:api": "turbo run dev --filter=@leadership-architect/api",
    
    // Обновить dev на только web
    "dev": "turbo run dev --filter=@leadership-architect/web"
  }
}
```

### Шаг 5: Удалить apps/api

```bash
rm -rf apps/api
```

### Шаг 6: Обновить Docker конфигурацию

Удалить `Dockerfile.api` и обновить `docker-compose.yml`:

```yaml
# Было:
services:
  api:
    build:
      dockerfile: Dockerfile.api
    ...
  web:
    ...

# Стало:
services:
  web:
    build:
      dockerfile: Dockerfile.web
    environment:
      - DATABASE_URL=...
      - PAYLOAD_SECRET=...
```

### Шаг 7: Очистить pnpm workspace

Обновить `pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/web"
  - "packages/*"
  # Удалить: - "apps/api"
```

### Шаг 8: Переустановить зависимости

```bash
pnpm install
```

## Проверка после удаления

1. **Запуск приложения**
   ```bash
   pnpm dev
   ```

2. **Проверка функциональности**
   - [ ] Регистрация/логин работает
   - [ ] Создание записей работает
   - [ ] Квесты отображаются и редактируются
   - [ ] Дерево способностей работает
   - [ ] Админка доступна

3. **Проверка API**
   ```bash
   curl http://localhost:3000/api/users
   curl http://localhost:3000/api/entries
   curl http://localhost:3000/api/quests
   ```

## Откат (если что-то пошло не так)

```bash
# Восстановить apps/api
cp -r apps/api.backup apps/api

# Восстановить базу данных
psql leadership_architect < backup_before_migration.sql

# Переустановить зависимости
pnpm install
```

## Архитектура после миграции

```
┌─────────────────────────────────────────────────────┐
│                   Next.js App                        │
├─────────────────────────────────────────────────────┤
│  Frontend (React)        │  PayloadCMS              │
│  ├── Pages               │  ├── Admin Panel         │
│  ├── Components          │  ├── REST API            │
│  └── Hooks               │  ├── GraphQL             │
│                          │  └── Local API           │
├─────────────────────────────────────────────────────┤
│  Server Actions          │  Payload Hooks           │
│  ├── Core Loop           │  ├── afterChange         │
│  ├── LLM Pipeline        │  ├── beforeChange        │
│  └── Business Logic      │  └── access              │
├─────────────────────────────────────────────────────┤
│                PostgreSQL (Drizzle ORM)              │
└─────────────────────────────────────────────────────┘
         │
         │ Webhooks
         ▼
┌─────────────────────────────────────────────────────┐
│              External Services                       │
│  ├── Telegram Bot (отдельный микросервис)           │
│  ├── LLM API (OpenAI/Anthropic)                     │
│  └── Cron Jobs (Vercel/Upstash)                     │
└─────────────────────────────────────────────────────┘
```

## Преимущества после миграции

1. **Упрощение инфраструктуры**
   - Один проект вместо двух
   - Меньше Docker контейнеров
   - Проще деплой

2. **Единый источник истины**
   - Схема данных в одном месте (Payload Collections)
   - Type-safe API автоматически
   - Версионирование схемы в git

3. **Готовая админка**
   - Не нужно писать CRUD
   - Кастомизируемый UI
   - Встроенная аутентификация

4. **Производительность**
   - Local API без сетевых запросов
   - Server Components с данными
   - Меньше latency
