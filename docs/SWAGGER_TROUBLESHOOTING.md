# Системный подход к решению ошибок Swagger

## Диагностика ошибок Swagger

### Типичные ошибки

1. **`Cannot read properties of undefined (reading '0')`**
   - Причина: Swagger не может найти метаданные параметров
   - Решение: Убедиться, что все параметры имеют правильные декораторы

2. **`TypeError: Cannot read properties of undefined`**
   - Причина: Отсутствуют декораторы для параметров или DTO
   - Решение: Добавить `@ApiParam`, `@ApiQuery`, `@ApiBody`

## Системный подход к решению

### Шаг 1: Поиск проблемных контроллеров

```bash
# Найти все контроллеры
find apps/api/src -name "*.controller.ts"

# Найти методы с параметрами без декораторов
grep -r "@Param\|@Query\|@Body" apps/api/src --include="*.controller.ts"
```

### Шаг 2: Проверка каждого метода

Для каждого метода контроллера проверить:

1. **Параметры пути (`@Param`):**
   ```typescript
   // ✅ Правильно
   @Get(':id')
   @ApiParam({ name: 'id', type: String })
   async getById(@Param('id') id: string) { }
   
   // ❌ Неправильно
   @Get(':id')
   async getById(@Param('id') id: string) { } // Нет @ApiParam
   ```

2. **Query параметры (`@Query`):**
   ```typescript
   // ✅ Правильно
   @Get()
   @ApiQuery({ name: 'limit', required: false, type: Number })
   async getAll(@Query('limit') limit?: string) { }
   
   // ❌ Неправильно
   @Get()
   async getAll(@Query('limit') limit?: string) { } // Нет @ApiQuery
   ```

3. **Body параметры (`@Body`):**
   ```typescript
   // ✅ Правильно
   @Post()
   @ApiBody({ type: CreateDto })
   async create(@Body() createDto: CreateDto) { }
   
   // ❌ Неправильно
   @Post()
   async create(@Body() body: any) { } // Используется any, нет DTO
   ```

### Шаг 3: Проверка DTO

1. **Все DTO должны быть классами, а не интерфейсами:**
   ```typescript
   // ✅ Правильно
   export class CreateDto {
     @ApiProperty()
     name: string;
   }
   
   // ❌ Неправильно
   export interface CreateDto {
     name: string;
   }
   ```

2. **Все поля DTO должны иметь декораторы:**
   ```typescript
   // ✅ Правильно
   export class CreateDto {
     @ApiProperty()
     @IsString()
     name: string;
   }
   
   // ❌ Неправильно
   export class CreateDto {
     name: string; // Нет декораторов
   }
   ```

### Шаг 4: Проверка совместимости версий

```json
{
  "@nestjs/common": "^10.2.0",
  "@nestjs/swagger": "^7.4.2" // Совместимо с NestJS 10
}
```

### Шаг 5: Временное отключение Swagger для диагностики

Если проблема не решается, можно временно отключить Swagger:

```typescript
// В main.ts
if (configService.get<string>('NODE_ENV') !== 'production' && false) {
  // Временно отключено
  SwaggerModule.setup('api/docs', app, document);
}
```

## Чеклист для исправления

- [ ] Все `@Param` имеют соответствующий `@ApiParam`
- [ ] Все `@Query` имеют соответствующий `@ApiQuery`
- [ ] Все `@Body` имеют соответствующий `@ApiBody` с типом DTO
- [ ] Все DTO являются классами, а не интерфейсами
- [ ] Все поля DTO имеют `@ApiProperty` или `@ApiPropertyOptional`
- [ ] Не используется `any` для типов параметров
- [ ] Все опциональные параметры помечены `required: false`

## Автоматическая проверка

Скрипт для проверки создан: `scripts/fix-swagger-decorators.ts`

Запуск:
```bash
cd apps/api
ts-node ../../scripts/fix-swagger-decorators.ts
```

## Быстрое решение (временное отключение)

Если нужно быстро запустить API без Swagger:

1. Установить переменную окружения:
   ```env
   ENABLE_SWAGGER=false
   ```

2. Или закомментировать блок Swagger в `main.ts`

3. После исправления всех декораторов вернуть обратно

## Системный чеклист исправления

### Для каждого контроллера:

1. **Добавить `@ApiTags` на класс:**
   ```typescript
   @ApiTags('controller-name')
   @Controller('controller-name')
   ```

2. **Для каждого метода с `@Param`:**
   - Добавить `@ApiParam({ name: 'paramName', type: String })`

3. **Для каждого метода с `@Query`:**
   - Добавить `@ApiQuery({ name: 'paramName', required: false, type: String })`

4. **Для каждого метода с `@Body`:**
   - Создать DTO класс (не интерфейс!)
   - Добавить `@ApiBody({ type: YourDto })`
   - Или временно: `@ApiBody({ schema: { type: 'object' } })`

5. **Добавить `@ApiOperation` для каждого метода:**
   ```typescript
   @ApiOperation({ summary: 'Описание метода' })
   ```

6. **Добавить `@ApiResponse` для каждого метода:**
   ```typescript
   @ApiResponse({ status: 200, description: 'Успешно' })
   ```

## Примеры правильной реализации

### Полный пример контроллера

```typescript
@ApiTags('example')
@Controller('example')
export class ExampleController {
  @Get()
  @ApiOperation({ summary: 'Получить список' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Успешно' })
  async getAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    // ...
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить по ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Найдено' })
  @ApiResponse({ status: 404, description: 'Не найдено' })
  async getById(@Param('id') id: string) {
    // ...
  }

  @Post()
  @ApiOperation({ summary: 'Создать' })
  @ApiBody({ type: CreateDto })
  @ApiResponse({ status: 201, description: 'Создано' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  async create(@Body() createDto: CreateDto) {
    // ...
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateDto })
  @ApiResponse({ status: 200, description: 'Обновлено' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDto,
  ) {
    // ...
  }
}
```

---

**При возникновении ошибок Swagger следуйте этому чеклисту по порядку.**

