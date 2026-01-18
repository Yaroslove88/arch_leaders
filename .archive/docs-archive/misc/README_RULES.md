# Правила проекта - Краткая справка

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

### 1. Swagger декораторы

**Для каждого контроллера:**
- ✅ `@ApiTags('name')` на класс
- ✅ `@ApiParam` для каждого `@Param`
- ✅ `@ApiQuery` для каждого `@Query`
- ✅ `@ApiBody({ type: DtoClass })` для каждого `@Body`
- ✅ `@ApiOperation` и `@ApiResponse` для каждого метода

**Для DTO:**
- ✅ Классы, НЕ интерфейсы
- ✅ `@ApiProperty` на всех полях
- ✅ Нет `any` типов

### 2. Обработка ошибок

**Обязательно:**
- ✅ Проверка инжекции в конструкторе
- ✅ Проверка результатов Prisma запросов
- ✅ Использование `findUniqueOrThrow` из утилит
- ✅ Optional chaining (`?.`) для вложенных свойств
- ✅ Валидация входных параметров

## Использование утилит

```typescript
// Вместо ручных проверок
import { findUniqueOrThrow } from '../common/utils/prisma-helpers';
import { assertExists } from '../common/utils/assert-exists';

const entity = await findUniqueOrThrow(
  this.prisma.entity.findUnique({ where: { id } }),
  `Entity ${id} not found`,
);
```

## Подробная документация

- `PROJECT_RULES.md` - полные правила проекта
- `.cursorrules` - правила для Cursor AI
- `docs/SWAGGER_TROUBLESHOOTING.md` - решение проблем Swagger
- `docs/ERROR_HANDLING_GUIDE.md` - обработка ошибок
- `docs/SYSTEMATIC_ERROR_RESOLUTION.md` - системный подход

---

**Следуйте правилам для поддержания качества кода!**

