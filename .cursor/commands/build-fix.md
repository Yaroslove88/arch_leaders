---
name: build-fix
description: Исправление ошибок сборки и деплоя
---

# /build-fix — Исправление ошибок сборки

Проанализируй и исправь ошибку сборки или деплоя.

## Входные данные

Предоставь:
1. **Error message** (полный текст ошибки)
2. **Контекст** (web, api, Timeweb)
3. **Что делал перед ошибкой**

## Процесс

1. Определи тип ошибки (TypeScript, Prisma, Next.js, NestJS)
2. Найди root cause
3. Предложи fix
4. Проверь fix локально
5. Укажи команды для деплоя

## Quick Fixes

### TypeScript Error
```bash
pnpm typecheck --filter=api  # или web
```

### Prisma Error
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev
```

### Build Error
```bash
pnpm build --filter=api  # или web
```

## Output

```markdown
## Build Error Analysis

### Error Type
[TypeScript | Prisma | Next.js | NestJS | Timeweb]

### Root Cause
[description]

### Fix
[code changes]

### Verification
```bash
[commands to verify]
```

### Deploy
- Branch: [web | main]
- Service: [WEB | API]
- Timeweb actions: [if needed]
```

## Пример использования

```
/build-fix

Ошибка при деплое на Timeweb:
Error: Cannot find module '@prisma/client'
```
