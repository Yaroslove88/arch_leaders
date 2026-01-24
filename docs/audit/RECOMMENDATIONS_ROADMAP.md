# Рекомендации и Roadmap — Leadership Architect

**Дата:** 2026-01-24  
**Автор:** Product & UX Audit  
**Статус:** Action Plan

---

## 1. Стратегические рекомендации

### 1.1 Архитектура продукта

1. **Telegram Mini App — основной канал**
   - Приоритизировать UX для Telegram Mini App
   - Использовать нативные API (BackButton, MainButton, HapticFeedback)
   - Web-версия как fallback с graceful degradation

2. **Серверная синхронизация состояния**
   - Перенести `hasSeenIntroduce` из localStorage в БД
   - Добавить `onboarding_completed` в модель User
   - Обеспечить консистентность между устройствами

3. **Админ-панель — отдельный модуль**
   - Решить: Payload CMS или кастомная админка
   - Если кастомная — рефакторинг legacy-компонентов
   - Централизовать RBAC в UI

### 1.2 Монетизация

1. **Подписки — критичный функционал**
   - API и UI для управления подписками должны быть в Phase 1
   - Подготовить инфраструктуру для платёжного шлюза
   - Реализовать grace period и уведомления

2. **Feature gating**
   - Связать подписку с доступом к контенту
   - API для проверки прав доступа
   - UI-индикация заблокированного контента

---

## 2. Детальный Roadmap

### Phase 1: Foundation (Неделя 1-2)

**Цель:** Критичные исправления и базовый функционал

#### Sprint 1.1: Quick Fixes (3 дня)

| # | Задача | Файлы | Критерий выполнения |
|---|--------|-------|---------------------|
| 1 | Заменить `router.back()` на явные ссылки | `cases/[id]/page.tsx` | Нет risk внешнего перехода |
| 2 | Добавить `<main>` на всех страницах | `layout.tsx`, все `page.tsx` | WCAG compliance |
| 3 | Logout в админке | `admin-legacy/page.tsx` | Кнопка выхода работает |
| 4 | Редирект после Mini App авторизации | `TelegramWebAppProvider.tsx` | Автоматический переход на dashboard |
| 5 | Обработка ошибок Mini App | `TelegramWebAppProvider.tsx` | Toast с ошибкой для пользователя |

#### Sprint 1.2: Telegram Integration (2 дня)

| # | Задача | Файлы | Критерий выполнения |
|---|--------|-------|---------------------|
| 6 | Интегрировать BackButton | `quests/[id]`, `entries/[id]`, `sessions/[id]`, `cases/[id]` | Нативная навигация в TMA |
| 7 | Интегрировать MainButton | `entries/new`, `quests/[id]` | Primary action через MainButton |
| 8 | HapticFeedback | Все интерактивные элементы | Тактильная обратная связь |

#### Sprint 1.3: Onboarding (2 дня)

| # | Задача | Файлы | Критерий выполнения |
|---|--------|-------|---------------------|
| 9 | Добавить `onboarding_completed` в User | `schema.prisma` | Миграция применена |
| 10 | API для обновления статуса онбординга | `user.controller.ts` | Endpoint работает |
| 11 | Использовать БД вместо localStorage | `introduce/page.tsx` | Состояние синхронизируется |
| 12 | Автоактивация первого квеста | `user-initialization.service.ts` | Квест активен после онбординга |

### Phase 2: Core Features (Неделя 3-4)

**Цель:** Основной функционал пользователя и админа

#### Sprint 2.1: User Profile (5 дней)

| # | Задача | Файлы | Критерий выполнения |
|---|--------|-------|---------------------|
| 13 | Создать `/profile` страницу | `profile/page.tsx` | Страница отображается |
| 14 | Форма смены пароля | `PasswordChangeForm.tsx` | Пароль меняется |
| 15 | Danger Zone (удаление аккаунта) | `DangerZone.tsx` | Аккаунт удаляется с подтверждением |
| 16 | Настройки уведомлений | `NotificationSettings.tsx` | Toggle работает |

#### Sprint 2.2: Entry Editing (3 дня)

| # | Задача | Файлы | Критерий выполнения |
|---|--------|-------|---------------------|
| 17 | API для редактирования записи | `entries.controller.ts` | `PATCH /entries/:id` работает |
| 18 | Страница `/entries/[id]/edit` | `entries/[id]/edit/page.tsx` | Форма редактирования |
| 19 | UI удаления записи | `entries/[id]/page.tsx` | Кнопка удаления с подтверждением |

