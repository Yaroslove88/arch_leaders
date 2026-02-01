---
name: sprint-status
description: Показать статус текущего спринта
---

# /sprint-status — Статус спринта

Показывает прогресс текущего спринта: done, in-progress, todo.

## Входные данные

```
/sprint-status
```

Или для конкретного спринта:
```
/sprint-status [N]
```

## Процесс

1. Найди активный спринт в `docs/sprints/`
2. Прочитай sprint file
3. Подсчитай метрики
4. Выведи статус

## Output Format

```markdown
## Sprint [N] Status

**Goal**: [goal]
**Progress**: [done]h / [total]h ([X]%)
**Days Left**: [N]

---

### Burndown

```
Day 1: ████████████████████ 40h
Day 2: ████████████████░░░░ 36h
Day 3: ████████████░░░░░░░░ 28h
Day 4: ████████░░░░░░░░░░░░ 20h  ← today
Day 5: ████░░░░░░░░░░░░░░░░ 12h  (projected)
```

---

### Stories

#### Done ✅
| ID | Title | Effort | Actual |
|----|-------|--------|--------|
| STORY-3 | Fix router.back() | 1h | 1h |

#### In Progress 🔄
| ID | Title | Effort | Started |
|----|-------|--------|---------|
| STORY-1 | Profile page layout | 4h | Day 2 |

#### Todo 📋
| ID | Title | Effort | Priority |
|----|-------|--------|----------|
| STORY-2 | Password change form | 8h | HIGH |
| STORY-4 | Notification settings | 4h | MEDIUM |

---

### GAPs Progress

| GAP | Stories | Done | Status |
|-----|---------|------|--------|
| P1 | 3 | 1 | 33% |
| M4 | 1 | 1 | 100% ✅ |

---

### Metrics

| Metric | Value |
|--------|-------|
| Velocity (planned) | 40h |
| Completed | 12h |
| In Progress | 4h |
| Remaining | 24h |
| On Track | [YES ✅ | AT RISK ⚠️ | BEHIND ❌] |

---

### Blockers

| Issue | Story | Impact |
|-------|-------|--------|
| [blocker] | STORY-2 | [impact] |

---

### Next Actions

1. `/dev-story STORY-1` — continue current
2. [specific recommendation based on status]
```

## Status Indicators

### On Track ✅
- Completed ≥ expected for day
- No blockers
- Stories moving

### At Risk ⚠️
- Completed < expected (< 20% behind)
- Minor blockers
- 1-2 stories stuck

### Behind ❌
- Completed << expected (> 20% behind)
- Major blockers
- Multiple stories stuck

## Recommendations

### Если On Track
```
Хороший прогресс! Продолжай с STORY-X.
```

### Если At Risk
```
⚠️ Отстаём от плана.

Рекомендации:
1. Фокус на HIGH priority stories
2. Отложить LOW priority на следующий спринт
3. Проверить blockers
```

### Если Behind
```
❌ Значительное отставание.

Рекомендации:
1. Срочно решить blockers
2. Scope reduction — вынести stories
3. Пересмотреть capacity
```

## Burndown Calculation

```
Day N expected = Total - (Total / Days * N)

Example (40h, 5 days):
Day 1: 40 - 8 = 32h remaining
Day 2: 40 - 16 = 24h remaining
Day 3: 40 - 24 = 16h remaining
Day 4: 40 - 32 = 8h remaining
Day 5: 40 - 40 = 0h remaining
```

## Velocity Tracking

После завершения спринта:
```
Planned: 40h
Actual:  36h
Velocity: 90%

Use for next sprint planning:
Next capacity = Previous capacity * Velocity
```

## Интеграция

### С файлом спринта
- Читает `docs/sprints/sprint-[N].md`
- Парсит stories по секциям

### С /dev-story
- Показывает какую story делать следующей
- Учитывает dependencies

### С GAP Analysis
- Трекает прогресс по GAPs
- Показывает закрытые гэпы

## Daily Standup Format

```
/sprint-status

Можно использовать для daily standup:
- Что сделано
- Что в работе
- Блокеры
```

## Примеры

### Спринт в процессе

```
/sprint-status

## Sprint 1 Status

**Goal**: Profile page MVP
**Progress**: 12h / 40h (30%)
**Days Left**: 3

...
```

### Завершённый спринт

```
/sprint-status 1

## Sprint 1 Status

**Goal**: Profile page MVP
**Progress**: 38h / 40h (95%)
**Status**: DONE ✅

### Velocity
Planned: 40h → Actual: 38h (95%)

### GAPs Closed
- P1 ✅
- M4 ✅
```
