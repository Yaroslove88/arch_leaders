# Common модули

## Фильтры (Filters)

### AllExceptionsFilter
Глобальный обработчик всех исключений. Логирует ошибки и возвращает структурированный ответ.

**Использование:**
- Автоматически применяется глобально в `main.ts`
- Логирует все ошибки
- Возвращает структурированный JSON ответ

## Перехватчики (Interceptors)

### LoggingInterceptor
Логирует все HTTP запросы с временем выполнения.

**Использование:**
- Автоматически применяется глобально в `main.ts`
- Логирует: метод, URL, статус код, время выполнения

### TransformInterceptor
Трансформирует ответы в стандартный формат:
```json
{
  "success": true,
  "data": {...},
  "timestamp": "2026-01-07T..."
}
```

**Примечание:** Не применяется глобально, можно использовать локально в контроллерах.

## Guards

### ApiKeyGuard
Защита API ключом (опционально, если установлен API_KEY в .env).

**Использование:**
```typescript
@UseGuards(ApiKeyGuard)
@Controller('protected')
```

## Middleware

### RequestIdMiddleware
Добавляет уникальный ID к каждому запросу (X-Request-ID header).

**Использование:**
- Применяется глобально в `AppModule`
- Добавляет заголовок `X-Request-ID` к каждому ответу

## DTOs

### CreateEntryDto
Валидация данных для создания Entry.

**Поля:**
- `type`: situation | reflection | feedback | voice | import
- `source`: file | telegram | web
- `text`: строка, максимум 50000 символов
- `participants`: массив строк, максимум 20
- `tags`: массив строк, максимум 20, каждый тег максимум 50 символов

### CreateQuestDto
Валидация данных для создания Quest.

**Поля:**
- `title`: строка, максимум 200 символов
- `description`: строка, максимум 5000 символов
- `type`: micro | weekly | story | in-person
- `criteria`: объект с type и description
- `reward`: опциональный объект с xp, skill_xp, artifact
- `linked_nodes`: массив строк, максимум 10

## Health Check

### HealthController
Проверка здоровья API и подключения к БД.

**Endpoint:** `GET /health`

**Ответ:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-07T...",
  "database": "connected"
}
```
