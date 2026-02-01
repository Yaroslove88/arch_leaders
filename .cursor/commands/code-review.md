---
name: code-review
description: Ревью изменений перед коммитом
---

# /code-review — Ревью перед коммитом

Проверь изменения по чеклисту проекта.

## Checklist

### Security
- [ ] `@UseGuards(JwtAuthGuard)` на user endpoints
- [ ] `@ApiBearerAuth()` для Swagger
- [ ] `userId` в Prisma queries
- [ ] Ownership check перед update/delete

### TypeScript
- [ ] Нет `any` типов
- [ ] Используются DTOs
- [ ] Proper error handling

### NestJS (если apps/api)
- [ ] Business logic в services
- [ ] Swagger decorators
- [ ] Exceptions (NotFoundException, ForbiddenException)

### Next.js (если apps/web)
- [ ] `'use client'` где нужно
- [ ] API calls через `lib/api.ts`
- [ ] `getAuthHeaders()` для auth

### Git
- [ ] Правильная ветка (web → `web`, api → `main`)
- [ ] Осмысленный commit message

## Output

```markdown
## Code Review Summary

### ✅ Passed
- [list]

### ⚠️ Warnings
- [list]

### ❌ Must Fix
- [list]

### Ready to Commit: [YES | NO]

### Commit Command
git checkout [branch] && git add -A && git commit -m "[message]" && git push origin [branch]

### Deploy
Service: [WEB | API | BOTH]
```

## Пример использования

```
/code-review

Проверь изменения в:
- apps/api/src/quests/
- apps/web/src/app/quests/
```
