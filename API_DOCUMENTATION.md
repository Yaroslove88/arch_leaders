# API Документация

## Swagger/OpenAPI

API документация доступна через Swagger UI при запуске API в режиме разработки:

**URL:** `http://localhost:3001/api/docs`

### Использование

1. Запустите API:
   ```bash
   cd apps/api
   pnpm dev
   ```

2. Откройте в браузере:
   ```
   http://localhost:3001/api/docs
   ```

3. В Swagger UI вы можете:
   - Просмотреть все доступные endpoints
   - Увидеть схемы запросов и ответов
   - Протестировать API прямо в браузере
   - Экспортировать OpenAPI спецификацию

### Аутентификация

API поддерживает JWT (JSON Web Token) аутентификацию:

1. **Получение токена:**
   ```bash
   POST /auth/login
   Body: { "apiKey": "your-api-key" }
   Response: { "access_token": "..." }
   ```

2. **Использование токена:**
   - Добавьте заголовок: `Authorization: Bearer <token>`
   - Или используйте кнопку "Authorize" в Swagger UI

**Примечание:** 
- Если `JWT_SECRET` не установлен, API доступен без аутентификации
- Публичные endpoints: `/health`, `/auth/login`
- Подробнее см. [AUTHENTICATION.md](./AUTHENTICATION.md)

## Основные Endpoints

### Health Check

#### `GET /health`
Проверка здоровья API и подключения к БД.

**Ответ:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-07T10:00:00.000Z",
  "database": "connected"
}
```

### Entries (Записи)

#### `GET /entries`
Получить список записей.

**Query параметры:**
- `type` (optional) - Тип записи: `situation`, `reflection`, `feedback`, `voice`, `import`
- `source` (optional) - Источник: `file`, `telegram`, `web`
- `limit` (optional) - Лимит записей (число)
- `offset` (optional) - Смещение для пагинации (число)

**Пример:**
```bash
GET /entries?type=situation&limit=10&offset=0
```

#### `GET /entries/:id`
Получить запись по ID.

#### `POST /entries`
Создать новую запись.

**Body:**
```json
{
  "type": "situation",
  "source": "web",
  "text": "Описание ситуации...",
  "participants": ["Иван Иванов"],
  "tags": ["управление", "команда"]
}
```

#### `PATCH /entries/:id`
Обновить запись.

#### `DELETE /entries/:id`
Удалить запись.

### Sessions (Сессии анализа)

#### `GET /sessions`
Получить список сессий.

**Query параметры:**
- `status` (optional) - Статус: `pending`, `analyzing`, `done`, `error`
- `limit` (optional) - Лимит записей
- `offset` (optional) - Смещение для пагинации

#### `GET /sessions/:id`
Получить сессию по ID.

#### `GET /sessions/entry/:entryId`
Получить сессию по ID записи.

#### `POST /sessions/:id/analyze`
Запустить анализ для сессии.

### Quests (Квесты)

#### `GET /quests`
Получить список квестов.

**Query параметры:**
- `status` (optional) - Статус: `active`, `backlog`, `done`, `archived`

#### `GET /quests/:id`
Получить квест по ID.

#### `POST /quests`
Создать новый квест.

#### `PATCH /quests/:id`
Обновить квест.

### Evidence (Доказательства)

#### `GET /evidence`
Получить список доказательств.

**Query параметры:**
- `quest_id` (optional) - ID квеста
- `ability_node_id` (optional) - ID узла способности

#### `GET /evidence/:id`
Получить доказательство по ID.

#### `POST /evidence`
Создать новое доказательство.

### Tree (Дерево способностей)

#### `GET /tree/semantic`
Получить семантическое дерево способностей.

#### `GET /tree/layout`
Получить layout дерево для визуализации.

#### `POST /tree/apply-change`
Применить изменение к дереву.

#### `POST /tree/undo-change`
Откатить изменение дерева.

### Sync (Синхронизация)

#### `POST /sync/process-file`
Обработать markdown файл и создать записи.

## Rate Limiting

API защищен rate limiting:
- **Лимит:** 100 запросов в минуту на IP адрес
- **Окно:** 60 секунд

При превышении лимита возвращается статус `429 Too Many Requests`.

## Коды ответов

- `200` - Успешный запрос
- `201` - Ресурс создан
- `400` - Неверный запрос (валидация не прошла)
- `404` - Ресурс не найден
- `429` - Превышен лимит запросов
- `500` - Внутренняя ошибка сервера

## Примеры использования

### cURL

```bash
# Получить список записей
curl http://localhost:3001/entries

# Создать запись
curl -X POST http://localhost:3001/entries \
  -H "Content-Type: application/json" \
  -d '{
    "type": "situation",
    "source": "web",
    "text": "Тестовая ситуация"
  }'

# С API ключом
curl http://localhost:3001/entries \
  -H "X-API-Key: your-api-key-here"
```

### JavaScript/TypeScript

```typescript
// Получить записи
const response = await fetch('http://localhost:3001/entries');
const data = await response.json();

// Создать запись
const response = await fetch('http://localhost:3001/entries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key-here', // опционально
  },
  body: JSON.stringify({
    type: 'situation',
    source: 'web',
    text: 'Описание ситуации...',
  }),
});
```

## Дополнительная информация

- Все endpoints возвращают JSON
- Даты в формате ISO 8601
- UUID используются для идентификаторов
- Пагинация поддерживается через `limit` и `offset`
- Валидация входных данных через class-validator

---

**Для полной документации используйте Swagger UI:** `http://localhost:3001/api/docs`

