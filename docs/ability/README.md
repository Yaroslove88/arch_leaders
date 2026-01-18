# Документация системы способностей

> **Дата последнего обновления:** 15.01.2025  
> **Статус:** Актуальная

Этот каталог содержит документацию по системе способностей (Ability System) и связанным системам.

---

## Структура документации

### 📋 Основные документы

1. **[ABILITY_STATE_ARCHITECTURE_ANALYSIS.md](./ABILITY_STATE_ARCHITECTURE_ANALYSIS.md)**
   - **Часть системы:** Архитектурный анализ системы способностей
   - **Содержание:** Архитектура AbilityState, анализ структуры, рекомендации
   - **Статус:** ✅ Актуальна (архитектурный анализ)

2. **[EXPERIENCE_SYSTEM_MIGRATION.md](./EXPERIENCE_SYSTEM_MIGRATION.md)**
   - **Часть системы:** Миграция системы опыта
   - **Содержание:** Шаги миграции, новые поля БД, API endpoints, UI компоненты
   - **Статус:** ✅ Актуальна (руководство по миграции)

3. **[NODE_TRANSLATIONS_RULES.md](./NODE_TRANSLATIONS_RULES.md)**
   - **Часть системы:** Правила переводов узлов
   - **Содержание:** Правила перевода названий узлов способностей, маппинг ID на названия
   - **Статус:** ✅ Актуальна (правила переводов)

---

## Логика именования файлов

Все файлы документации по системе способностей именуются по следующей логике:

```
<ТЕМА>_<ТИП>.md
```

**Где:**
- `<ТЕМА>` — тема документа (ABILITY_STATE, EXPERIENCE_SYSTEM, NODE_TRANSLATIONS)
- `<ТИП>` — тип документа (ARCHITECTURE_ANALYSIS, MIGRATION, RULES)

---

## Связанные файлы

### Код

**Backend:**
- `apps/api/src/ability/` — модуль системы способностей
- `apps/api/src/ability/ability-engine.service.ts` — движок расчета способностей
- `apps/api/src/ability/ability-state.service.ts` — сервис управления состояниями
- `apps/api/src/achievements/` — модуль достижений

**Frontend:**
- `apps/web/src/components/NodeExperienceIndicators.tsx` — индикаторы опыта узлов
- `apps/web/src/lib/node-translations.ts` — переводы названий узлов

**Связанные системы:**
- Система квестов (`docs/quests/`) — квесты развивают способности
- Система опыта — начисление опыта на узлы

---

## Быстрый старт

1. **Для понимания архитектуры:**
   - Изучите [ABILITY_STATE_ARCHITECTURE_ANALYSIS.md](./ABILITY_STATE_ARCHITECTURE_ANALYSIS.md)

2. **Для миграции системы опыта:**
   - Используйте [EXPERIENCE_SYSTEM_MIGRATION.md](./EXPERIENCE_SYSTEM_MIGRATION.md)

3. **Для работы с переводами:**
   - См. [NODE_TRANSLATIONS_RULES.md](./NODE_TRANSLATIONS_RULES.md)

---

## Обновление документации

При внесении изменений в систему способностей обновляйте соответствующую документацию:

- **Изменения в архитектуре** → обновить `ABILITY_STATE_ARCHITECTURE_ANALYSIS.md`
- **Новые поля/миграции** → обновить `EXPERIENCE_SYSTEM_MIGRATION.md`
- **Изменения в переводах** → обновить `NODE_TRANSLATIONS_RULES.md`
