---
name: quick-spec
description: Быстрая генерация tech-spec со stories для простых задач (Level 0-1)
---

# /quick-spec — Быстрая спецификация

Анализирует кодбейз и генерирует tech-spec со stories для простых задач.

## Когда использовать

- Bug fixes (Level 0)
- Small features (Level 1)
- Clear scope, понятные требования
- НЕ требует архитектурных решений

## Входные данные

```
/quick-spec

[Описание задачи]
```

Опционально:
- GAP ID из `docs/audit/GAP_ANALYSIS_REPORT.md`
- Конкретные файлы для анализа

## Процесс

### 1. Анализ задачи

- Определи scope (web, api, both)
- Найди связанные файлы
- Проверь существующие паттерны

### 2. Определение Level

| Level | Критерии | Следующий шаг |
|-------|----------|---------------|
| 0 | Bug fix, 1-2 файла | → сразу `/dev-story` |
| 1 | Small feature, понятный scope | → tech-spec → `/dev-story` |
| 2+ | Нужна архитектура | → **СТОП**, используй `/plan` |

### 3. Генерация Tech-Spec

Используй шаблон из `.cursor/templates/tech-spec.md`.

## Output Format

```markdown
# Tech Spec: [Name]

**Level**: [0 | 1]
**Scope**: [web | api | both]
**GAP**: [ID if applicable]

## Problem

[Что решаем]

## Solution

[Как решаем — high level]

## Stories

### STORY-1: [Title]

**Type**: [feature | fix | refactor]
**Effort**: [1h | 2h | 4h]

**Description**:
[Что нужно сделать]

**Files**:
- `path/to/file.ts` — [что менять]

**Acceptance Criteria**:
- [ ] [criterion 1]
- [ ] [criterion 2]

**Tests**:
- [ ] [test case 1]

---

### STORY-2: [Title]
...

## Implementation Order

1. STORY-1 (no deps)
2. STORY-2 (depends on STORY-1)

## Next Step

```
/dev-story STORY-1
```
```

## Пример использования

### Bug fix (Level 0)

```
/quick-spec

Фикс: router.back() в /cases/[id] вызывает риск выхода за пределы приложения
GAP: M4
```

Output:
```markdown
# Tech Spec: Fix router.back() in cases

**Level**: 0
**Scope**: web
**GAP**: M4

## Problem

`router.back()` может вывести пользователя за пределы приложения если /cases/[id] — точка входа.

## Solution

Заменить `router.back()` на `router.push('/cases')`.

## Stories

### STORY-1: Replace router.back() with safe navigation

**Type**: fix
**Effort**: 1h

**Files**:
- `apps/web/src/app/cases/[id]/page.tsx` — заменить router.back()

**Acceptance Criteria**:
- [ ] Кнопка "Назад" ведёт на /cases
- [ ] Не ломает существующую навигацию

## Next Step

/dev-story STORY-1
```

### Small feature (Level 1)

```
/quick-spec

Добавить поиск по квестам на странице /quests
GAP: Q2
```

## Интеграция с GAP Analysis

При указании GAP ID:
1. Найди гэп в `docs/audit/GAP_ANALYSIS_REPORT.md`
2. Проверь Impact и Effort
3. Если Effort > 1d → предложи `/plan` вместо quick-spec
4. Включи GAP ID в output

## Правила

1. **Не усложняй** — если задача простая, spec должен быть коротким
2. **Atomic stories** — каждая story = 1-4 часа работы
3. **Clear acceptance criteria** — что значит "готово"
4. **Files first** — укажи конкретные файлы для изменения
5. **Level check** — если Level ≥ 2, остановись и используй `/plan`

## После quick-spec

1. Ревью spec с пользователем
2. `/dev-story STORY-1` — реализация первой story
3. Повтори для остальных stories
4. `/code-review` перед коммитом
