---
name: dev-story
description: Реализация story по BMAD-шаблону (implementation → tests → review)
---

# /dev-story — Реализация Story

Реализует story из tech-spec по структурированному BMAD-воркфлоу.

## Когда использовать

- После `/quick-spec` или `/plan`
- Есть готовая story с acceptance criteria
- Понятен scope и файлы для изменения

## Входные данные

```
/dev-story [STORY-ID]

[опционально: дополнительный контекст]
```

Или с полным описанием:
```
/dev-story

Title: [название]
Files: [файлы]
Criteria: [acceptance criteria]
```

## Workflow

```
┌─────────────┐
│  1. PREP    │  Проверка контекста и зависимостей
└──────┬──────┘
       │
┌──────▼──────┐
│  2. IMPL    │  Реализация кода
└──────┬──────┘
       │
┌──────▼──────┐
│  3. TEST    │  Написание тестов (если нужно)
└──────┬──────┘
       │
┌──────▼──────┐
│  4. VERIFY  │  Проверка acceptance criteria
└──────┬──────┘
       │
┌──────▼──────┐
│  5. REVIEW  │  → /code-review
└─────────────┘
```

## Процесс

### Step 1: PREP (Подготовка)

1. **Прочитай story** из tech-spec
2. **Проверь зависимости**:
   - Предыдущие stories выполнены?
   - Нужные файлы существуют?
   - Нет blocking issues?
3. **Подтверди scope**:
   - Какие файлы меняем?
   - Нужна ли миграция БД?
   - Затрагивает web, api или оба?

### Step 2: IMPL (Реализация)

1. **Следуй паттернам проекта**:
   - NestJS: controller → service → prisma
   - Next.js: page → components → lib/api.ts
   - Всегда `userId` в queries

2. **Минимальное решение первым**:
   - Не добавляй "на будущее"
   - Не усложняй без причины

3. **Проверяй по ходу**:
   - Linter errors: `pnpm lint`
   - Type errors: `pnpm typecheck`

### Step 3: TEST (Тестирование)

**Когда нужны тесты:**
- Новый service method
- Изменение auth логики
- Изменение data access

**Когда можно пропустить:**
- Простой UI fix
- Текстовые изменения
- Level 0 bug fixes

**Шаблон теста:**
```typescript
describe('methodName', () => {
  it('should [expected behavior]', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Step 4: VERIFY (Проверка)

Пройди по acceptance criteria:

```markdown
## Verification

### Acceptance Criteria
- [x] Criterion 1 — PASS
- [x] Criterion 2 — PASS
- [ ] Criterion 3 — FAIL: [reason]

### Manual Testing
- [ ] Проверено в браузере
- [ ] Проверено в Mini App (если применимо)
```

### Step 5: REVIEW (Ревью)

Вызови `/code-review` автоматически:

```
/code-review

Изменения для STORY-[ID]:
- [список изменённых файлов]
```

## Output Format

```markdown
## Dev Story: [STORY-ID]

### Status: [IN_PROGRESS | DONE | BLOCKED]

### Changes Made

| File | Change |
|------|--------|
| `path/to/file.ts` | [описание] |

### Tests Added
- `path/to/test.spec.ts` — [что тестирует]

### Verification

#### Acceptance Criteria
- [x] [criterion 1]
- [x] [criterion 2]

#### Manual Check
- [x] Linter pass
- [x] Typecheck pass
- [x] Local test pass

### Code Review

[output from /code-review]

### Commit Ready

```bash
git add -A && git commit -m "[type]: [message]

STORY-[ID]
" && git push
```

**Deploy**: [WEB | API | BOTH]
```

## Примеры

### Bug Fix Story

```
/dev-story STORY-1

Title: Fix router.back() in cases
Files: apps/web/src/app/cases/[id]/page.tsx
```

### Feature Story

```
/dev-story STORY-2

Title: Add search input to quests page
Files:
- apps/web/src/app/quests/page.tsx
- apps/web/src/components/SearchInput.tsx (new)
Criteria:
- Search input visible on /quests
- Filters quests by title
- Debounced input (300ms)
```

## Правила

### Security First
- `@UseGuards(JwtAuthGuard)` на новых endpoints
- `userId` в Prisma queries
- Проверка ownership перед update/delete

### Code Quality
- Нет `any` типов
- DTOs для request/response
- Error handling (NotFoundException, ForbiddenException)

### После завершения
- НЕ забудь `/code-review`
- НЕ забудь указать deploy target (WEB/API)
- Коммит сразу после завершения

## Интеграция

### С /quick-spec
```
/quick-spec [task]     → генерирует stories
/dev-story STORY-1     → реализует story
/dev-story STORY-2     → следующая story
```

### С /gap-close
```
/gap-close [GAP-ID]    → использует /dev-story внутри
```

### С /code-review
```
/dev-story ...         → автоматически вызывает в конце
```
