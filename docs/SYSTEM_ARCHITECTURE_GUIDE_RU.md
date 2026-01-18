# 🏗️ Leadership Architect - Полный гайд по архитектуре системы

**Дата:** 9 января 2026

---

## 📋 Содержание

1. [Обзор архитектуры](#1-обзор-архитектуры)
2. [Где что хранится](#2-где-что-хранится)
3. [API ключи и переменные окружения](#3-api-ключи-и-переменные-окружения)
4. [Пользовательские данные и действия](#4-пользовательские-данные-и-действия)
5. [Скрипты и их назначение](#5-скрипты-и-их-назначение)
6. [Что было отрефакторено](#6-что-было-отрефакторено)
7. [Готовность к публикации на GitHub](#7-готовность-к-публикации-на-github)
8. [Потенциальные ошибки и риски](#8-потенциальные-ошибки-и-риски)
9. [Чеклист перед продакшеном](#9-чеклист-перед-продакшеном)

---

## 1. Обзор архитектуры

### Структура монорепозитория

```
leadership-architect/
├── apps/
│   ├── api/          # NestJS Backend (порт 3001)
│   └── web/          # Next.js Frontend (порт 3000)
├── packages/
│   └── shared/       # Общие типы и схемы (Zod)
├── data/             # Статические данные (JSON)
├── scripts/          # Утилиты и миграции
└── docs/             # Документация
```

### Технологии

| Компонент | Технология |
|-----------|------------|
| Backend | NestJS + TypeScript |
| Frontend | Next.js 14 + React |
| База данных | PostgreSQL |
| ORM | Prisma |
| Аутентификация | JWT |
| LLM интеграция | OpenAI / Anthropic |
| Монорепо | Turborepo + pnpm |

---

## 2. Где что хранится

### 🗄️ PostgreSQL (основное хранилище)

**Все пользовательские данные хранятся ТОЛЬКО в PostgreSQL:**

| Таблица | Что хранит | Связь с пользователем |
|---------|------------|----------------------|
| `users` | Аккаунты пользователей | — |
| `entries` | Записи (ситуации, рефлексии) | `userId` |
| `sessions` | Результаты AI-анализа | `userId` |
| `quests` | Квесты для развития | `userId` |
| `evidence` | Доказательства применения навыков | `userId` |
| `user_ability_state` | Прогресс по узлам дерева | `user_id` |
| `case_progress` | Прогресс по интерактивным кейсам | `user_id` |
| `changelog` | История всех изменений (audit trail) | `userId` |
| `jobs` | Очередь фоновых задач | `user_id` |
| `user_achievements` | Достижения пользователя | `user_id` |
| `user_stats_daily` | Ежедневная статистика | `user_id` |

### 📁 JSON файлы (статические данные)

**Это НЕ пользовательские данные, а шаблоны/каталоги:**

| Файл | Назначение | Изменяется ли? |
|------|-----------|----------------|
| `data/quest-templates.json` | Шаблоны квестов (80+ квестов) | Редко, вручную |
| `data/node-descriptions.json` | Описания узлов дерева | Редко, вручную |
| `data/interactive-cases.json` | Интерактивные кейсы | Редко, вручную |
| `data/builds.json` | Карьерные "билды" | Редко, вручную |

### 🌐 Frontend localStorage

**После рефакторинга - МИНИМАЛЬНОЕ использование:**

| Ключ | Что хранит | Время жизни |
|------|-----------|-------------|
| `auth_token` | JWT токен | До logout |
| `theme` | Тема интерфейса | Постоянно |

**❌ Больше НЕ хранится в localStorage:**
- Прогресс кейсов → теперь в `case_progress` таблице
- Данные сессий → теперь только через API

---

## 3. API ключи и переменные окружения

### Обязательные переменные для продакшена

```bash
# База данных (ОБЯЗАТЕЛЬНО)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT (ОБЯЗАТЕЛЬНО)
JWT_SECRET=your-very-long-secret-key-at-least-32-chars
JWT_EXPIRES_IN=7d

# Frontend URL для CORS (ОБЯЗАТЕЛЬНО)
WEB_URL=https://your-domain.com

# Хотя бы один LLM ключ (для AI-анализа)
OPENAI_API_KEY=sk-...
# или
ANTHROPIC_API_KEY=sk-ant-...
```

### Опциональные переменные

```bash
# Мониторинг ошибок
SENTRY_DSN=https://...@sentry.io/...

# Порт API (по умолчанию 3001)
PORT=3001

# Окружение
NODE_ENV=production

# Отключить Swagger в production
ENABLE_SWAGGER=false
```

### Где хранить ключи

| Окружение | Где хранить |
|-----------|-------------|
| Локальная разработка | `apps/api/.env` |
| Production | Переменные окружения хостинга (Vercel, Railway, etc.) |
| CI/CD | GitHub Secrets |

### ⚠️ НИКОГДА не коммитьте:
- `.env` файлы с реальными ключами
- API ключи напрямую в код
- Пароли базы данных

---

## 4. Пользовательские данные и действия

### Как отследить действия пользователя (для админа)

```sql
-- Все записи пользователя
SELECT * FROM entries 
WHERE "userId" = 'user-uuid' 
ORDER BY created_at DESC;

-- История анализов
SELECT * FROM sessions 
WHERE "userId" = 'user-uuid' 
ORDER BY created_at DESC;

-- Активные квесты
SELECT * FROM quests 
WHERE "userId" = 'user-uuid' 
  AND status = 'active';

-- Прогресс по дереву способностей
SELECT n.title, n.branch, s.state, s.progress 
FROM user_ability_state s
JOIN ability_nodes n ON s.node_id = n.id
WHERE s.user_id = 'user-uuid'
ORDER BY s.progress DESC;

-- Решённые кейсы
SELECT * FROM case_progress 
WHERE user_id = 'user-uuid'
ORDER BY completed_at DESC;

-- Audit trail - все изменения
SELECT * FROM changelog 
WHERE "userId" = 'user-uuid'
ORDER BY created_at DESC;
```

### Как быстро обновить данные пользователя

```sql
-- Сбросить прогресс по всем узлам
UPDATE user_ability_state 
SET progress = 0, internal_progress = 0, state = 'locked'
WHERE user_id = 'user-uuid';

-- Удалить все квесты пользователя
DELETE FROM quests WHERE "userId" = 'user-uuid';

-- Пересоздать статистику
DELETE FROM user_stats_daily WHERE user_id = 'user-uuid';
DELETE FROM user_stats_rollup WHERE user_id = 'user-uuid';
```

### Через API (рекомендуемый способ)

```bash
# Получить профиль пользователя
GET /api/admin/users/:userId

# Пересчитать состояние пользователя
POST /api/admin/users/:userId/recompute

# Получить все entries пользователя
GET /api/admin/entries?userId=:userId

# Запустить job для пересчёта
POST /api/admin/jobs
{
  "job_type": "recompute_user",
  "user_id": "user-uuid"
}
```

---

## 5. Скрипты и их назначение

### ✅ Активные скрипты (используются)

| Скрипт | Назначение | Когда использовать |
|--------|-----------|-------------------|
| `create-admin-user.ts` | Создание админа | Первоначальная настройка |
| `create-user-progress.ts` | Инициализация прогресса | Новый пользователь |
| `check-tree-nodes.ts` | Проверка дерева | Диагностика |
| `check-user-profile.ts` | Проверка профиля | Диагностика |
| `sync-quests-from-templates.py` | Синхронизация квестов | После обновления шаблонов |
| `award-quest-xp.ts` | Начисление XP | Ручное начисление |
| `migrate-experience-system.ts` | Миграция опыта | Одноразово |

### 📦 Архивированные скрипты (`scripts/archive/`)

**23 скрипта перемещены в архив** - это одноразовые миграции или устаревшие версии.

### Как запустить скрипт

```bash
# Из корня проекта
cd apps/api
npx ts-node ../../scripts/check-user-profile.ts

# Или через pnpm
pnpm --filter api ts-node ../../scripts/check-user-profile.ts
```

---

## 6. Что было отрефакторено

### ✅ Исправлено (9 января 2026)

1. **CasesService** - теперь использует PostgreSQL вместо in-memory хранилища
   - Прогресс кейсов сохраняется в таблицу `case_progress`
   - Данные не теряются при перезапуске сервера

2. **Frontend localStorage** - удалён fallback
   - Прогресс кейсов загружается ТОЛЬКО через API
   - Нет рассинхронизации между localStorage и БД

3. **Аутентификация эндпоинтов**
   - Evidence: добавлен `JwtAuthGuard`
   - Tree: добавлен `JwtAuthGuard` для мутаций
   - Builds: добавлен `JwtAuthGuard` для `/current`
   - Cases: уже был защищён

4. **Типизация** - уменьшено использование `any`
   - Обновлены DTO файлы
   - Добавлены типы в сервисы

5. **Очистка данных**
   - 5 backup-файлов перемещено в `data/archive/`
   - 23 устаревших скрипта перемещено в `scripts/archive/`

### ⚠️ Не изменялось (работает корректно)

- Entries, Sessions, Quests сервисы
- Auth модуль
- Admin модуль
- Jobs/очередь задач

---

## 7. Готовность к публикации на GitHub

### ✅ Можно публиковать

- [x] Код приложения
- [x] Prisma схема
- [x] Конфигурации (turborepo, tsconfig, etc.)
- [x] Документация
- [x] Статические данные (quest-templates, cases)

### ❌ НЕЛЬЗЯ публиковать (проверьте .gitignore)

```gitignore
# Должно быть в .gitignore
.env
.env.local
.env.production
*.env

# Логи и временные файлы
*.log
node_modules/
.next/
dist/

# IDE
.idea/
.vscode/settings.json

# Чувствительные данные
secrets/
*.pem
*.key
```

### Проверка перед публикацией

```bash
# Поиск утечек секретов
git log -p | grep -i "api_key\|secret\|password\|token"

# Проверка .gitignore
git status --ignored

# Проверка что .env не закоммичен
git ls-files | grep -i env
```

---

## 8. Потенциальные ошибки и риски

### 🔴 Критические риски

| Риск | Описание | Как избежать |
|------|----------|--------------|
| Утечка API ключей | Ключи в коммитах | Проверить историю git |
| SQL injection | Прямые запросы | Использовать Prisma ORM |
| CORS bypass | Неправильная настройка | Проверить WEB_URL |
| JWT секрет | Слабый секрет | Минимум 32 символа |

### 🟡 Средние риски

| Риск | Описание | Как избежать |
|------|----------|--------------|
| N+1 queries | Медленные запросы | Использовать include в Prisma |
| Нет rate limiting | DDoS уязвимость | Throttler включён (100 req/min) |
| Большие payloads | Память | Ограничить размер body |

### 🟢 Низкие риски (информационные)

- Swagger открыт в development
- Логи содержат userId
- Нет Redis кэширования

---

## 9. Чеклист перед продакшеном

### Переменные окружения

- [ ] `DATABASE_URL` указывает на production БД
- [ ] `JWT_SECRET` уникальный, длинный (32+ символов)
- [ ] `WEB_URL` указывает на production домен
- [ ] `NODE_ENV=production`
- [ ] Установлен хотя бы один LLM ключ
- [ ] `ENABLE_SWAGGER=false` (если не нужен)

### База данных

- [ ] Выполнены все миграции: `npx prisma migrate deploy`
- [ ] Создан admin пользователь: `npx ts-node scripts/create-admin-user.ts`
- [ ] Проверены индексы в PostgreSQL
- [ ] Настроены бэкапы

### Безопасность

- [ ] CORS настроен только на production домен
- [ ] Rate limiting включён (100 req/min)
- [ ] JWT токены expire (7d)
- [ ] Пароли хэшируются (bcrypt)
- [ ] Нет `any` типов в критичных местах

### Git и CI/CD

- [ ] `.env` в `.gitignore`
- [ ] Secrets в GitHub Secrets
- [ ] Нет API ключей в коммитах
- [ ] README актуальный

### Мониторинг

- [ ] Sentry настроен (опционально)
- [ ] Health endpoint работает: `GET /health`
- [ ] Логи настроены

---

## 📊 Диаграмма потока данных

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API (NestJS)  │────▶│  PostgreSQL     │
│   (Next.js)     │◀────│   Port 3001     │◀────│  (Prisma ORM)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  localStorage   │     │  OpenAI/Claude  │
│  (только JWT)   │     │  (LLM анализ)   │
└─────────────────┘     └─────────────────┘
```

---

## 🚀 Быстрый старт для админа

### 1. Проверить состояние системы

```bash
# Health check
curl http://localhost:3001/health

# Проверить БД
cd apps/api && npx prisma studio
```

### 2. Посмотреть пользователей

```bash
# Через Prisma Studio
npx prisma studio

# Или через API
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/admin/users
```

### 3. Создать квесты для пользователя

```bash
npx ts-node scripts/create-base-quests-for-all-users.ts
```

### 4. Пересчитать прогресс

```bash
# Запустить job
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"job_type": "recompute_user", "user_id": "xxx"}' \
  http://localhost:3001/admin/jobs
```

---

## 📞 Контакты для вопросов

Если что-то непонятно - смотрите:
- `docs/audit/PRODUCTION_CHECKLIST.md` - чеклист продакшена
- `docs/audit/FULL_AUDIT_REPORT.md` - полный аудит
- `scripts/README.md` - описание скриптов
- `data/README.md` - описание данных