#### Sprint 2.3: Admin Subscriptions (5 дней)

| # | Задача | Файлы | Критерий выполнения |
|---|--------|-------|---------------------|
| 20 | API: изменение подписки | `admin-users.controller.ts` | `PATCH /admin/v1/users/:id/subscription` |
| 21 | API: история подписок | `admin-users.controller.ts` | `GET /admin/v1/users/:id/subscription/history` |
| 22 | UI: секция подписок в AdminUsers | `AdminUsers.tsx` | Dropdown + причина |
| 23 | Audit logging подписок | `audit.service.ts` | Логируется в audit log |

#### Sprint 2.4: Admin Prompts (3 дня)

| # | Задача | Файлы | Критерий выполнения |
|---|--------|-------|---------------------|
| 24 | UI: создание версии промпта | `AdminAI.tsx` | Форма с текстовым полем |
| 25 | UI: активация версии | `AdminAI.tsx` | Кнопка + confirm |
| 26 | Monaco Editor для промптов | `PromptEditor.tsx` | Syntax highlighting |

### Phase 3: UX Polish (Неделя 5)

**Цель:** Консистентность и accessibility

#### Sprint 3.1: Components (3 дня)

| # | Задача | Файлы | Критерий выполнения |
|---|--------|-------|---------------------|
| 27 | Создать единый Modal компонент | `packages/ui/src/Modal.tsx` | Focus trap, ARIA |
| 28 | Мигрировать модальные окна | Все `*Modal.tsx` | Используют Modal |
| 29 | Рефакторинг кнопок → Button | Все компоненты | Нет инлайн-стилей кнопок |
| 30 | Рефакторинг форм → Input/Field | Все формы | Нет инлайн-стилей форм |

#### Sprint 3.2: Navigation (2 дня)

| # | Задача | Файлы | Критерий выполнения |
|---|--------|-------|---------------------|
| 31 | Bottom Tab Bar для мобильных | `BottomTabBar.tsx` | Показывается на `md:hidden` |
| 32 | Компонент Breadcrumbs | `Breadcrumbs.tsx` | На детальных страницах |
| 33 | Skip link | `layout.tsx` | Работает с keyboard |

### Phase 4: Advanced Features (Неделя 6+)

**Цель:** Продвинутый функционал

| # | Задача | Effort |
|---|--------|--------|
| 34 | API ключи: UI управления | 2d |
| 35 | Сброс данных пользователя | 2d |
| 36 | Sandbox для промптов | 3d |
| 37 | Diff между версиями промптов | 1d |
| 38 | Rate limits: UI управления | 1d |
| 39 | Экспорт данных пользователя | 1d |
| 40 | A/B тестирование онбординга | 3d |

---

## 3. Технические рекомендации

### 3.1 Структура новых файлов

```
apps/web/src/
├── app/
│   ├── profile/
│   │   ├── page.tsx           # Главная страница профиля
│   │   ├── settings/
│   │   │   └── page.tsx       # Настройки
│   │   └── data/
│   │       └── page.tsx       # Экспорт/удаление данных
│   └── entries/
│       └── [id]/
│           └── edit/
│               └── page.tsx   # Редактирование записи
├── components/
│   ├── profile/
│   │   ├── PasswordChangeForm.tsx
│   │   ├── NotificationSettings.tsx
│   │   └── DangerZone.tsx
│   ├── admin/
│   │   ├── PromptEditor.tsx
│   │   ├── SubscriptionEditor.tsx
│   │   └── ApiKeyManager.tsx
│   └── navigation/
│       ├── BottomTabBar.tsx
│       ├── Breadcrumbs.tsx
│       └── SkipLink.tsx
└── hooks/
    └── useTelegramNavigation.ts

packages/ui/src/
├── Modal.tsx
├── Select.tsx
└── primitives.tsx (обновить Button)

apps/api/src/
├── admin/
│   └── users/
│       └── dto/
│           └── update-subscription.dto.ts
└── user/
    └── dto/
        └── update-settings.dto.ts
```

### 3.2 Миграции БД

