# Системный подход к решению ошибок "Cannot read properties of undefined"

## Общая стратегия

### 1. Диагностика (5 минут)

#### Шаг 1.1: Анализ стека вызовов
```
Error: Cannot read properties of undefined (reading 'propertyName')
    at Service.method (file.ts:line:column)
```

**Что делать:**
1. Найти файл и строку с ошибкой
2. Определить, какое свойство пытается прочитать код
3. Понять, какой объект undefined

#### Шаг 1.2: Проверка контекста
- Где происходит ошибка? (БД запрос, внешний API, вычисление)
- Когда происходит? (при старте, при запросе, периодически)
- Что изменилось? (новый код, обновление зависимостей)

### 2. Быстрое решение (10 минут)

#### Вариант A: Временная защита
```typescript
// Добавить проверку перед доступом
if (!obj) {
  throw new NotFoundException('Object not found');
}
const value = obj.property;
```

#### Вариант B: Optional chaining
```typescript
// Использовать optional chaining
const value = obj?.property ?? defaultValue;
```

#### Вариант C: Try-catch с fallback
```typescript
try {
  const value = obj.property;
} catch (error) {
  return defaultValue;
}
```

### 3. Правильное решение (20 минут)

#### Шаг 3.1: Проверка инжекции зависимостей
```typescript
constructor(
  @Inject(Service) private readonly service: Service,
) {
  if (!this.service) {
    throw new InternalServerErrorException('Service injection failed');
  }
}
```

#### Шаг 3.2: Валидация данных
```typescript
// Для Prisma запросов
const result = await this.prisma.entity.findUnique({ where: { id } });
if (!result) {
  throw new NotFoundException(`Entity ${id} not found`);
}
if (!result.data) {
  throw new InternalServerErrorException('Entity data is corrupted');
}
```

#### Шаг 3.3: Использование утилит
```typescript
import { assertExists } from '../common/utils/assert-exists';
import { findUniqueOrThrow } from '../common/utils/prisma-helpers';

// Вместо ручных проверок
const entity = await findUniqueOrThrow(
  this.prisma.entity.findUnique({ where: { id } }),
  `Entity ${id} not found`,
);
```

### 4. Предотвращение (постоянно)

#### Правило 1: Всегда проверяйте результаты БД запросов
```typescript
// ❌ Неправильно
const entity = await this.prisma.entity.findUnique({ where: { id } });
return entity.data;

// ✅ Правильно
const entity = await this.prisma.entity.findUnique({ where: { id } });
if (!entity) {
  throw new NotFoundException(`Entity ${id} not found`);
}
return entity.data;
```

#### Правило 2: Используйте optional chaining для вложенных свойств
```typescript
// ❌ Неправильно
const value = obj.nested.deep.property;

// ✅ Правильно
const value = obj?.nested?.deep?.property;
```

#### Правило 3: Валидируйте входные данные
```typescript
// ✅ Всегда проверяйте входные параметры
if (!id) {
  throw new BadRequestException('ID is required');
}
```

#### Правило 4: Используйте TypeScript strict mode
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Чеклист для каждого сервиса

### При создании нового сервиса:

- [ ] Проверка инжекции зависимостей в конструкторе
- [ ] Валидация входных параметров
- [ ] Проверка результатов БД запросов
- [ ] Обработка ошибок с понятными сообщениями
- [ ] Логирование критических ошибок
- [ ] Использование утилит (assertExists, findUniqueOrThrow)

### При работе с БД:

- [ ] Всегда проверяйте результат `findUnique` / `findFirst`
- [ ] Используйте `findUniqueOrThrow` из утилит
- [ ] Проверяйте существование перед обновлением/удалением
- [ ] Обрабатывайте Prisma ошибки через `handlePrismaError`

### При работе с объектами:

- [ ] Используйте optional chaining (`?.`)
- [ ] Проверяйте `null` и `undefined`
- [ ] Используйте nullish coalescing (`??`)
- [ ] Валидируйте структуру данных

## Созданные утилиты

### 1. assert-exists.ts
```typescript
import { assertExists } from '../common/utils/assert-exists';

const result = await this.prisma.entity.findUnique({ where: { id } });
assertExists(result, `Entity ${id} not found`);
```

### 2. prisma-helpers.ts
```typescript
import { findUniqueOrThrow, handlePrismaError } from '../common/utils/prisma-helpers';

// Безопасный findUnique
const entity = await findUniqueOrThrow(
  this.prisma.entity.findUnique({ where: { id } }),
  `Entity ${id} not found`,
);

// Обработка ошибок
try {
  await this.prisma.entity.create({ data });
} catch (error) {
  handlePrismaError(error, 'Failed to create entity');
}
```

## Примеры исправления

### Пример 1: Prisma запрос

**До:**
```typescript
async getById(id: string) {
  const entity = await this.prisma.entity.findUnique({ where: { id } });
  return entity.data; // Может быть null!
}
```

**После:**
```typescript
async getById(id: string) {
  const entity = await findUniqueOrThrow(
    this.prisma.entity.findUnique({ where: { id } }),
    `Entity ${id} not found`,
  );
  return entity.data;
}
```

### Пример 2: Вложенные объекты

**До:**
```typescript
const value = result.treeSemantic.data;
```

**После:**
```typescript
if (!result?.treeSemantic?.data) {
  throw new NotFoundException('Tree semantic data not found');
}
const value = result.treeSemantic.data;
```

### Пример 3: Инжекция зависимостей

**До:**
```typescript
constructor(
  private readonly prisma: PrismaService,
) {}
```

**После:**
```typescript
constructor(
  @Inject(PrismaService) private readonly prisma: PrismaService,
) {
  if (!this.prisma) {
    throw new InternalServerErrorException('PrismaService injection failed');
  }
}
```

## Автоматизация

### ESLint правила

```json
{
  "rules": {
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/strict-boolean-expressions": "warn"
  }
}
```

### Pre-commit hooks

Создать hook для проверки:
- Использования `any` типов
- Отсутствия проверок на null/undefined
- Неправильного использования optional chaining

## Резюме системного подхода

1. **Диагностика** (5 мин) - анализ стека, определение проблемы
2. **Быстрое решение** (10 мин) - временная защита, optional chaining
3. **Правильное решение** (20 мин) - проверки, валидация, утилиты
4. **Предотвращение** (постоянно) - правила, чеклисты, автоматизация

## Применение к конкретной ошибке

### Ошибка: `Cannot read properties of undefined (reading 'treeSemantic')`

**Диагностика:**
- Файл: `tree.service.ts:103`
- Проблема: `this.prisma` может быть undefined
- Или: `this.prisma.treeSemantic` недоступен

**Решение:**
1. ✅ Добавлена проверка инжекции в конструкторе
2. ✅ Добавлена проверка доступности модели
3. ✅ Добавлены проверки результатов запросов
4. ✅ Улучшена обработка ошибок
5. ✅ Созданы переиспользуемые утилиты

---

**Следуйте этому системному подходу для всех подобных ошибок!**

