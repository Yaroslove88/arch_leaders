# Аутентификация

## Обзор

API поддерживает JWT (JSON Web Token) аутентификацию. Аутентификация опциональна - если `JWT_SECRET` не установлен, API доступен без аутентификации.

## Настройка

### Переменные окружения

Добавьте в `.env`:

```env
# JWT настройки
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Опциональный API ключ для простой аутентификации
API_KEY=your-api-key-here
```

**Важно:** 
- Используйте сильный секретный ключ в production
- Никогда не коммитьте `JWT_SECRET` в git
- Генерируйте случайный ключ: `openssl rand -base64 32`

## Использование

### 1. Получение токена

#### Через API ключ

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key-here"
  }'
```

**Ответ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Использование токена

Добавьте токен в заголовок `Authorization`:

```bash
curl http://localhost:3001/entries \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. JavaScript/TypeScript

```typescript
// Получение токена
const loginResponse = await fetch('http://localhost:3001/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ apiKey: 'your-api-key' }),
});
const { access_token } = await loginResponse.json();

// Использование токена
const response = await fetch('http://localhost:3001/entries', {
  headers: {
    'Authorization': `Bearer ${access_token}`,
  },
});
```

## Публичные endpoints

Некоторые endpoints помечены как публичные и не требуют аутентификации:

- `GET /health` - проверка здоровья API
- `POST /auth/login` - аутентификация

Для пометки endpoint как публичного используйте декоратор `@Public()`:

```typescript
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Get('public-endpoint')
async publicEndpoint() {
  return { message: 'This is public' };
}
```

## Защита endpoints

### Автоматическая защита (глобально)

Чтобы включить глобальную защиту всех endpoints, раскомментируйте в `app.module.ts`:

```typescript
{
  provide: APP_GUARD,
  useClass: JwtAuthGuard,
},
```

### Защита отдельных endpoints

Используйте `@UseGuards(JwtAuthGuard)`:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Get('protected')
async protectedEndpoint() {
  return { message: 'This requires authentication' };
}
```

## Структура JWT токена

Токен содержит:

```json
{
  "sub": "user-id",
  "role": "api",
  "iat": 1234567890,
  "exp": 1234567890
}
```

- `sub` - идентификатор пользователя
- `role` - роль пользователя
- `iat` - время создания
- `exp` - время истечения

## Безопасность

1. **Храните токены безопасно:**
   - Не храните в localStorage для production (используйте httpOnly cookies)
   - Используйте HTTPS в production
   - Устанавливайте короткое время жизни токенов

2. **Ротация ключей:**
   - Регулярно меняйте `JWT_SECRET`
   - При смене ключа все существующие токены станут недействительными

3. **Rate limiting:**
   - Endpoint `/auth/login` защищен rate limiting
   - Максимум 100 запросов в минуту

## Расширение

В будущем можно добавить:

- Email/password аутентификацию
- Refresh tokens
- Роли и права доступа (RBAC)
- OAuth интеграцию
- 2FA (двухфакторная аутентификация)

---

**Для полной документации API используйте Swagger UI:** `http://localhost:3001/api/docs`

