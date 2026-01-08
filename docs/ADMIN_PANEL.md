# Админ-панель Leadership Architect

## Обзор

Админ-панель предоставляет полный контроль над системой для администраторов, операторов и аналитиков. Реализована согласно спецификации из файла `конкретная схема таблиц + API для админки.md`.

## Структура

### Модули

- **AdminAuthModule** - Аутентификация админов
- **AdminUsersModule** - Управление пользователями
- **AdminEntriesModule** - Управление записями (entries)
- **AdminSessionsModule** - Управление сессиями анализа
- **AdminQuestsModule** - Управление квестами
- **AdminAbilitiesModule** - Управление способностями (ability tree)
- **AdminConfigModule** - Управление конфигурациями
- **AdminPromptsModule** - Управление промптами
- **AdminJobsModule** - Управление задачами (jobs)
- **AdminAuditModule** - Аудит действий админов

### RBAC (Role-Based Access Control)

Реализованы 3 роли:

1. **super_admin** - Полный доступ ко всем функциям
2. **operator** - Ограниченный доступ (без просмотра приватного контента)
3. **analyst** - Только чтение агрегированной статистики

### Аудит

Все "опасные" операции логируются в `admin_audit_log` с обязательным указанием `reason`:
- Просмотр приватного контента (full view)
- Изменение статуса пользователя
- Пересчет анализа
- Переопределение квестов
- Активация конфигураций/промптов

## API Endpoints

Базовый префикс: `/admin/v1`

### Auth

- `POST /admin/v1/auth/login` - Вход админа
- `GET /admin/v1/auth/me` - Текущий админ

### Users

- `GET /admin/v1/users` - Список пользователей (с фильтрами)
- `GET /admin/v1/users/:user_id` - Детали пользователя
- `PATCH /admin/v1/users/:user_id` - Обновление пользователя (требует reason)

### Entries

- `GET /admin/v1/users/:user_id/entries` - Список записей пользователя
- `GET /admin/v1/entries/:entry_id?view=masked|full` - Детали записи
- `POST /admin/v1/entries/:entry_id/rerun-analysis` - Перезапуск анализа (требует reason)

### Sessions

- `GET /admin/v1/users/:user_id/sessions` - Список сессий
- `GET /admin/v1/sessions/:session_id` - Детали сессии
- `GET /admin/v1/sessions/:session_id/artifacts` - Артефакты сессии

### Quests

- `GET /admin/v1/users/:user_id/quests` - Список квестов
- `GET /admin/v1/quests/:quest_id` - Детали квеста
- `POST /admin/v1/quests/:quest_id/override` - Переопределение квеста (требует reason)
- `POST /admin/v1/users/:user_id/quests/regenerate` - Регенерация квестов (требует reason)

### Abilities

- `GET /admin/v1/users/:user_id/abilities` - Список способностей
- `GET /admin/v1/users/:user_id/abilities/:node_id` - Детали способности

### Config

- `GET /admin/v1/config-sets` - Список наборов конфигураций
- `GET /admin/v1/config-sets/:config_set_id` - Детали набора
- `GET /admin/v1/config-sets/:config_set_id/versions` - Версии конфигурации
- `POST /admin/v1/config-sets/:config_set_id/versions` - Создание версии
- `POST /admin/v1/config-sets/:config_set_id/activate` - Активация версии (требует reason)
- `GET /admin/v1/users/:user_id/config` - Конфигурация пользователя
- `POST /admin/v1/users/:user_id/config/pin` - Закрепление версии

### Prompts

- `GET /admin/v1/prompts` - Список промптов
- `GET /admin/v1/prompts/:prompt_id/versions` - Версии промпта
- `GET /admin/v1/prompts/:prompt_id/versions/:version` - Детали версии
- `POST /admin/v1/prompts/:prompt_id/versions` - Создание версии
- `POST /admin/v1/prompts/:prompt_id/activate` - Активация промпта (требует reason)
- `GET /admin/v1/prompts/llm-runs` - Трассировка вызовов LLM

### Jobs

- `GET /admin/v1/jobs` - Список задач
- `GET /admin/v1/jobs/:job_id` - Детали задачи
- `POST /admin/v1/jobs/:job_id/retry` - Повтор задачи
- `POST /admin/v1/jobs/:job_id/cancel` - Отмена задачи

### Audit

- `GET /admin/v1/audit-log` - Лог аудита

## База данных

### Новые таблицы

1. **admin_users** - Администраторы системы
2. **admin_audit_log** - Лог действий админов
3. **session_artifacts** - Версионирование выходов LLM
4. **ability_nodes** - Каталог узлов способностей
5. **user_ability_state** - Состояние узлов у пользователей
6. **evidence_links** - Связи evidence с другими сущностями
7. **config_sets** - Наборы конфигураций
8. **config_versions** - Версии конфигураций
9. **user_config_bindings** - Привязка пользователей к config sets
10. **prompt_registry** - Реестр промптов
11. **jobs** - Очередь задач
12. **llm_runs** - Трассировка вызовов LLM
13. **user_stats_daily** - Ежедневная статистика пользователей
14. **user_stats_rollup** - Агрегированная статистика

### Обновленные таблицы

- **users** - Добавлены поля: `email`, `status`, `last_seen_at`
- **entries** - Добавлены поля: `text_masked`, `is_sensitive`
- **sessions** - Добавлены поля: `analysis_version`, `error_code`, `error_message`, `completed_at`
- **quests** - Добавлены поля: `branch`, `activated_at`
- **evidence** - Добавлено поле: `source`
- **changelog** - Добавлены поля: `scope`, `entity_type`, `entity_id`, `action`, `before`, `after`, `is_undoable`, `undone_at`, `undone_by_admin`

## Установка

### 1. Создание миграции

```bash
cd apps/api
pnpm prisma migrate dev --name add_admin_panel
pnpm prisma generate
```

### 2. Создание первого админа

```bash
cd scripts
ts-node create-admin-user.ts admin@example.com admin123 super_admin
```

Или через pnpm:

```bash
cd apps/api
pnpm ts-node ../../scripts/create-admin-user.ts admin@example.com admin123 super_admin
```

## Использование

### Аутентификация

```bash
curl -X POST http://localhost:3001/admin/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Ответ:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "...",
    "email": "admin@example.com",
    "role": "super_admin"
  }
}
```

### Использование токена

```bash
curl -X GET http://localhost:3001/admin/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Безопасность

1. **Маскирование контента**: По умолчанию entries возвращаются в маскированном виде. Для просмотра полного контента требуется:
   - Роль `super_admin`
   - Параметр `view=full`
   - Обязательный параметр `reason`
   - Запись в audit log

2. **Обязательный reason**: Для всех "опасных" операций требуется указать `reason` в теле запроса.

3. **RBAC**: Доступ к endpoints контролируется через guards и декораторы.

## Следующие шаги

1. Реализовать Jobs Service для асинхронной обработки задач
2. Создать фронтенд для админ-панели
3. Реализовать материализованные агрегаты (user_stats_daily, user_stats_rollup)
4. Добавить экспорт данных
5. Реализовать "User 360" view с полной информацией о пользователе

