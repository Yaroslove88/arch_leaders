---
name: party-mode
description: Групповое обсуждение между агентами для сложных решений
---

# /party-mode — Групповое обсуждение агентов

Собирает несколько агентов для обсуждения сложных вопросов, архитектурных решений и trade-offs.

## Когда использовать

- Архитектурные решения с trade-offs
- Сложные GAPs (Level 3-4)
- Конфликтующие требования
- Нужны разные перспективы
- Design reviews

## Входные данные

```
/party-mode

Participants: [@analyst, @architect, @planner]
Topic: [тема обсуждения]
Context: [контекст и вводные]
Goal: [что нужно решить]
```

## Доступные участники

| Agent | Роль в обсуждении |
|-------|-------------------|
| `@analyst` | Бизнес-требования, user impact |
| `@architect` | Техническая архитектура, trade-offs |
| `@planner` | Декомпозиция, planning |
| `@scrum-master` | Delivery, sprint fit |
| `@security-reviewer` | Security concerns |
| `@tdd-guide` | Testing strategy |
| `@code-reviewer` | Code quality, patterns |

## Process

### 1. Setup

- Определи участников
- Сформулируй вопрос
- Предоставь контекст

### 2. Round Robin

Каждый агент высказывается по очереди:
1. Своя перспектива на проблему
2. Concerns и риски
3. Предложения

### 3. Discussion

- Обсуждение противоречий
- Поиск консенсуса
- Выявление trade-offs

### 4. Conclusion

- Summary решения
- Action items
- Next steps

## Output Format

```markdown
## Party Mode: [Topic]

**Participants**: @analyst, @architect, @planner
**Goal**: [цель обсуждения]

---

### Context

[предоставленный контекст]

---

### Round 1: Perspectives

#### @analyst
> [перспектива аналитика]
> 
> **Key concerns:**
> - [concern 1]
> 
> **Recommendation:**
> - [recommendation]

#### @architect
> [перспектива архитектора]
> 
> **Technical assessment:**
> - [assessment]
> 
> **Options:**
> - Option A: [description]
> - Option B: [description]

#### @planner
> [перспектива планировщика]
> 
> **Effort analysis:**
> - [analysis]
> 
> **Breakdown:**
> - [breakdown]

---

### Round 2: Discussion

**@analyst → @architect:**
> [вопрос или комментарий]

**@architect response:**
> [ответ]

**@planner observation:**
> [наблюдение]

---

### Trade-offs Identified

| Option | Pros | Cons | Risk |
|--------|------|------|------|
| A | [pros] | [cons] | [H/M/L] |
| B | [pros] | [cons] | [H/M/L] |

---

### Consensus

**Decision**: [выбранный вариант]

**Rationale**:
- [reason 1]
- [reason 2]

**Dissenting views**:
- [if any]

---

### Action Items

| Action | Owner | Priority |
|--------|-------|----------|
| [action 1] | @architect | HIGH |
| [action 2] | @planner | MEDIUM |

---

### Next Steps

1. [next step 1]
2. [next step 2]

**Handoff to**: [command or agent]
```

## Example Sessions

### Architecture Decision

```
/party-mode

Participants: [@analyst, @architect, @security-reviewer]
Topic: Система подписок — архитектура
Context: 
- Нужно ограничивать доступ к фичам по плану
- GAPs: SUB1, SUB2, SUB3
- Позже интеграция с платёжной системой
Goal: Выбрать архитектурный подход
```

### Feature Prioritization

```
/party-mode

Participants: [@analyst, @scrum-master, @planner]
Topic: Приоритизация HIGH GAPs для Sprint 1
Context:
- 15 HIGH priority GAPs
- Capacity: 40h
- Need to pick top 5-6
Goal: Определить backlog для Sprint 1
```

### Technical Trade-off

```
/party-mode

Participants: [@architect, @tdd-guide, @planner]
Topic: Real-time уведомления — WebSocket vs Polling
Context:
- Нужны уведомления о новых квестах
- Ограниченные ресурсы сервера
Goal: Выбрать подход к реализации
```

## Facilitation Rules

### For Productive Discussion

1. **One voice at a time** — каждый агент высказывается полностью
2. **Respect expertise** — агент говорит в своей области
3. **Focus on goal** — не отклоняться от темы
4. **Concrete proposals** — не абстрактные идеи, а конкретные решения
5. **Trade-offs explicit** — явно называть плюсы и минусы

### Conflict Resolution

Если агенты не согласны:
1. Явно зафиксировать разногласие
2. Определить root cause разногласия
3. Предложить компромисс или эксперимент
4. Если нет консенсуса — эскалировать пользователю

## Integration

### После Party Mode

| Результат | Следующий шаг |
|-----------|---------------|
| Architecture decision | ADR + `/plan` |
| Feature scope | `/plan` или `/quick-spec` |
| Sprint backlog | `/sprint-init` |
| Technical approach | `/dev-story` |

### Escalation

Если Party Mode не привёл к решению:
1. Зафиксировать open questions
2. Запросить input от пользователя
3. Предложить эксперимент/spike

## Anti-Patterns

### НЕ делай

- Не используй для простых вопросов
- Не собирай больше 4 агентов
- Не игнорируй dissenting opinions
- Не затягивай обсуждение

### Делай

- Чёткий goal перед началом
- Concrete context
- Time-box обсуждение
- Actionable outcome

## Quick Reference

### Минимальный формат

```
/party-mode

Participants: [@agent1, @agent2]
Topic: [вопрос]
Goal: [что решить]
```

### Типичные комбинации

| Сценарий | Участники |
|----------|-----------|
| Architecture | @analyst + @architect |
| Planning | @analyst + @planner + @scrum-master |
| Security | @architect + @security-reviewer |
| Quality | @architect + @tdd-guide + @code-reviewer |
| Full review | @analyst + @architect + @planner |
