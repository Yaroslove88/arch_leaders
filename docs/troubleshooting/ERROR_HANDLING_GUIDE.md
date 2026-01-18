# Системный подход к решению ошибок "Cannot read properties of undefined"

## Диагностика ошибок доступа к свойствам

### Типичные ошибки

1. **`Cannot read properties of undefined (reading 'propertyName')`**
   - Причина: Попытка доступа к свойству объекта, который равен `undefined` или `null`
   - Место: Обычно в сервисах при работе с БД или внешними API

2. **`Cannot read properties of null (reading 'propertyName')`**
   - Причина: Аналогично, но объект равен `null`

## Системный подход к решению

### Шаг 1: Диагностика

#### 1.1. Анализ стека вызовов
```
Error: Cannot read properties of undefined (reading 'treeSemantic')
    at TreeService.getSemantic (tree.service.ts:103:13)
```

**Что искать:**
- Файл и строка с ошибкой
- Метод, где происходит ошибка
- Какое свойство пытается прочитать

#### 1.2. Проверка источника данных

```typescript
// ❌ Проблемный код
const result = await this.prisma.treeSemantic.findUnique(...);
return result.treeSemantic; // result может быть null!

// ✅ Правильный код
const result = await this.prisma.treeSemantic.findUnique(...);
if (!result) {
  throw new NotFoundException('Tree semantic not found');
}
return result.treeSemantic;
```

### Шаг 2: Предотвращение

#### 2.1. Обязательные проверки

**Для Prisma запросов:**
```typescript
// ✅ Всегда проверяйте результат
const entity = await this.prisma.entity.findUnique({ where: { id } });
if (!entity) {
  throw new NotFoundException(`Entity with id ${id} not found`);
}
```

**Для вложенных объектов:**
```typescript
// ❌ Небезопасно
const value = obj.nested.deep.property;

// ✅ Безопасно
const value = obj?.nested?.deep?.property;
// или
if (obj?.nested?.deep?.property) {
  const value = obj.nested.deep.property;
}
```

#### 2.2. Использование Optional Chaining

```typescript
// ✅ Optional chaining
const value = result?.treeSemantic?.data;

// ✅ С fallback
const value = result?.treeSemantic?.data ?? defaultValue;
```

#### 2.3. Валидация входных данных

```typescript
// ✅ Проверка перед использованием
if (!id) {
  throw new BadRequestException('ID is required');
}

const result = await this.service.findById(id);
if (!result) {
  throw new NotFoundException('Not found');
}
```

### Шаг 3: Обработка ошибок

#### 3.1. Структурированная обработка

```typescript
async getSemantic() {
  try {
    const result = await this.prisma.treeSemantic.findUnique({
      where: { id: 'tree_main' },
    });

    if (!result) {
      throw new NotFoundException('Semantic tree not found. Run seed first.');
    }

    if (!result.data) {
      throw new InternalServerErrorException('Semantic tree data is corrupted');
    }

    return result.data;
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    this.logger.error('Failed to load semantic tree:', error);
    throw new InternalServerErrorException('Failed to load semantic tree');
  }
}
```

#### 3.2. Использование дефолтных значений

```typescript
// ✅ С дефолтным значением
const result = await this.prisma.treeSemantic.findUnique(...) ?? {
  id: 'tree_main',
  data: defaultTreeData,
};
```

### Шаг 4: Инструменты и утилиты

#### 4.1. Создание helper функций

```typescript
// common/utils/assert-exists.ts
export function assertExists<T>(
  value: T | null | undefined,
  message: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundException(message);
  }
}

// Использование
const result = await this.prisma.entity.findUnique({ where: { id } });
assertExists(result, `Entity with id ${id} not found`);
// Теперь TypeScript знает, что result не null
```

#### 4.2. Типизированные обертки для Prisma

```typescript
// common/utils/prisma-helpers.ts
export async function findOrThrow<T>(
  query: Promise<T | null>,
  errorMessage: string,
): Promise<T> {
  const result = await query;
  if (!result) {
    throw new NotFoundException(errorMessage);
  }
  return result;
}

// Использование
const tree = await findOrThrow(
  this.prisma.treeSemantic.findUnique({ where: { id: 'tree_main' } }),
  'Semantic tree not found. Run seed first.',
);
```

## Чеклист для предотвращения ошибок

### При работе с БД:

- [ ] Всегда проверяйте результат `findUnique` / `findFirst`
- [ ] Используйте `findUniqueOrThrow` если доступно (Prisma 4.16+)
- [ ] Проверяйте существование перед обновлением/удалением
- [ ] Обрабатывайте случаи, когда запись не найдена

