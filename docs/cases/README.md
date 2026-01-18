# Документация системы кейсов

> **Дата последнего обновления:** 13.01.2026  
> **Статус:** Актуальная

Этот каталог содержит полную документацию по системе учебных кейсов (Interactive Cases) в приложении Leadership Architect.

---

## ⚠️ Актуальное: CaseDetailCardV2 (13.01.2026)

Реализован **новый компонент карточки кейса** по wireframe из "ТУТ НОВЫЙ дизайн кейсов 1.md":

### Новые файлы

| Файл | Описание |
|------|----------|
| `apps/web/src/components/cards/CaseDetailCardV2.tsx` | Компонент карточки V2 |
| `apps/web/src/components/cards/CaseCardTypes.ts` | Типы для V2 формата |
| `apps/web/src/lib/case-adapter.ts` | Адаптер API → V2 |

### Новый формат данных (V2)

```typescript
interface CaseCardData {
  meta: { case_id, node_id, branch_id, access_level, symbols, strategic_tags, ... };
  portal: { header_title, case_name, subtitle };
  event: { label, summary };
  context: { space_map: { company, environment, constraints, people, mode } };
  facts?: { strict_facts };
  background?: { story };
  dilemma: { question, ambiance? };
  positions: Array<{ id, description, position_type, consequence, reflection_prompt }>;
  reflection?: { questions, after_choice_insights };
}
```

### Адаптер (case-adapter.ts)

Автоматически преобразует данные:
- **Новый формат** (portal, event, space_map) → используется напрямую
- **Старый формат** (context string) → парсится в V2 структуру

---

## Структура документации

### 📋 Основные документы

1. **[CASES_SYSTEM_SPECIFICATION.md](./CASES_SYSTEM_SPECIFICATION.md)**
   - **Часть системы:** Полная системная спецификация
   - **Содержание:** Структура данных, логика доступности, логика ранжирования, система прогресса, API endpoints, архитектура файлов
   - **Статус:** ✅ Актуальна (полная спецификация всей системы)

2. **[CASES_UX_UI_SPECIFICATION.md](./CASES_UX_UI_SPECIFICATION.md)**
   - **Часть системы:** UX/UI спецификация
   - **Содержание:** Визуальное оформление карточек кейсов, стили, цвета, шрифты, компоненты интерфейса
   - **Статус:** ✅ Актуальна (спецификация дизайна и UX)

3. **[CASES_GENERATION_LOGIC.md](./CASES_GENERATION_LOGIC.md)**
   - **Часть системы:** Генеративная логика и промпты
   - **Содержание:** Матрица применимости кейсов, системный промпт для генерации, правила создания кейсов
   - **Статус:** ✅ Актуальна (логика генерации контента)

4. **[CASES_RANKING_REPORT.md](./CASES_RANKING_REPORT.md)**
   - **Часть системы:** Отчет о ранжировании кейсов
   - **Содержание:** Автоматически генерируемый отчет о позициях кейсов в ранжированном списке
   - **Статус:** ⚠️ Генерируется автоматически (временный файл, пересоздается при каждом запуске скрипта)

---

## Логика именования файлов

Все файлы документации по кейсам именуются по следующей логике:

```
CASES_<ЧАСТЬ_СИСТЕМЫ>_<ТИП_ДОКУМЕНТА>.md
```

**Где:**
- `CASES` — префикс для всех файлов документации по кейсам
- `<ЧАСТЬ_СИСТЕМЫ>` — описание части системы (SYSTEM, UX_UI, GENERATION, RANKING)
- `<ТИП_ДОКУМЕНТА>` — тип документа (SPECIFICATION, LOGIC, REPORT)

**Примеры:**
- `CASES_SYSTEM_SPECIFICATION.md` — полная системная спецификация
- `CASES_UX_UI_SPECIFICATION.md` — спецификация UX/UI
- `CASES_GENERATION_LOGIC.md` — логика генерации
- `CASES_RANKING_REPORT.md` — отчет о ранжировании

---

## Связанные файлы

### Данные

- `data/interactive-cases.json` — JSON файл со всеми кейсами (59 кейсов)
- `data/semantic-tree.json` — Дерево способностей (используется для определения доступности кейсов)

### Код

**Frontend — Компоненты V2 (актуальные):**
- `apps/web/src/components/cards/CaseDetailCardV2.tsx` — **новый** компонент детальной карточки
- `apps/web/src/components/cards/CaseCardTypes.ts` — типы для V2 формата
- `apps/web/src/components/cards/CaseCard.tsx` — карточка в списке
- `apps/web/src/lib/case-adapter.ts` — адаптер InteractiveCase → CaseCardData

**Frontend — Страницы:**
- `apps/web/src/app/experiments/page.tsx` — страница списка кейсов
- `apps/web/src/app/cases/[id]/page.tsx` — страница детального просмотра (использует CaseDetailCardV2)

**Frontend — Legacy (устаревшие):**
- `apps/web/src/components/cards/CaseDetailCard.tsx` — старый компонент (сохранён для обратной совместимости)
- `apps/web/src/components/CaseContextFormatter.tsx` — компонент форматирования контекста (legacy)
- `apps/web/src/components/CaseLockedModal.tsx` — модальное окно недоступности

**Frontend — Общее:**
- `apps/web/src/lib/api.ts` — API функции для работы с кейсами (InteractiveCase interface)

**Backend:**
- `apps/api/src/cases/cases.service.ts` — сервис работы с кейсами
- `apps/api/src/cases/cases.controller.ts` — REST API контроллер
- `apps/api/src/cases/cases.module.ts` — модуль NestJS

**Скрипты:**
- `scripts/generate_ranking_report.ts` — генерация отчета о ранжировании

### Архив (неактуальные файлы)

Неактуальные и дублирующие документы находятся в `docs/archive/cases/`:

- `cases-enriched.md` — старая версия расширенных кейсов (26 кейсов, данные уже в JSON)
- `cases-enriched2.md` — старая версия второй части расширенных кейсов (данные уже в JSON)
- `cases-report.md` — старый отчет по кейсам (26 кейсов, данные устарели)

---

## Быстрый старт

1. **Для понимания системы в целом:**
   - Начните с [CASES_SYSTEM_SPECIFICATION.md](./CASES_SYSTEM_SPECIFICATION.md)

2. **Для работы с UX/UI:**
   - Изучите [CASES_UX_UI_SPECIFICATION.md](./CASES_UX_UI_SPECIFICATION.md)

3. **Для создания новых кейсов:**
   - Используйте [CASES_GENERATION_LOGIC.md](./CASES_GENERATION_LOGIC.md)

4. **Для проверки ранжирования:**
   - См. [CASES_RANKING_REPORT.md](./CASES_RANKING_REPORT.md) (генерируется автоматически)

---

## Обновление документации

При внесении изменений в систему кейсов обновляйте соответствующую документацию:

- **Изменения в логике доступности/ранжирования** → обновить `CASES_SYSTEM_SPECIFICATION.md`
- **Изменения в UX/UI** → обновить `CASES_UX_UI_SPECIFICATION.md`
- **Изменения в логике генерации** → обновить `CASES_GENERATION_LOGIC.md`
- **Изменения в алгоритме ранжирования** → обновить скрипт генерации отчета

---

## Контакты и вопросы

Если у вас есть вопросы по документации или системе кейсов, обратитесь к:
- Системной спецификации: [CASES_SYSTEM_SPECIFICATION.md](./CASES_SYSTEM_SPECIFICATION.md)
- Архитектуре файлов: раздел "Архитектура файлов" в системной спецификации
