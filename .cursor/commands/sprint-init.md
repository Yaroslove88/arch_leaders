---
name: sprint-init
description: Инициализация нового спринта с GAPs и stories
---

# /sprint-init — Инициализация спринта

Создаёт новый спринт с tracking file и подтягивает GAPs по приоритету.

## Входные данные

```
/sprint-init

Goal: [цель спринта]
Duration: [1w | 2w]
Capacity: [Xh] (опционально)
```

## Процесс

### Step 1: Определение номера спринта

1. Проверь `docs/sprints/` на существующие спринты
2. Определи следующий номер (sprint-N+1)

### Step 2: Выбор GAPs

1. Открой `docs/audit/GAP_ANALYSIS_REPORT.md`
2. Предложи GAPs по приоритету:
   - HIGH первыми
   - Учитывай dependencies
   - Fit в capacity

### Step 3: Создание Sprint File

1. Создай `docs/sprints/sprint-[N].md`
2. Используй шаблон из `.cursor/templates/sprint.md`

## Output Format

```markdown
## Sprint [N] Created

**Goal**: [goal]
**Dates**: [start] - [end]
**Capacity**: [X]h

### Selected GAPs

| GAP | Priority | Effort | Status |
|-----|----------|--------|--------|
| P1 | HIGH | 3d | TODO |
| M4 | HIGH | 1h | TODO |

### Stories

| Story | GAP | Effort | Assignee |
|-------|-----|--------|----------|
| STORY-1 | P1 | 4h | - |
| STORY-2 | P1 | 8h | - |
| STORY-3 | M4 | 1h | - |

### Total

- Stories: [N]
- Effort: [X]h
- Buffer: [X]h (20%)

### File Created

`docs/sprints/sprint-[N].md`

### Next Steps

1. Review sprint scope
2. `/dev-story STORY-1` — начать первую story
3. `/sprint-status` — проверить прогресс
```

## Sprint File Structure

```markdown
# Sprint [N]: [Goal]

**Dates**: YYYY-MM-DD — YYYY-MM-DD
**Status**: [PLANNING | ACTIVE | DONE]
**Velocity**: [planned]h / [actual]h

---

## Goal

[Что хотим достичь в этом спринте]

---

## Stories

### Backlog (TODO)

| ID | Title | GAP | Effort | Priority |
|----|-------|-----|--------|----------|
| STORY-1 | [title] | P1 | 4h | HIGH |

### In Progress

| ID | Title | Started | Assignee |
|----|-------|---------|----------|

### Done

| ID | Title | Completed | Actual |
|----|-------|-----------|--------|

---

## GAPs Addressed

| GAP | Status | Notes |
|-----|--------|-------|
| P1 | IN_PROGRESS | STORY-1, STORY-2 |
| M4 | TODO | STORY-3 |

---

## Daily Notes

### Day 1 (YYYY-MM-DD)
- [notes]

---

## Blockers

| Issue | Impact | Resolution |
|-------|--------|------------|

---

## Retrospective

### What went well
- 

### What could improve
- 

### Action items
- 
```

## Примеры

### Стандартный спринт

```
/sprint-init

Goal: Закрыть критичные UX гэпы
Duration: 1w
Capacity: 40h
```

### Спринт с конкретными GAPs

```
/sprint-init

Goal: Profile page MVP
Duration: 2w
GAPs: P1, P2, P3
```

## GAP Prioritization

### Автоматический порядок

1. **HIGH + блокирует другие** → первый приоритет
2. **HIGH + низкий effort** → quick wins
3. **HIGH + высокий effort** → разбить на stories
4. **MEDIUM** → если есть capacity
5. **LOW** → только если осталось время

### Capacity Planning

```
Total capacity:     40h
Stories:           -32h
Buffer (20%):       -8h
                   -----
Available:           0h
```

**Правило**: Всегда оставляй 20% buffer на:
- Bugs
- Meetings
- Unexpected work

## Интеграция

### С /plan
```
/plan [big feature]  → создаёт stories
/sprint-init         → добавляет stories в спринт
```

### С /sprint-status
```
/sprint-init         → создаёт спринт
/sprint-status       → показывает прогресс
```

### С /dev-story
```
/sprint-init         → определяет stories
/dev-story STORY-1   → реализует story
```

## Правила

1. **Один активный спринт** — завершай текущий перед новым
2. **Не перегружай** — capacity с buffer
3. **GAPs first** — приоритет HIGH гэпам
4. **Atomic stories** — 1-4h каждая
5. **Clear goal** — одна цель на спринт
