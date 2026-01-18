# Статус API

## ✅ Созданные модули

1. **Prisma Module** (`src/prisma/`)
   - ✅ PrismaService - подключение к БД
   - ✅ PrismaModule - глобальный модуль

2. **Config Module** (`src/config/`)
   - ✅ env.validation.ts - валидация переменных окружения
   - ✅ path-config.service.ts - управление путями
   - ✅ config.module.ts - глобальный модуль

3. **Entries Module** (`src/entries/`)
   - ✅ EntriesService - CRUD операции
   - ✅ EntriesController - REST API
   - ✅ EntriesModule

4. **Sessions Module** (`src/sessions/`)
   - ✅ SessionsService - CRUD операции
   - ✅ SessionsController - REST API
   - ✅ SessionsModule

5. **Evidence Module** (`src/evidence/`)
   - ✅ EvidenceService - CRUD операции
   - ✅ EvidenceController - REST API
   - ✅ EvidenceModule

6. **Retention Module** (`src/retention/`)
   - ✅ RetentionService - отслеживание активности пользователей
   - ✅ RetentionController - REST API
   - ✅ RetentionModule
   - ✅ PostgreSQL storage (миграция с in-memory)
   - ✅ UserRetention model в Prisma

## 📋 API Endpoints

Все endpoints готовы и зарегистрированы в AppModule.

### Entries
- `GET /entries` - список
- `GET /entries/:id` - по ID
- `POST /entries` - создать
- `PATCH /entries/:id` - обновить
- `DELETE /entries/:id` - удалить

### Sessions
- `GET /sessions` - список
- `GET /sessions/:id` - по ID
- `GET /sessions/entry/:entryId` - по entry_id
- `POST /sessions` - создать
- `PATCH /sessions/:id` - обновить
- `DELETE /sessions/:id` - удалить

### Evidence
- `GET /evidence` - список
- `GET /evidence/:id` - по ID
- `POST /evidence` - создать
- `PATCH /evidence/:id` - обновить
- `DELETE /evidence/:id` - удалить

### Retention
- `POST /retention/activity` - записать активность пользователя
- `GET /retention/:userId` - получить данные о retention
- `GET /retention/:userId/risk` - проверить риск потери серии

## 🚀 Запуск

```bash
cd apps/api
pnpm dev
```

API должен запуститься на http://localhost:3001

## ✅ Проверка

- ✅ Типы проверены (typecheck проходит)
- ✅ Все модули подключены
- ✅ Prisma настроен
- ✅ База данных готова

## 📝 Примечания

- API использует валидацию окружения
- DATABASE_URL должен быть в .env файле
- Все модули используют PrismaService через DI

## 🐛 Исправленные проблемы

### 2026-01-09: Retention Foreign Key Constraint
- **Проблема**: Foreign key constraint violation при создании retention записи для userId='default'
- **Причина**: Dashboard использовал фиктивный userId из localStorage вместо реального из auth системы
- **Решение**: 
  - Dashboard теперь использует `useAuth()` hook для получения реального userId
  - RetentionService перенесен с in-memory storage на PostgreSQL (таблица `user_retention`)
  - Добавлена миграция Prisma для создания таблицы
- **Изменения**:
  - `apps/web/src/app/dashboard/page.tsx`: замена `localStorage.getItem('userId')` на `useAuth().user?.id`
  - `apps/api/src/retention/retention.service.ts`: миграция на Prisma
  - `apps/api/prisma/schema.prisma`: добавлена модель `UserRetention`

