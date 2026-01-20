# PayloadCMS Setup Guide

## Overview

PayloadCMS 3.72 интегрирован в Leadership Architect для управления контентом и автогенерации API.

## Что было сделано

1. **Установлены зависимости**
   - `payload`, `@payloadcms/next`, `@payloadcms/richtext-lexical`, `@payloadcms/db-postgres`
   - Обновлено до Next.js 15 и React 19 (требование PayloadCMS 3.72)

2. **Созданы Collections**
   - `Users` - пользователи с аутентификацией
   - `Entries` - записи пользователей
   - `Sessions` - сессии анализа
   - `Quests` - квесты развития
   - `Evidence` - доказательства
   - `AbilityBranches` - ветки способностей
   - `AbilityNodes` - узлы способностей
   - `ChangeLogs` - журнал изменений

3. **Настроен Admin Panel**
   - Payload Admin routes в `app/(payload)/`
   - Custom view для дерева способностей с React Flow
   - Навигация с ссылкой на дерево

4. **Создан API клиент**
   - `payload-api.ts` - обёртка для Server/Client компонентов
   - Local API для Server Components
   - REST API для Client Components

5. **Документация миграции**
   - `NESTJS_REMOVAL_GUIDE.md` - руководство по удалению NestJS
   - Скрипт миграции данных

## Требования

- Next.js 15+
- React 19+
- PostgreSQL
- Node.js 18+

## Переменные окружения

Добавьте в `apps/web/.env`:

```env
# PayloadCMS Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leadership_architect
PAYLOAD_SECRET=your-super-secret-key-change-in-production

# Server URL (for admin panel)
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Existing API URL (NestJS - будет заменён после миграции)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Структура файлов

```
apps/web/src/
├── payload.config.ts          # Главная конфигурация PayloadCMS
├── collections/               # Определения коллекций
│   ├── Users.ts              # Пользователи (с аутентификацией)
│   ├── Entries.ts            # Записи пользователей
│   ├── Sessions.ts           # Сессии анализа
│   ├── Quests.ts             # Квесты
│   ├── Evidence.ts           # Доказательства
│   ├── AbilityBranches.ts    # Ветки способностей
│   ├── AbilityNodes.ts       # Узлы способностей
│   └── ChangeLogs.ts         # Журнал изменений
└── app/(payload)/             # Payload Admin routes
    ├── layout.tsx            # Root layout с serverFunction
    ├── custom.scss           # Кастомные стили админки
    ├── admin/
    │   ├── [[...segments]]/
    │   │   └── page.tsx      # Admin panel pages
    │   └── importMap.ts      # Import map для компонентов
    └── api/
        ├── [...slug]/
        │   └── route.ts      # REST API routes
        ├── graphql/
        │   └── route.ts      # GraphQL endpoint
        └── graphql-playground/
            └── route.ts      # GraphQL Playground
```

## Запуск

```bash
# Установить зависимости
cd apps/web
pnpm install

# Запустить dev сервер
pnpm dev
```

Админка доступна на: http://localhost:3000/admin

## Collections

### Users (с аутентификацией)
- telegramUsername (уникальный)
- email
- role (user/admin)
- status (active/blocked/deleted)
- subscriptionPlan (free/basic/premium)

### Entries
- Записи пользователей (ситуации, рефлексии, обратная связь)
- Поддержка rich text через Lexical editor

### Sessions
- Результаты анализа записей
- Инсайты, темы, паттерны

### Quests
- Квесты развития
- Типы: micro, weekly, story, in-person
- Связь с узлами способностей

### Evidence
- Доказательства применения способностей
- Связь с квестами и узлами

### AbilityBranches
- 6 веток дерева способностей
- Субъектность, Архитектурное мышление, Устойчивость, Ответственность, Обратная связь, Среда зрелости

### AbilityNodes
- Узлы способностей в ветках
- Уровни: basic, mid, advanced, master
- Пререквизиты и условия разблокировки

### ChangeLogs
- Аудит всех изменений
- Поддержка undo

## API Endpoints

### REST API
- `GET /api/users` - Список пользователей
- `POST /api/users` - Создать пользователя
- `GET /api/entries` - Список записей
- и т.д.

### GraphQL
- Endpoint: `/api/graphql`
- Playground: `/api/graphql-playground`

### Local API
```typescript
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

// Создать запись
const entry = await payload.create({
  collection: 'entries',
  data: {
    type: 'situation',
    source: 'web',
    text: 'Описание ситуации...',
    user: userId,
  },
})
```

## Access Control

- Пользователи видят только свои данные
- Администраторы видят все данные
- Публичный доступ на чтение для веток и узлов способностей

## Миграция данных

После настройки Payload нужно мигрировать данные из существующей Prisma схемы:

1. Запустить Payload для создания таблиц
2. Написать скрипт миграции данных
3. Переключить фронтенд на Payload API
4. Удалить NestJS бэкенд

## Известные ограничения

- PayloadCMS использует Drizzle ORM, не Prisma
- Формат таблиц может отличаться от текущей схемы
- Нужна ручная миграция данных
