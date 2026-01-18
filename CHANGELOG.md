# Changelog

Все значимые изменения проекта будут задокументированы в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/).

## [Unreleased]

## [2026-01-13]

### Added

- **CaseDetailCardV2 — новый компонент карточки кейса**
  - Реализован по wireframe из "ТУТ НОВЫЙ дизайн кейсов 1.md"
  - Два состояния: ДО выбора и ПОСЛЕ выбора
  - Поддержка нового формата данных (portal, event, space_map, dilemma, positions)
  - Файлы:
    - `apps/web/src/components/cards/CaseDetailCardV2.tsx` — компонент
    - `apps/web/src/components/cards/CaseCardTypes.ts` — типы V2
    - `apps/web/src/lib/case-adapter.ts` — адаптер API → V2

- **Адаптер для кейсов (case-adapter.ts)**
  - Преобразует `InteractiveCase` (API) → `CaseCardData` (V2 компонент)
  - Поддерживает новый формат (portal, event, space_map, positions)
  - Fallback-парсинг старого формата (context string)

### Changed

- **Страница /cases/[id] использует новый компонент CaseDetailCardV2**
  - Автоматическая адаптация данных через case-adapter
  - Обратная совместимость со старым форматом JSON

### UI/UX — новый дизайн кейсов

**Состояние ДО выбора:**
- Header: ← Назад, ⬤⬤○ сложность, КЕЙС, title, subtitle
- Event Block: border-l-4 warm-amber
- Space Map: таблица контекста (Компания, Среда, Ограничения, Участники, Режим)
- Background + Facts (опционально)
- Dilemma: ambiance + question (центрировано)
- Positions: карточки А, Б, В с hover catalyst-gold
- Footer: бейдж "Развивает", теги symbols/strategic_tags

**Состояние ПОСЛЕ выбора:**
- Выбранная позиция: catalyst-gold highlight
- Последствия: СЕЙЧАС (sage-green), ПОТОМ (catalyst-gold), СИСТЕМНО (inner-violet)
- Рефлексия: reflection_prompt (warm-amber border)
- Дополнительные вопросы (если есть)
- Другие позиции (сворачиваемый блок)
- Результат: +XP badge
- CTA: К следующему кейсу / Вернуться к списку

## [2026-01-09]

### Fixed

- **Retention Foreign Key Constraint Violation**
  - Исправлена ошибка `Foreign key constraint violated` при попытке записать активность пользователя
  - **Проблема**: Dashboard использовал фиктивный userId='default' из localStorage, которого не существовало в таблице users
  - **Решение**: Dashboard теперь получает реальный userId из системы авторизации через `useAuth()` hook
  - Файлы изменены:
    - `apps/web/src/app/dashboard/page.tsx`: замена `localStorage.getItem('userId')` на `useAuth().user?.id`

### Changed

- **Retention Service: миграция на PostgreSQL**
  - RetentionService перенесен с in-memory storage на персистентное хранилище PostgreSQL
  - Данные об активности пользователей теперь сохраняются между перезапусками сервера
  - Значение по умолчанию для новых пользователей изменено с 999 дней на 0 дней
  - Файлы изменены:
    - `apps/api/src/retention/retention.service.ts`: полная переработка для работы с Prisma
    - `apps/api/src/retention/retention.controller.ts`: добавлены await для асинхронных вызовов
    - `apps/api/prisma/schema.prisma`: добавлена модель `UserRetention`

### Added

- Таблица `user_retention` в PostgreSQL со следующими полями:
  - `user_id` (PK, FK на users.id)
  - `current_streak` (текущая серия дней активности)
  - `longest_streak` (самая длинная серия)
  - `last_activity_at` (дата последней активности)
  - `activity_dates[]` (массив дат активности в формате YYYY-MM-DD)
  - `created_at`, `updated_at` (метаданные)