### При работе с объектами:

- [ ] Используйте optional chaining (`?.`) для вложенных свойств
- [ ] Проверяйте `null` и `undefined` перед доступом
- [ ] Используйте nullish coalescing (`??`) для дефолтных значений
- [ ] Валидируйте входные данные

### При работе с массивами:

- [ ] Проверяйте длину массива перед доступом к элементам
- [ ] Используйте `Array.isArray()` для проверки типа
- [ ] Обрабатывайте пустые массивы

## Паттерны обработки

### Паттерн 1: Early Return

```typescript
async getById(id: string) {
  if (!id) {
    throw new BadRequestException('ID is required');
  }

  const entity = await this.prisma.entity.findUnique({ where: { id } });
  if (!entity) {
    throw new NotFoundException(`Entity ${id} not found`);
  }

  return entity;
}
```

### Паттерн 2: Try-Catch с контекстом

```typescript
async getSemantic() {
  try {
    const result = await this.prisma.treeSemantic.findUnique({
      where: { id: 'tree_main' },
    });

    if (!result) {
      this.logger.warn('Semantic tree not found, returning default');
      return this.getDefaultSemanticTree();
    }

    return result.data;
  } catch (error) {
    this.logger.error('Failed to load semantic tree', error);
    throw new InternalServerErrorException(
      'Failed to load semantic tree. Please check database connection.',
    );
  }
}
```

### Паттерн 3: Валидация с помощью Guards

```typescript
// Создать guard для проверки существования
@Injectable()
export class EntityExistsGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const id = request.params.id;
    
    const exists = await this.prisma.entity.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Entity ${id} not found`);
    }
    
    return true;
  }
}
```

## Автоматическая проверка

### ESLint правила

```json
{
  "rules": {
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error"
  }
}
```

### TypeScript strict mode

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Примеры исправления

### Пример 1: Prisma запрос

```typescript
// ❌ До
async getById(id: string) {
  const entity = await this.prisma.entity.findUnique({ where: { id } });
  return entity.data; // Может быть null!
}

// ✅ После
async getById(id: string) {
  const entity = await this.prisma.entity.findUnique({ where: { id } });
  if (!entity) {
    throw new NotFoundException(`Entity ${id} not found`);
  }
  return entity.data;
}
```

### Пример 2: Вложенные объекты

```typescript
// ❌ До
const value = result.treeSemantic.data;

// ✅ После
const value = result?.treeSemantic?.data;
// или
if (result?.treeSemantic?.data) {
  const value = result.treeSemantic.data;
}
```

### Пример 3: Массивы

```typescript
// ❌ До
const first = items[0].name;

// ✅ После
const first = items?.[0]?.name;
// или
if (items.length > 0) {
  const first = items[0].name;
}
```

## Созданные утилиты

### assert-exists.ts
```typescript
import { assertExists } from '../common/utils/assert-exists';

const result = await this.prisma.entity.findUnique({ where: { id } });
assertExists(result, `Entity ${id} not found`);
// Теперь TypeScript знает, что result не null
```

### prisma-helpers.ts
```typescript
import { findUniqueOrThrow } from '../common/utils/prisma-helpers';

const entity = await findUniqueOrThrow(
  this.prisma.entity.findUnique({ where: { id } }),
  `Entity ${id} not found`,
);
```

## Резюме

1. **Всегда проверяйте** результаты запросов к БД
2. **Используйте optional chaining** для вложенных свойств
3. **Валидируйте входные данные** перед использованием
4. **Обрабатывайте ошибки** с понятными сообщениями
5. **Используйте TypeScript strict mode** для раннего обнаружения проблем
6. **Создавайте helper функции** для повторяющихся проверок
7. **Проверяйте инжекцию зависимостей** в конструкторе
8. **Используйте созданные утилиты** для упрощения кода

## Быстрая диагностика

### Шаг 1: Проверка стека вызовов
```
Error: Cannot read properties of undefined (reading 'propertyName')
    at Service.method (file.ts:line:column)
```
- Найти файл и строку
- Проверить, что объект не null/undefined перед доступом

### Шаг 2: Проверка инжекции
```typescript
// Добавить в конструктор
if (!this.dependency) {
  throw new Error('Dependency not injected');
}
```

### Шаг 3: Добавить проверки
```typescript
// Вместо
const value = obj.property;

// Использовать
if (!obj) {
  throw new NotFoundException('Object not found');
}
const value = obj.property;
```

---

**При возникновении подобных ошибок следуйте этому чеклисту по порядку.**

