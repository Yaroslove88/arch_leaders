# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Leadership Architect is a Life-RPG system for leadership development. It's a monorepo with:
- **apps/api** - NestJS backend (Port 3001)
- **apps/web** - Next.js 14 frontend (Port 3000)
- **packages/shared** - Shared Zod schemas and types
- **packages/ui** - Design tokens

---

## Cursor Configuration

### Agents (`.cursor/agents/`)

Специализированные агенты для типовых задач:

| Agent | Purpose | Usage |
|-------|---------|-------|
| `code-reviewer` | Ревью кода перед коммитом | `@agent code-reviewer` |
| `tdd-guide` | TDD тесты для NestJS/Next.js | `@agent tdd-guide` |
| `build-error-resolver` | Фикс ошибок сборки/деплоя | `@agent build-error-resolver` |
| `security-reviewer` | Проверка безопасности, auth | `@agent security-reviewer` |
| `planner` | Планирование фич, декомпозиция | `@agent planner` |
| `doc-updater` | Синхронизация документации | `@agent doc-updater` |

### Commands (`.cursor/commands/`)

Slash-команды для быстрых действий:

| Command | Description |
|---------|-------------|
| `/plan` | Планирование реализации фичи |
| `/code-review` | Ревью изменений перед коммитом |
| `/build-fix` | Исправление ошибок сборки |
| `/tdd` | Создание тестов по TDD |
| `/gap-close` | Закрытие гэпа из GAP_ANALYSIS |

### Rules (`.cursor/rules/`)

Модульные правила проекта:

| Rule | Scope |
|------|-------|
| `security.mdc` | Auth guards, secrets, user isolation |
| `coding-style.mdc` | TypeScript, NestJS, Next.js паттерны |
| `prisma.mdc` | БД паттерны, userId filtering |
| `testing.mdc` | TDD правила, coverage |
| `git-workflow.mdc` | Ветки, коммиты, деплой |
| `workflow.mdc` | Timeweb деплой специфика |
| `agents.mdc` | Когда делегировать агентам |

---

## GAP Analysis

Проект имеет 47 гэпов из `docs/audit/GAP_ANALYSIS_REPORT.md`:
- **15 HIGH** — критичные (требуют немедленного исправления)
- **22 MEDIUM** — важные (планировать на ближайшие спринты)
- **10 LOW** — желательные (улучшения на будущее)

Используй `/gap-close [ID]` для работы с гэпами.

---

## Essential Commands

```bash
# Development
pnpm dev                     # Run all apps
pnpm dev --filter=api        # Backend only
pnpm dev --filter=web        # Frontend only

# Database (run from apps/api)
cd apps/api
npx prisma migrate dev       # Create/apply migrations
npx prisma generate          # Regenerate client
npx prisma studio            # Database GUI

# Quality checks
pnpm lint                    # ESLint
pnpm typecheck               # TypeScript
pnpm test                    # Jest tests
pnpm build                   # Build all

# Docker database
docker-compose -f infra/docker-compose.dev.yml up -d
```

---

## Architecture

### Data Flow
```
Frontend (lib/api.ts + getAuthHeaders)
    → NestJS Controller (@UseGuards(JwtAuthGuard))
    → Service (accepts userId)
    → Prisma (where: { userId })
    → PostgreSQL
```

### Source of Truth Locations

| Data Type | Location |
|-----------|----------|
| Database schema | `apps/api/prisma/schema.prisma` |
| API endpoints | `apps/api/src/*/[name].controller.ts` |
| Business logic | `apps/api/src/*/[name].service.ts` |
| Frontend API | `apps/web/src/lib/api.ts` |
| Quest templates | `data/quest-templates.json` |
| Interactive cases | `data/interactive-cases.json` |
| Node descriptions | `data/node-descriptions.json` |
| Ability tree structure | `packages/shared/src/seed/initial-ability-tree.json` |

