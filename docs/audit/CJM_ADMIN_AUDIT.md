# Аудит CJM администратора — Leadership Architect

**Дата аудита:** 2026-01-24  
**Версия проекта:** 1.0.0  

---

## Содержание

1. [Обзор админ-панели](#1-обзор-админ-панели)
2. [RBAC и безопасность](#2-rbac-и-безопасность)
3. [Управление пользователями](#3-управление-пользователями)
4. [Управление подписками](#4-управление-подписками)
5. [Управление промптами](#5-управление-промптами)
6. [Управление конфигурациями](#6-управление-конфигурациями)
7. [API ключи и настройки](#7-api-ключи-и-настройки)
8. [Сброс данных пользователя](#8-сброс-данных-пользователя)
9. [Audit Log](#9-audit-log)
10. [Сводка гэпов](#10-сводка-гэпов)

---

## 1. Обзор админ-панели

### 1.1 Архитектура

```
Backend (NestJS):
├── AdminAuthModule       — аутентификация админов
├── AdminUsersModule      — управление пользователями
├── AdminEntriesModule    — управление записями
├── AdminSessionsModule   — управление сессиями
├── AdminQuestsModule     — управление квестами
├── AdminAbilitiesModule  — управление способностями
├── AdminConfigModule     — управление конфигурациями
├── AdminPromptsModule    — управление промптами
├── AdminJobsModule       — управление задачами
├── AdminAuditModule      — аудит-логи
├── AdminPipelineModule   — управление пайплайном
└── AdminAnalyticsModule  — аналитика

Frontend (Next.js):
├── /admin-legacy         — Legacy админка (используется)
└── /(payload)/admin      — Payload CMS (заглушка, не используется)
```

### 1.2 UI компоненты

| Компонент | Описание | Статус |
|-----------|----------|--------|
| AdminOverview | Обзор системы | Done |
| AdminUsers | Список пользователей | Done |
| AdminAnalytics | Аналитика | Done |
| AdminContent | Контент (entries/sessions/quests) | Done |
| AdminAI | Промпты, конфиги, LLM runs | Partial |
| AdminJobs | Задачи | Done |
| AdminAudit | Аудит-логи | Done |

---

## 2. RBAC и безопасность

### 2.1 Роли

| Роль | Права | Описание |
|------|-------|----------|
| `SUPER_ADMIN` | Полный доступ | Все операции |
| `OPERATOR` | Ограниченный | Просмотр + базовые операции |
| `ANALYST` | Только просмотр | Аналитика и отчёты |

### 2.2 Механизмы безопасности

| Механизм | Статус | Описание |
|----------|--------|----------|
| JWT токен | Done | Отдельный токен для админки |
| AdminAuthGuard | Done | Проверка токена |
| AdminRolesGuard | Done | Проверка ролей |
| RequiresReason | Done | Обязательная причина для критичных операций |
| Audit logging | Done | Логирование действий |

### 2.3 Гэпы безопасности

| # | Гэп | Критичность |
|---|-----|-------------|
| S1 | UI не показывает роль текущего админа | MEDIUM |
| S2 | Нет logout в UI | HIGH |
| S3 | Нет индикации ограничений по ролям в UI | MEDIUM |
| S4 | Нет middleware для защиты роута `/admin-legacy` | MEDIUM |

---

## 3. Управление пользователями

### 3.1 Текущая реализация

**Backend API:**

| Endpoint | Метод | Роль | Описание |
|----------|-------|------|----------|
| `/admin/v1/users` | GET | SUPER_ADMIN, OPERATOR | Список пользователей |
| `/admin/v1/users/:user_id` | GET | SUPER_ADMIN, OPERATOR | User 360 view |
| `/admin/v1/users/:user_id` | PATCH | SUPER_ADMIN | Обновление статуса |

**Frontend UI:**
- Список пользователей с поиском и фильтрами
- Просмотр User 360 со статистикой
- Изменение статуса (активировать/заблокировать)

### 3.2 Гэпы

| # | Гэп | API | UI | Критичность |
|---|-----|-----|-----|-------------|
| U1 | Редактирование email/username | Partial | Missing | MEDIUM |
| U2 | Редактирование роли пользователя | Missing | Missing | LOW |
| U3 | Удаление пользователя | Missing | Missing | MEDIUM |
| U4 | Массовые операции | Missing | Missing | LOW |
| U5 | Экспорт списка пользователей | Missing | Missing | LOW |

---

## 4. Управление подписками

### 4.1 Текущая реализация

**Схема БД (есть поля):**
```prisma
model User {
  subscription_plan       String    @default("free") // free, basic, premium
  subscription_expires_at DateTime?
  is_verified             Boolean   @default(false)
}
```

**API:** Нет endpoints  
**UI:** Нет

### 4.2 Гэпы

| # | Гэп | Критичность |
|---|-----|-------------|
| SUB1 | Нет API для изменения подписки | HIGH |
| SUB2 | Нет UI для управления подписками | HIGH |
| SUB3 | Нет истории изменений подписок | MEDIUM |
| SUB4 | Нет уведомлений об истечении подписки | LOW |

### 4.3 Рекомендуемые endpoints

```typescript
// Изменение подписки
PATCH /admin/v1/users/:user_id/subscription
Body: { plan: 'basic' | 'premium', expires_at?: Date, reason: string }

// История подписок
GET /admin/v1/users/:user_id/subscription/history
```

---

## 5. Управление промптами

### 5.1 Текущая реализация

**Backend API:**

| Endpoint | Метод | Описание | UI |
|----------|-------|----------|-----|
| `/admin/v1/prompts` | GET | Список промптов | Done |
| `/admin/v1/prompts/:id/versions` | GET | Версии промпта | Done |
| `/admin/v1/prompts/:id/versions/:v` | GET | Конкретная версия | Done |
| `/admin/v1/prompts/:id/versions` | POST | Создать версию | **Missing** |
| `/admin/v1/prompts/:id/activate` | POST | Активировать | **Missing** |
| `/admin/v1/prompts/llm-runs` | GET | История LLM | Done |

**UI:**
- Просмотр списка промптов
- Просмотр версий
- Просмотр шаблона и схемы

### 5.2 Гэпы

| # | Гэп | API | UI | Критичность |
|---|-----|-----|-----|-------------|
| P1 | Создание новой версии промпта | Done | **Missing** | HIGH |
| P2 | Активация версии промпта | Done | **Missing** | HIGH |
| P3 | Редактор промптов (Monaco) | - | **Missing** | MEDIUM |
| P4 | Тестирование промптов в sandbox | Missing | **Missing** | MEDIUM |
| P5 | Diff между версиями | Missing | **Missing** | LOW |

---

## 6. Управление конфигурациями

### 6.1 Текущая реализация

**Backend API:**

| Endpoint | Метод | Описание | UI |
|----------|-------|----------|-----|
| `/admin/v1/config-sets` | GET | Список конфигов | Done |
| `/admin/v1/config-sets/:id` | GET | Детали | Done |
| `/admin/v1/config-sets/:id/versions` | GET | Версии | Done |
| `/admin/v1/config-sets/:id/versions` | POST | Создать версию | **Missing** |
| `/admin/v1/config-sets/:id/activate` | POST | Активировать | **Missing** |
| `/admin/v1/.../users/:id/config` | GET | Конфиг пользователя | **Missing** |
| `/admin/v1/.../users/:id/config/pin` | POST | Закрепить версию | **Missing** |

### 6.2 Гэпы

| # | Гэп | API | UI | Критичность |
|---|-----|-----|-----|-------------|
| C1 | Создание версии конфига | Done | **Missing** | MEDIUM |
| C2 | Активация конфига | Done | **Missing** | MEDIUM |
| C3 | Закрепление версии для пользователя | Done | **Missing** | LOW |
| C4 | Редактор JSON конфигов | - | **Missing** | MEDIUM |

---

## 7. API ключи и настройки

### 7.1 Текущая реализация

**API:** Нет endpoints  
**UI:** Нет

### 7.2 Гэпы

| # | Гэп | Критичность |
|---|-----|-------------|
| K1 | Нет управления LLM API ключами | HIGH |
| K2 | Нет управления Telegram Bot Token | MEDIUM |
| K3 | Нет управления Rate Limits | LOW |
| K4 | Нет ротации ключей | LOW |

### 7.3 Рекомендуемые endpoints

```typescript
// API ключи
GET  /admin/v1/api-keys
POST /admin/v1/api-keys
DELETE /admin/v1/api-keys/:key_id
POST /admin/v1/api-keys/:key_id/rotate

// Rate limits
GET  /admin/v1/rate-limits
POST /admin/v1/rate-limits
PATCH /admin/v1/rate-limits/:limit_id
```

---

## 8. Сброс данных пользователя

### 8.1 Текущая реализация

**API:** Нет endpoints  
**UI:** Нет

### 8.2 Гэпы

| # | Гэп | Критичность |
|---|-----|-------------|
| R1 | Нет функции "сбросить прогресс" | MEDIUM |
| R2 | Нет функции "сбросить дерево" | MEDIUM |
| R3 | Нет hard delete пользователя | MEDIUM |

### 8.3 Рекомендуемые endpoints

```typescript
// Сброс данных
POST /admin/v1/users/:user_id/reset
Body: { scope: 'progress' | 'tree' | 'all', reason: string }

// Мягкое удаление
DELETE /admin/v1/users/:user_id
```

---

## 9. Audit Log

### 9.1 Текущая реализация

**Backend API:**

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/admin/v1/audit-log` | GET | Журнал аудита |

**Логируемые действия:**
- `UPDATE_USER_STATUS`
- `VIEW_FULL_ENTRY`
- `RERUN_ANALYSIS`
- `OVERRIDE_QUEST`
- `REGENERATE_QUESTS`
- `ACTIVATE_CONFIG`
- `ACTIVATE_PROMPT`

**UI:** Просмотр логов с фильтрами

### 9.2 Гэпы

| # | Гэп | Критичность |
|---|-----|-------------|
| A1 | Нет экспорта логов (CSV/JSON) | LOW |
| A2 | Нет алертов на критичные действия | LOW |
| A3 | Нет статистики по действиям | LOW |

---

## 10. Сводка гэпов

### HIGH Priority (критичные)

| ID | Гэп | Область |
|----|-----|---------|
| S2 | Нет logout в UI | Безопасность |
| SUB1 | Нет API для управления подписками | Подписки |
| SUB2 | Нет UI для управления подписками | Подписки |
| P1 | Нет UI для создания версии промпта | Промпты |
| P2 | Нет UI для активации промпта | Промпты |
| K1 | Нет управления LLM API ключами | Настройки |

### MEDIUM Priority (важные)

| ID | Гэп | Область |
|----|-----|---------|
| S1, S3, S4 | RBAC в UI | Безопасность |
| U1, U3 | Редактирование/удаление пользователей | Пользователи |
| SUB3 | История подписок | Подписки |
| P3, P4 | Редактор и sandbox промптов | Промпты |
| C1-C4 | UI для конфигураций | Конфигурации |
| K2 | Управление Telegram Bot | Настройки |
| R1-R3 | Сброс данных пользователя | Сброс |

### LOW Priority (желательные)

| ID | Гэп | Область |
|----|-----|---------|
| U2, U4, U5 | Роли, массовые операции, экспорт | Пользователи |
| SUB4 | Уведомления об истечении | Подписки |
| P5 | Diff версий | Промпты |
| K3, K4 | Rate limits, ротация | Настройки |
| A1-A3 | Улучшения audit log | Аудит |

---

## Приоритизация реализации

### Sprint 1 — Критические гэпы (1 неделя)

1. **Logout в админке**
   - Кнопка в сайдбаре
   - Очистка `admin_token`
   - Редирект на login

2. **Управление подписками**
   - API: `PATCH /admin/v1/users/:user_id/subscription`
   - UI: секция в `AdminUsers` или отдельная вкладка
   - Поля: план, дата истечения, причина

3. **UI для промптов**
   - Кнопка "Создать версию"
   - Кнопка "Активировать"
   - Модальные формы с валидацией

### Sprint 2 — Важные гэпы (1-2 недели)

4. **Редактор промптов**
   - Monaco Editor для шаблона
   - JSON Editor для схемы
   - Preview

5. **UI для конфигураций**
   - Создание/активация версий
   - JSON Editor

6. **Управление API ключами**
   - API endpoints
   - UI для просмотра/обновления

### Sprint 3 — Улучшения (2 недели)

7. **Сброс данных пользователя**
   - API endpoints
   - UI с подтверждением

8. **RBAC в UI**
   - Показ роли
   - Скрытие недоступных действий

9. **Улучшения audit log**
   - Экспорт
   - Статистика

---

## Файлы для изменений

### Новые файлы (Backend)

- `apps/api/src/admin/users/dto/update-subscription.dto.ts`
- `apps/api/src/admin/settings/admin-settings.module.ts`
- `apps/api/src/admin/settings/admin-settings.controller.ts`
- `apps/api/src/admin/settings/admin-settings.service.ts`

### Изменения (Backend)

- `apps/api/src/admin/users/admin-users.controller.ts` — добавить subscription endpoint
- `apps/api/src/admin/users/admin-users.service.ts` — добавить методы

### Новые файлы (Frontend)

- `apps/web/src/components/admin/PromptEditor.tsx`
- `apps/web/src/components/admin/ConfigEditor.tsx`
- `apps/web/src/components/admin/SubscriptionEditor.tsx`
- `apps/web/src/components/admin/ApiKeyManager.tsx`

### Изменения (Frontend)

- `apps/web/src/components/admin/AdminAI.tsx` — добавить кнопки создания/активации
- `apps/web/src/components/admin/AdminUsers.tsx` — добавить управление подписками
- `apps/web/src/app/admin-legacy/page.tsx` — добавить logout
