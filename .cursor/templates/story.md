# Story: [STORY-ID]

**Title**: [Short descriptive title]
**Spec**: [link to tech-spec or N/A]
**GAP**: [GAP ID if applicable]

---

## Overview

**Type**: [feature | fix | refactor | test]
**Effort**: [1h | 2h | 4h | 1d]
**Scope**: [web | api | both]
**Priority**: [HIGH | MEDIUM | LOW]

---

## Description

[Детальное описание что нужно сделать]

### Context
[Почему это нужно — бизнес-контекст]

### Technical Details
[Технические детали реализации]

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `path/to/file.ts` | [modify | create | delete] | [what to change] |

---

## Acceptance Criteria

- [ ] **AC1**: [criterion 1]
- [ ] **AC2**: [criterion 2]
- [ ] **AC3**: [criterion 3]

---

## Test Cases

### Unit Tests
- [ ] `describe('methodName')` — [what to test]

### Integration Tests
- [ ] [test scenario]

### Manual Testing
- [ ] [manual check 1]
- [ ] [manual check 2]

---

## Dependencies

### Blocking
- [ ] [STORY-X must be done first]

### Related
- [STORY-Y — parallel work possible]

---

## Implementation Notes

### Security Checklist (if API changes)
- [ ] `@UseGuards(JwtAuthGuard)` applied
- [ ] `@ApiBearerAuth()` for Swagger
- [ ] `userId` in Prisma queries
- [ ] Ownership check before update/delete

### Code Quality
- [ ] No `any` types
- [ ] DTOs for request/response
- [ ] Error handling (NotFoundException, etc.)

---

## Definition of Done

- [ ] Code implemented
- [ ] Tests pass
- [ ] Linter pass (`pnpm lint`)
- [ ] Typecheck pass (`pnpm typecheck`)
- [ ] Code review pass (`/code-review`)
- [ ] Acceptance criteria verified
- [ ] Committed and pushed

---

## Deployment

**Target**: [WEB | API | BOTH]
**Branch**: [web | main]

```bash
git add -A && git commit -m "[type](scope): [message]

Closes STORY-[ID]
" && git push origin [branch]
```

---

## Notes

[Любые дополнительные заметки, вопросы, или решения принятые в процессе]
