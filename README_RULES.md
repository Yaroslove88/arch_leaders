# Правила проекта — краткая справка

## Быстрая проверка перед коммитом
```bash
# Проверить качество кода
pnpm check:quality

# Проверить Swagger декораторы
pnpm check:swagger

# Полная проверка (качество + lint + typecheck)
pnpm precommit
```

## Два обязательных правила
### 1. Swagger
- `@ApiTags` на контроллер, `@ApiParam`/`@ApiQuery`/`@ApiBody`/`@ApiOperation`/`@ApiResponse` на каждый endpoint.
- DTO только классы с `@ApiProperty`, без `any`.

### 2. Обработка ошибок
- Проверка инжекции в конструкторе.
- `findUniqueOrThrow`/`assertExists` для Prisma/результатов.
- Optional chaining (`?.`) и валидация входных параметров.

## Design System (кратко)
- Tokens v2 (semantic colors/base/structure/state, типографика, spacing, радиусы, тени) из `@leadership-architect/ui`; без сторонних utility-цветов.
- Контраст: текст `ash-light`/`ui-text-muted` на `graphite-structure`; избегать low-opacity текста.
- Состояния: `locked/available/active/unlocked/integrated` → semantic colors (`system-disabled/warning/focus/growth`), ошибки → `system-critical`.
- A11y: `aria-label/aria-disabled`, focus-ring токены, нет глобального `* { transition }`.
- Компоненты: использовать `Surface/Card/Button/Badge/Progress/PillTabs` из UI пакета.
- Детали и варфреймы: `../projects/leadership-architect-docs/01-design-system-audit.md`.

## Использование утилит
```typescript
import { findUniqueOrThrow } from '../common/utils/prisma-helpers';
import { assertExists } from '../common/utils/assert-exists';
```

## Подробно
- `PROJECT_RULES.md` — полный набор правил.
- `.cursorrules` — правила для Cursor AI.
- `docs/SWAGGER_TROUBLESHOOTING.md`, `docs/ERROR_HANDLING_GUIDE.md` — справка по Swagger/ошибкам.

Следуйте правилам для поддержания качества и консистентности UI.