### Key Backend Modules
- `auth/` - JWT authentication
- `entries/` - User input (situations, reflections)
- `sessions/` - AI analysis output
- `quests/` - Development quests
- `evidence/` - Skill evidence collection
- `tree/` - Ability tree (semantic graph)
- `cases/` - Interactive case studies
- `ability/` - Ability progression engine
- `admin/` - Admin panel with audit logging
- `jobs/` - Background job queue

### Critical Architecture Pattern: Single Source of Truth

The ability tree has THREE separate data sources (must NOT be mixed):

1. **Structure** (seed file) - node_id, branch_id, tier, prerequisites
2. **Content** (node-descriptions.json) - names, descriptions, examples
3. **User Data** (UserAbilityState table) - state, xp_current, progress

When updating tree data, never overwrite user progress. See `docs/ARCHITECTURE_SINGLE_SOURCE_OF_TRUTH.md`.

---

## Authentication Pattern

### Backend
```typescript
@Get('my-data')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
async getMyData(@CurrentUser() user: JwtPayload) {
  return this.service.getData(user.sub);  // user.sub = userId
}
```

### Frontend
```typescript
const response = await fetch(url, {
  headers: getAuthHeaders(),  // from lib/api.ts
});
```

### User Isolation
ALL user data queries must filter by userId:
```typescript
await this.prisma.quest.findMany({
  where: { userId: userId }
});
```

---

## Environment Variables

Required for production:
- `DATABASE_URL` - PostgreSQL connection
- `WEB_URL` - Frontend URL for CORS

Optional:
- `PORT` - API port (default: 3001)
- `NODE_ENV` - development/production/test
- `JWT_SECRET`, `JWT_EXPIRES_IN` - Auth config
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` - LLM for analysis
- `TELEGRAM_BOT_TOKEN` - Telegram integration
- `API_KEY` - Optional API protection
- `DISABLE_TREE_AUTO_SYNC` - Set to `true` to prevent automatic tree sync from seed

---

## Key Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts with roles |
| `entries` | Raw user input |
| `sessions` | AI analysis output |
| `quests` | Development tasks |
| `user_ability_state` | User progress on nodes |
| `tree_semantic` | Ability tree structure |
| `evidence` | Skill evidence |
| `case_progress` | Case completion |
| `changelog` | Audit trail with undo |

---

## Anti-Patterns to Avoid

- Endpoints without `@UseGuards(JwtAuthGuard)` for user data
- Forgetting `userId` in service methods
- Using `any` type - use specific types or `Record<string, unknown>`
- Storing user data in JSON files (user data belongs in database only)
- Overwriting TreeSemantic.data without preserving user state

---

## Git Workflow

### Branch Strategy
```
apps/web/  → branch 'web'
apps/api/  → branch 'main'
```

### Deploy (Timeweb)
- Push to `web` → auto-deploy WEB
- Push to `main` → auto-deploy API
- ENV changes → manual redeploy

---

## Useful Scripts

```bash
# Tree management
ts-node scripts/check-and-fix-tree.ts              # Validate tree
ts-node scripts/migrate-tree-separation.ts         # Preview migration (dry-run)
ts-node scripts/migrate-tree-separation.ts --apply # Apply migration with transaction

# User management
ts-node scripts/check-user-profile.ts              # Check user data

# Quest sync (preserves user quests, only updates source='base_template')
ts-node apps/api/src/scripts/sync-base-quests.ts
```

---

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):
1. lint-and-typecheck
2. test (with PostgreSQL 16 service)
3. build

---

## Key Documentation

| File | Purpose |
|------|---------|
| `docs/audit/GAP_ANALYSIS_REPORT.md` | Гэпы и roadmap |
| `docs/audit/CJM_USER_AUDIT.md` | User journey audit |
| `docs/audit/CJM_ADMIN_AUDIT.md` | Admin journey audit |
| `docs/SYSTEM_ARCHITECTURE_GUIDE_RU.md` | Full architecture |
| `docs/DEPLOYMENT_GUIDE_RU.md` | Deployment guide |
