# Правила проекта Leadership Architect

## Обязательные правила кодирования

### 1. Swagger декораторы (обязательно для всех API endpoints)

#### Правило 1.1: Контроллеры
```typescript
// ✅ ОБЯЗАТЕЛЬНО
@ApiTags('controller-name')
@Controller('controller-name')
export class ControllerName { }
```

#### Правило 1.2: Параметры методов
```typescript
// ✅ Для @Param
@Get(':id')
@ApiOperation({ summary: 'Описание метода' })
@ApiParam({ name: 'id', type: String })
@ApiResponse({ status: 200, description: 'Успешно' })
async getById(@Param('id') id: string) { }

// ✅ Для @Query
@Get()
@ApiQuery({ name: 'limit', required: false, type: String })
@ApiQuery({ name: 'offset', required: false, type: String })
async getAll(
  @Query('limit') limit?: string,
  @Query('offset') offset?: string,
) { }

// ✅ Для @Body
@Post()
@ApiBody({ type: CreateDto })
async create(@Body() createDto: CreateDto) { }
```

#### Правило 1.3: DTO классы
```typescript
// ✅ ОБЯЗАТЕЛЬНО - класс, не интерфейс
export class CreateDto {
  @ApiProperty({ description: 'Название', example: 'Пример' })
  @IsString()
  @IsNotEmpty()
  name: string;
  
  @ApiPropertyOptional({ description: 'Описание' })
  @IsOptional()
  @IsString()
  description?: string;
}
```

#### Чеклист Swagger:
- [ ] Все контроллеры имеют `@ApiTags`
- [ ] Все `@Param` имеют `@ApiParam`
- [ ] Все `@Query` имеют `@ApiQuery`
- [ ] Все `@Body` имеют `@ApiBody` с типом DTO
- [ ] Все методы имеют `@ApiOperation`
- [ ] Все методы имеют `@ApiResponse`
- [ ] Нет использования `any` для параметров
- [ ] Все DTO - классы с `@ApiProperty`

---

### 2. Обработка ошибок "Cannot read properties of undefined"

#### Правило 2.1: Проверка инжекции зависимостей
```typescript
// ✅ ОБЯЗАТЕЛЬНО
constructor(
  @Inject(PrismaService) private readonly prisma: PrismaService,
) {
  if (!this.prisma) {
    throw new InternalServerErrorException('PrismaService injection failed');
  }
}
```

#### Правило 2.2: Проверка результатов Prisma запросов
```typescript
// ❌ ЗАПРЕЩЕНО
const entity = await this.prisma.entity.findUnique({ where: { id } });
return entity.data;

// ✅ ОБЯЗАТЕЛЬНО
import { findUniqueOrThrow } from '../common/utils/prisma-helpers';

const entity = await findUniqueOrThrow(
  this.prisma.entity.findUnique({ where: { id } }),
  `Entity ${id} not found`,
);
return entity.data;
```

#### Правило 2.3: Optional chaining для вложенных свойств
```typescript
// ❌ ЗАПРЕЩЕНО
const value = obj.nested.deep.property;

// ✅ ОБЯЗАТЕЛЬНО
const value = obj?.nested?.deep?.property;
// или с проверкой
if (obj?.nested?.deep?.property) {
  const value = obj.nested.deep.property;
}
```

#### Правило 2.4: Валидация входных данных
```typescript
// ✅ ОБЯЗАТЕЛЬНО
async getById(id: string) {
  if (!id) {
    throw new BadRequestException('ID is required');
  }
  
  const entity = await findUniqueOrThrow(
    this.prisma.entity.findUnique({ where: { id } }),
    `Entity ${id} not found`,
  );
  
  return entity;
}
```

#### Чеклист обработки ошибок:
- [ ] Все зависимости проверены в конструкторе
- [ ] Все Prisma запросы проверяют результат
- [ ] Используется optional chaining для вложенных свойств
- [ ] Используются утилиты (assertExists, findUniqueOrThrow)
- [ ] Нет прямого доступа к свойствам без проверки
- [ ] Входные параметры валидируются

---

## Системный подход к решению ошибок

### Алгоритм решения (4 шага)

#### Шаг 1: Диагностика (5 минут)
1. Анализ стека вызовов - найти файл и строку
2. Определение проблемного объекта - что undefined?
3. Проверка контекста - когда происходит?

#### Шаг 2: Быстрое решение (10 минут)
1. Временная защита - добавить проверки
2. Optional chaining - использовать `?.`
3. Try-catch с fallback - обработать ошибку

#### Шаг 3: Правильное решение (20 минут)
1. Проверка инжекции - валидация в конструкторе
2. Валидация данных - проверка результатов
3. Использование утилит - assertExists, findUniqueOrThrow

#### Шаг 4: Предотвращение (постоянно)
1. Следование правилам - использовать чеклисты
2. Автоматические проверки - ESLint, скрипты
3. Code review - проверка перед коммитом

---

## Созданные утилиты (используйте их!)

### assert-exists.ts
```typescript
import { assertExists } from '../common/utils/assert-exists';

const result = await this.prisma.entity.findUnique({ where: { id } });
assertExists(result, `Entity ${id} not found`);
```

### prisma-helpers.ts
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

---

## Запрещенные паттерны

### ❌ НЕ используйте:

1. **Прямой доступ без проверки:**
   ```typescript
   const value = obj.property; // obj может быть undefined!
   ```

2. **any типы для параметров:**
   ```typescript
   async method(@Body() body: any) { } // Создайте DTO!
   ```

3. **Интерфейсы для DTO:**
   ```typescript
   export interface CreateDto { } // Используйте класс!
   ```

4. **Отсутствие декораторов Swagger:**
   ```typescript
   @Get(':id')
   async getById(@Param('id') id: string) { } // Добавьте декораторы!
   ```

5. **Prisma запросы без проверки:**
   ```typescript
   const entity = await this.prisma.entity.findUnique({ where: { id } });
   return entity.data; // entity может быть null!
   ```

---

## Автоматические проверки

### Скрипт проверки Swagger декораторов
```bash
ts-node scripts/fix-swagger-decorators.ts
```

### ESLint правила (рекомендуется добавить)
```json
{
  "rules": {
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/strict-boolean-expressions": "warn",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

---

## Документация

Подробные руководства:
- `docs/SWAGGER_TROUBLESHOOTING.md` - решение проблем Swagger
- `docs/ERROR_HANDLING_GUIDE.md` - обработка ошибок
- `docs/SYSTEMATIC_ERROR_RESOLUTION.md` - системный подход

---

## Чеклист перед коммитом

### Swagger:
- [ ] Все контроллеры имеют `@ApiTags`
- [ ] Все параметры имеют соответствующие декораторы
- [ ] Все DTO - классы с `@ApiProperty`
- [ ] Нет использования `any`

### Обработка ошибок:
- [ ] Все зависимости проверены
- [ ] Все Prisma запросы проверяют результат
- [ ] Используется optional chaining
- [ ] Используются утилиты

---

**Следуйте этим правилам при написании кода!**

