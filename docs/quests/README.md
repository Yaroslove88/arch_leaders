# Документация системы квестов

> **Дата последнего обновления:** 15.01.2025  
> **Статус:** Актуальная

Этот каталог содержит полную документацию по системе квестов (Quests) в приложении Leadership Architect.

---

## Структура документации

### 📋 Основные документы

1. **[QUEST_SYSTEM_COMPLETE.md](./QUEST_SYSTEM_COMPLETE.md)**
   - **Часть системы:** Полная системная спецификация
   - **Содержание:** Архитектура, типы квестов, статусы, структура данных, логика работы, генерация квестов, система наград, UI/UX компоненты, дизайн-система, API endpoints, интеграции
   - **Статус:** ✅ Актуальна (полная спецификация всей системы)

2. **[QUESTS_UX_UI_SPECIFICATION.md](./QUESTS_UX_UI_SPECIFICATION.md)**
   - **Часть системы:** UX/UI спецификация
   - **Содержание:** Визуальное оформление квестов, стили, цвета, шрифты, компоненты интерфейса, структура страниц
   - **Статус:** ✅ Актуальна (спецификация дизайна и UX)

3. **[QUEST_CONTENT_STRUCTURE.md](./QUEST_CONTENT_STRUCTURE.md)**
   - **Часть системы:** Методология структурирования контента
   - **Содержание:** Правила распределения информации по полям квеста, структура description, theory_and_examples, steps, criteria, правила избежания дублирования
   - **Статус:** ✅ Актуальна (методология структуры контента)

4. **[QUEST_THEORY_GENERATION_LOGIC.md](./QUEST_THEORY_GENERATION_LOGIC.md)**
   - **Часть системы:** Логика генерации теорий
   - **Содержание:** Процесс генерации теорий для квестов, интеграция с LLM, обработка ошибок, оптимизация
   - **Статус:** ✅ Актуальна (логика генерации контента)

5. **[QUEST_THEORY_GENERATION_PROMPT.md](./QUEST_THEORY_GENERATION_PROMPT.md)**
   - **Часть системы:** Промпты для генерации теорий
   - **Содержание:** Шаблоны промптов для AI-генерации теоретических блоков, примеры использования
   - **Статус:** ✅ Актуальна (промпты для генерации)

6. **[QUEST_THEORY_EXAMPLES.md](./QUEST_THEORY_EXAMPLES.md)**
   - **Часть системы:** Примеры теорий
   - **Содержание:** Готовые примеры правильно оформленных теорий для всех типов квестов (micro, weekly, story, in-person)
   - **Статус:** ✅ Актуальна (референс для создания теорий)

7. **[UPDATE_QUEST_THEORIES.md](./UPDATE_QUEST_THEORIES.md)**
   - **Часть системы:** Инструкции по обновлению
   - **Содержание:** Процесс обновления теоретических блоков в системе, API endpoints, скрипты
   - **Статус:** ✅ Актуальна (руководство по обновлению)

8. **[QUEST_NODE_IDS_FIX.md](./QUEST_NODE_IDS_FIX.md)**
   - **Часть системы:** Техническая документация
   - **Содержание:** Исправление несоответствий ID узлов в квестах, маппинг старых ID на новые, скрипты для проверки
   - **Статус:** ✅ Актуальна (техническая документация)

---

## Логика именования файлов

Все файлы документации по квестам именуются по следующей логике:

```
QUEST[S]_<ЧАСТЬ_СИСТЕМЫ>_<ТИП_ДОКУМЕНТА>.md
```

**Где:**
- `QUEST` или `QUESTS` — префикс для всех файлов документации по квестам
- `<ЧАСТЬ_СИСТЕМЫ>` — описание части системы (SYSTEM, UX_UI, CONTENT, THEORY, NODE_IDS)
- `<ТИП_ДОКУМЕНТА>` — тип документа (COMPLETE, SPECIFICATION, STRUCTURE, LOGIC, PROMPT, EXAMPLES, FIX)

**Примеры:**
- `QUEST_SYSTEM_COMPLETE.md` — полная системная спецификация
- `QUESTS_UX_UI_SPECIFICATION.md` — спецификация UX/UI
- `QUEST_CONTENT_STRUCTURE.md` — методология структуры контента
- `QUEST_THEORY_GENERATION_LOGIC.md` — логика генерации теорий
- `QUEST_THEORY_GENERATION_PROMPT.md` — промпты для генерации
- `QUEST_THEORY_EXAMPLES.md` — примеры теорий

---

## Связанные файлы

### Контентная база (в корне проекта)

- `QUESTS_STRUCTURED_CONTENT.md` — полное структурированное описание всех квестов (контентная база №1)
- `QUESTS_THEORIES_MAPPING.md` — полный маппинг всех квестов с их теоретическими блоками (контентная база №2)

