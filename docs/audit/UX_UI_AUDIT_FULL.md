# UX/UI Аудит — Leadership Architect

**Дата аудита:** 2026-01-24  
**Версия проекта:** 1.0.0  

---

## Содержание

1. [Мобильная навигация](#1-мобильная-навигация)
2. [Accessibility](#2-accessibility)
3. [Консистентность компонентов](#3-консистентность-компонентов)
4. [Сводка оценок](#4-сводка-оценок)
5. [Приоритизация исправлений](#5-приоритизация-исправлений)

---

## 1. Мобильная навигация

**Оценка: 6/10**

### 1.1 Текущая реализация

| Компонент | Статус | Описание |
|-----------|--------|----------|
| Hamburger menu | Done | `Navigation.tsx`, открывается по клику |
| Responsive breakpoints | Done | `sm:` (640px) для переключения |
| ARIA-атрибуты | Done | `aria-expanded`, `aria-controls`, `role="menu"` |
| Ссылки "Назад" | Partial | Разные стили на разных страницах |

### 1.2 Проблемы

| # | Проблема | Критичность |
|---|----------|-------------|
| M1 | Нет bottom tab bar для мобильных | HIGH |
| M2 | Telegram BackButton не используется | HIGH |
| M3 | Telegram MainButton не используется | MEDIUM |
| M4 | `router.back()` в `/cases/[id]` (риск внешнего перехода) | HIGH |
| M5 | Нет единого компонента Breadcrumbs | MEDIUM |
| M6 | Разные стили ссылок "Назад" на разных страницах | LOW |

### 1.3 Telegram API интеграция

**SDK подключен:**
- `<Script src="https://telegram.org/js/telegram-web-app.js" />`
- `TelegramWebAppProvider` создан
- Типы для BackButton/MainButton определены

**Не используется:**
- BackButton на детальных страницах
- MainButton для основных действий
- HapticFeedback для обратной связи

### 1.4 Рекомендации

```tsx
// Пример интеграции BackButton
const { webApp, isInTelegram } = useTelegramWebApp();

useEffect(() => {
  if (isInTelegram && webApp) {
    webApp.BackButton.show();
    webApp.BackButton.onClick(() => router.push('/experiments'));
    return () => webApp.BackButton.hide();
  }
}, [isInTelegram, webApp]);
```

---

## 2. Accessibility

**Оценка: 6/10**

### 2.1 Сильные стороны

| Область | Статус | Детали |
|---------|--------|--------|
| ARIA на навигации | Done | `aria-label`, `role="navigation"` |
| ARIA на модалах | Done | `aria-labelledby`, `aria-describedby`, `role="dialog"` |
| ARIA на меню | Done | `aria-expanded`, `aria-controls`, `role="menu"` |
| Focus-visible стили | Done | В `globals.css` |
| Toast уведомления | Done | `aria-live="polite"` |

### 2.2 Проблемы

| # | Проблема | Критичность |
|---|----------|-------------|
| A1 | Нет `<main>` на страницах | HIGH |
| A2 | Нет `<section>`, `<article>` | MEDIUM |
| A3 | Нет focus trap в модальных окнах | HIGH |
| A4 | Нет skip links | MEDIUM |
| A5 | Нет возврата фокуса после закрытия модала | MEDIUM |
| A6 | Проблемы контрастности secondary/tertiary текста | MEDIUM |

### 2.3 Контрастность цветов

| Цвет | Hex | На фоне `#0F1216` | Соответствие WCAG AA |
|------|-----|-------------------|---------------------|
| Основной текст | `#E6E8EB` | Высокий контраст | ✅ OK |
| Вторичный текст | `#A4A8AD` | Средний контраст | ⚠️ Проверить |
| Третичный текст | `#8A8E94` | Низкий контраст | ❌ Проблема |
| Акцент | `#1F3A5F` | Низкий контраст | ❌ Проблема |

### 2.4 Рекомендации

**Focus trap:**
```tsx
import { useFocusTrap } from '@mantine/hooks';
// или
import FocusTrap from 'focus-trap-react';
```

**Skip link:**
```tsx
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
>
  Перейти к основному контенту
</a>
```

---

## 3. Консистентность компонентов

**Оценка: 6/10**

### 3.1 Компоненты UI пакета

| Компонент | Статус | Использование |
|-----------|--------|---------------|
| Button | Done | 40% (остальные — инлайн) |
| Card | Done | 90%+ ✅ |
| Input | Done | 50% |
| Textarea | Done | 50% |
| Field | Done | 30% |
| Modal/Dialog | **Missing** | 0% |
| Select | **Missing** | - |
| Checkbox | **Missing** | - |

### 3.2 Проблемы по категориям

#### Кнопки (4/10)

| Проблема | Где |
|----------|-----|
| Инлайн-стили вместо Button | ConfirmDialog, ReflectionModal, AddSituationModal, UserProfileModal |
| Разные размеры | `px-4 py-2`, `px-4 py-3`, `py-3 px-6` |
| Нет пропа size | Компонент Button |
| Нет пропа loading | Компонент Button |

#### Карточки (9/10)

✅ Все карточки используют `Card` из UI пакета.

#### Модальные окна (3/10)

| Проблема | Детали |
|----------|--------|
| Нет единого компонента | 5+ разных реализаций |
| Разные стили backdrop | `bg-black/60` vs `bg-black/50` |
| Разные rounded | `rounded-lg` vs `rounded-xl` |
| Разные shadows | `shadow-floating` vs `shadow-active` |
| Разные кнопки закрытия | ✕ vs × vs разные размеры |

#### Формы (5/10)

| Проблема | Где |
|----------|-----|
| Нативные элементы вместо компонентов | ReflectionModal, AddSituationModal, UserProfileModal |
| Разные стили ошибок | `border-system-critical` vs `border-tension-red` |

### 3.3 Design Tokens

**Проблема несоответствия:**

| Токен | tokens.ts | globals.css | tailwind.config.js |
|-------|-----------|-------------|-------------------|
| strategic-blue | `#5C85BB` | `#1F3A5F` | `var(--color-strategic-blue, #1F3A5F)` |

**Рекомендация:** Синхронизировать все источники токенов.

---

## 4. Сводка оценок

| Область | Оценка | Комментарий |
|---------|--------|-------------|
| Мобильная навигация | 6/10 | Работает, но без Telegram API |
| Accessibility | 6/10 | ARIA есть, focus trap отсутствует |
| Компоненты | 6/10 | Хорошая база, низкое переиспользование |
| **Общая UX/UI** | **6/10** | Требуется рефакторинг |

---

## 5. Приоритизация исправлений

### HIGH Priority (Sprint 1)

| # | Задача | Effort | Impact |
|---|--------|--------|--------|
| 1 | Заменить `router.back()` на явные ссылки | 1h | HIGH |
| 2 | Интегрировать Telegram BackButton | 2-3h | HIGH |
| 3 | Добавить `<main>` на всех страницах | 1h | HIGH |
| 4 | Реализовать focus trap в модалах | 2-3h | HIGH |
| 5 | Создать единый компонент Modal | 4-6h | HIGH |

### MEDIUM Priority (Sprint 2)

| # | Задача | Effort | Impact |
|---|--------|--------|--------|
| 6 | Добавить bottom tab bar для мобильных | 4-6h | HIGH |
| 7 | Создать компонент Breadcrumbs | 2-3h | MEDIUM |
| 8 | Добавить skip links | 1h | MEDIUM |
| 9 | Рефакторинг кнопок → использовать Button | 3-4h | MEDIUM |
| 10 | Рефакторинг форм → использовать Input/Field | 3-4h | MEDIUM |

### LOW Priority (Sprint 3)

| # | Задача | Effort | Impact |
|---|--------|--------|--------|
| 11 | Синхронизировать design tokens | 2h | MEDIUM |
| 12 | Проверить и исправить контрастность | 2h | MEDIUM |
| 13 | Добавить size prop для Button | 1h | LOW |
| 14 | Добавить loading prop для Button | 1h | LOW |
| 15 | Добавить Select компонент | 2h | LOW |

---

## Приложение: Файлы для изменений

### Новые файлы

```
packages/ui/src/
├── Modal.tsx           # Единый компонент модала
├── Breadcrumbs.tsx     # Компонент хлебных крошек
├── BottomTabBar.tsx    # Мобильная навигация
├── SkipLink.tsx        # Skip link для accessibility
└── Select.tsx          # Компонент выбора
```

### Изменения существующих

```
apps/web/src/
├── app/
│   ├── layout.tsx              # Добавить SkipLink
│   ├── cases/[id]/page.tsx     # Заменить router.back()
│   ├── quests/[id]/page.tsx    # Интегрировать BackButton
│   ├── entries/[id]/page.tsx   # Интегрировать BackButton
│   └── sessions/[id]/page.tsx  # Интегрировать BackButton
├── components/
│   ├── Navigation.tsx          # Добавить bottom tab bar
│   ├── ConfirmDialog.tsx       # Использовать Modal
│   ├── ReflectionModal.tsx     # Использовать Modal
│   ├── AddSituationModal.tsx   # Использовать Modal
│   └── UserProfileModal.tsx    # Использовать Modal
└── app/globals.css             # Добавить <main> стили

packages/ui/src/
├── primitives.tsx              # Добавить size/loading для Button
└── tokens.ts                   # Синхронизировать цвета
```

---

## Чек-лист перед релизом

- [ ] Все модальные окна используют единый компонент Modal
- [ ] Focus trap работает во всех модалах
- [ ] Telegram BackButton интегрирован на детальных страницах
- [ ] Нет использования `router.back()` без fallback
- [ ] Все страницы имеют `<main>` тег
- [ ] Skip link добавлен в layout
- [ ] Контрастность проверена через WebAIM
- [ ] Design tokens синхронизированы
