# Tech Spec: [Name]

**Date**: [YYYY-MM-DD]
**Author**: [name]
**Level**: [0 | 1]
**Scope**: [web | api | both]
**GAP**: [ID if applicable, or N/A]

---

## Problem

[Опиши проблему, которую решает эта задача]

### Current Behavior
[Как работает сейчас]

### Expected Behavior
[Как должно работать]

---

## Solution

[High-level описание решения]

### Approach
[Выбранный подход и почему]

### Alternatives Considered
[Другие варианты, которые рассматривались — опционально]

---

## Stories

### STORY-1: [Title]

**Type**: [feature | fix | refactor | test]
**Effort**: [1h | 2h | 4h]
**Priority**: [HIGH | MEDIUM | LOW]

**Description**:
[Что нужно сделать]

**Files to Modify**:
- `path/to/file.ts` — [что менять]

**Acceptance Criteria**:
- [ ] [criterion 1]
- [ ] [criterion 2]

**Tests Required**:
- [ ] [test case 1]

**Dependencies**:
- [blocking items, or "none"]

---

### STORY-2: [Title]

**Type**: [feature | fix | refactor | test]
**Effort**: [1h | 2h | 4h]
**Priority**: [HIGH | MEDIUM | LOW]

**Description**:
[Что нужно сделать]

**Files to Modify**:
- `path/to/file.ts` — [что менять]

**Acceptance Criteria**:
- [ ] [criterion 1]

**Tests Required**:
- [ ] [test case 1]

**Dependencies**:
- STORY-1

---

## Implementation Order

1. STORY-1 — [reason: no dependencies]
2. STORY-2 — [reason: depends on STORY-1]

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| [risk 1] | [HIGH/MED/LOW] | [mitigation strategy] |

---

## Out of Scope

- [что НЕ входит в эту задачу]
- [отложенные улучшения]

---

## Next Steps

```
/dev-story STORY-1
```

After completion:
- [ ] Update GAP_ANALYSIS_REPORT.md (if GAP)
- [ ] Deploy [WEB | API | BOTH]