**Примечание:** Эти файлы являются источниками истины для контента квестов и находятся в корне проекта, так как они содержат данные, а не документацию.

### Код

**Frontend:**
- `apps/web/src/app/quests/page.tsx` — страница списка квестов
- `apps/web/src/app/quests/[id]/page.tsx` — страница детального просмотра квеста
- `apps/web/src/components/QuestTheory.tsx` — компонент отображения теории
- `apps/web/src/hooks/useQuests.ts` — React Query хуки для квестов
- `apps/web/src/lib/api.ts` — API функции для работы с квестами

**Backend:**
- `apps/api/src/quests/quests.service.ts` — сервис управления квестами
- `apps/api/src/quests/quest-engine.service.ts` — детерминированная логика генерации
- `apps/api/src/quests/quest-generation.service.ts` — генерация квестов из сессий
- `apps/api/src/quests/quests.controller.ts` — REST API контроллер
- `apps/api/src/quests/quests.module.ts` — модуль NestJS
- `apps/api/src/orchestration/quest-orchestration.service.ts` — оркестрация жизненного цикла квестов

**Скрипты:**
- `scripts/migrate-experience-system.ts` — миграция системы опыта (включает квесты)
- `scripts/update-quest-theories.ts` — обновление теорий квестов

### Архив (неактуальные файлы)

Неактуальные и дублирующие документы находятся в `docs/archive/quests/`:

- `QUESTS_DOCUMENTATION_INDEX.md` — устаревший индекс (заменен на QUEST_SYSTEM_COMPLETE.md)
- `ENHANCE_QUESTS_THEORIES.md` — устаревшее руководство (информация в QUEST_THEORY_EXAMPLES.md)
- `QUESTS_UI_IMPROVEMENTS.md` — исторический документ (информация в QUESTS_UX_UI_SPECIFICATION.md)
- `QUESTS_MIGRATION_COMPLETE.md` — исторический отчет о миграции
- `QUESTS_STRUCTURE_FIX.md` — исторический документ об исправлениях структуры
- `QUESTS_RESTORATION.md` — исторический документ о восстановлении
- `QUESTS_TROUBLESHOOTING.md` — исторический документ по устранению проблем

---

## Быстрый старт

1. **Для понимания системы в целом:**
   - Начните с [QUEST_SYSTEM_COMPLETE.md](./QUEST_SYSTEM_COMPLETE.md)

2. **Для работы с UX/UI:**
   - Изучите [QUESTS_UX_UI_SPECIFICATION.md](./QUESTS_UX_UI_SPECIFICATION.md)

3. **Для работы с контентом квестов:**
   - Изучите [QUEST_CONTENT_STRUCTURE.md](./QUEST_CONTENT_STRUCTURE.md) — правила структуры
   - Используйте [QUEST_THEORY_EXAMPLES.md](./QUEST_THEORY_EXAMPLES.md) — примеры теорий
   - Контентная база: `QUESTS_STRUCTURED_CONTENT.md` и `QUESTS_THEORIES_MAPPING.md` (в корне проекта)

4. **Для генерации теорий:**
   - Используйте [QUEST_THEORY_GENERATION_PROMPT.md](./QUEST_THEORY_GENERATION_PROMPT.md) — промпты
   - Изучите [QUEST_THEORY_GENERATION_LOGIC.md](./QUEST_THEORY_GENERATION_LOGIC.md) — логика генерации

5. **Для обновления теорий:**
   - См. [UPDATE_QUEST_THEORIES.md](./UPDATE_QUEST_THEORIES.md)

---

## Обновление документации

При внесении изменений в систему квестов обновляйте соответствующую документацию:

- **Изменения в логике работы/генерации** → обновить `QUEST_SYSTEM_COMPLETE.md`
- **Изменения в UX/UI** → обновить `QUESTS_UX_UI_SPECIFICATION.md`
- **Изменения в структуре контента** → обновить `QUEST_CONTENT_STRUCTURE.md`
- **Изменения в логике генерации теорий** → обновить `QUEST_THEORY_GENERATION_LOGIC.md`
- **Изменения в промптах** → обновить `QUEST_THEORY_GENERATION_PROMPT.md`
- **Новые примеры теорий** → обновить `QUEST_THEORY_EXAMPLES.md`

---

## Контакты и вопросы

Если у вас есть вопросы по документации или системе квестов, обратитесь к:
- Системной спецификации: [QUEST_SYSTEM_COMPLETE.md](./QUEST_SYSTEM_COMPLETE.md)
- Архитектуре файлов: раздел "Архитектура" в системной спецификации