```sql
-- Migration: add_onboarding_fields
ALTER TABLE "User" ADD COLUMN "onboarding_completed" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN "onboarding_completed_at" TIMESTAMP;

-- Migration: add_subscription_history
CREATE TABLE "SubscriptionHistory" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "User"("id"),
  "old_plan" VARCHAR(20),
  "new_plan" VARCHAR(20) NOT NULL,
  "changed_by" UUID REFERENCES "AdminUser"("id"),
  "reason" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);
```

### 3.3 API Endpoints для добавления

```typescript
// User
PATCH /users/me/settings       // Обновление настроек
PATCH /users/me/onboarding     // Завершение онбординга

// Entries
PATCH /entries/:id             // Редактирование записи
DELETE /entries/:id            // Удаление записи

// Admin Users
PATCH /admin/v1/users/:id/subscription          // Изменение подписки
GET /admin/v1/users/:id/subscription/history    // История подписок
POST /admin/v1/users/:id/reset                  // Сброс данных

// Admin Settings
GET /admin/v1/settings                          // Системные настройки
PATCH /admin/v1/settings                        // Обновление настроек
GET /admin/v1/api-keys                          // Список ключей
POST /admin/v1/api-keys                         // Добавление ключа
DELETE /admin/v1/api-keys/:id                   // Удаление ключа
```

### 3.4 Design Tokens — синхронизация

```typescript
// packages/ui/src/tokens.ts — источник истины
export const colors = {
  'strategic-blue': '#1F3A5F', // Исправить с #5C85BB
  // ...
};

// apps/web/src/app/globals.css — генерируется из tokens.ts
// tailwind.config.js — ссылается на CSS variables
```

---

## 4. Метрики и KPI

### 4.1 Метрики качества

| Метрика | Текущее | Цель Phase 1 | Цель Phase 3 |
|---------|---------|--------------|--------------|
| Lighthouse Accessibility | ~60 | 80+ | 95+ |
| Lighthouse Performance | ~70 | 80+ | 90+ |
| Component reuse rate | 60% | 75% | 90% |
| Test coverage | ~30% | 50% | 70% |

### 4.2 Метрики продукта

| Метрика | Как измерять | Цель |
|---------|--------------|------|
| Onboarding completion | `onboarding_completed` / all users | 80%+ |
| First quest completion | users with completed quests / users | 50%+ |
| Session time in TMA | Analytics | +20% vs web |
| Admin task completion | Audit log | <5 clicks per task |

---

## 5. Чек-лист готовности к релизу

### Phase 1 Release Criteria

- [ ] Все Quick Fixes выполнены
- [ ] Telegram BackButton работает на всех детальных страницах
- [ ] Онбординг сохраняется в БД
- [ ] Logout в админке работает
- [ ] Нет critical accessibility issues

### Phase 2 Release Criteria

- [ ] Страница профиля полностью функциональна
- [ ] Редактирование записей работает
- [ ] Управление подписками в админке работает
- [ ] UI для промптов работает
- [ ] Audit logging для всех новых операций

### Phase 3 Release Criteria

- [ ] Единый Modal компонент используется везде
- [ ] Bottom Tab Bar работает на мобильных
- [ ] Breadcrumbs на всех детальных страницах
- [ ] WCAG AA compliance

---

## 6. Риски и митигация

| Риск | Вероятность | Impact | Митигация |
|------|-------------|--------|-----------|
| Миграция БД сломает production | Medium | High | Backup + staged rollout |
| Telegram API изменится | Low | High | Abstraction layer |
| Monaco Editor тяжёлый | Medium | Medium | Lazy loading + code splitting |
| RBAC сложнее в UI | High | Low | Feature flags для ролей |

---

## 7. Следующие шаги

1. **Немедленно (День 1):**
   - Создать branch `feature/phase-1-quick-fixes`
   - Начать с задач 1-5 из Sprint 1.1

2. **Эта неделя:**
   - Завершить Sprint 1.1 и 1.2
   - Начать Sprint 1.3

3. **Следующая неделя:**
   - Завершить Phase 1
   - Начать Phase 2 (профиль, записи)

4. **Через 2 недели:**
   - Code review Phase 1-2
   - Staging deployment
   - QA testing

---

## Контакты и ответственные

| Область | Ответственный |
|---------|---------------|
| Backend API | TBD |
| Frontend UI | TBD |
| UX/Design | TBD |
| QA | TBD |
| Product Owner | TBD |

---

**Документ подготовлен на основе комплексного аудита проекта Leadership Architect.**
