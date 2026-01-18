# Система аутентификации и мультитенантность

## Обзор

В проект добавлена полноценная система аутентификации с поддержкой:
- Регистрации пользователей через Telegram username и пароль
- Логина через Telegram username и пароль
- Ролей (admin, user)
- Мультитенантности (каждый пользователь видит только свои данные)

## Что было реализовано

### 1. Модель User в базе данных

Добавлена модель `User` в Prisma схему:
- `id` - UUID
- `telegramUsername` - уникальный Telegram username (без @)
- `password` - хэшированный пароль (bcrypt)
- `role` - роль пользователя (admin, user)
- `created_at`, `updated_at` - временные метки

### 2. Мультитенантность

Все модели обновлены для поддержки мультитенантности:
- `Entry` - добавлено поле `userId`
- `Session` - добавлено поле `userId`
- `Quest` - добавлено поле `userId`
- `Evidence` - добавлено поле `userId`
- `TreeSemantic` - добавлено поле `userId` (каждый пользователь имеет свое дерево)
- `TreeLayout` - добавлено поле `userId`
- `ChangeLog` - добавлено поле `userId`

### 3. Аутентификация

#### Регистрация
```bash
POST /auth/register
Content-Type: application/json

{
  "telegramUsername": "username",
  "password": "SecurePassword123!"
}
```

**Ответ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "telegramUsername": "username",
    "role": "user"
  }
}
```

#### Логин
```bash
POST /auth/login
Content-Type: application/json

{
  "telegramUsername": "username",
  "password": "SecurePassword123!"
}
```

**Ответ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "telegramUsername": "username",
    "role": "user"
  }
}
```

### 4. Использование токена

Добавьте токен в заголовок `Authorization`:
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Декораторы и Guards

#### Декоратор `@CurrentUser()`
Получение текущего пользователя из токена:
```typescript
@Get('profile')
async getProfile(@CurrentUser() user: JwtPayload) {
  // user.sub - ID пользователя
  // user.telegramUsername - Telegram username
  // user.role - роль пользователя
}
```

#### Декоратор `@Roles('admin')`
Ограничение доступа по ролям:
```typescript
@Get('admin-only')
@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
async adminOnly() {
  // Доступно только админам
}
```

### 6. Обновленные сервисы

Сервисы обновлены для фильтрации данных по `userId`:
- `EntriesService` - все методы принимают `userId`
- Остальные сервисы требуют обновления (см. TODO ниже)

## Установка и настройка

### 1. Установка зависимостей

```bash
cd apps/api
pnpm install
```

### 2. Создание миграции

```bash
cd apps/api
pnpm prisma:migrate
```

Это создаст миграцию для:
- Таблицы `users`
- Добавления `userId` во все существующие таблицы

**Важно:** Если в базе уже есть данные, миграция может потребовать ручной настройки для существующих записей.

### 3. Генерация Prisma Client

```bash
cd apps/api
pnpm prisma:generate
```

### 4. Создание админской учетки

```bash
# Из корня проекта
pnpm tsx scripts/create-admin.ts <telegramUsername> <password>

# Пример:
pnpm tsx scripts/create-admin.ts admin MySecurePassword123!
```

Скрипт:
- Создает нового админа, если пользователя не существует
- Обновляет существующего пользователя до админа, если он уже есть
- Предлагает обновить пароль, если админ уже существует

## Использование

### Регистрация нового пользователя

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "telegramUsername": "newuser",
    "password": "SecurePassword123!"
  }'
```

### Логин

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "telegramUsername": "newuser",
    "password": "SecurePassword123!"
  }'
```

### Использование токена

```bash
curl http://localhost:3001/entries \
  -H "Authorization: Bearer <ваш_токен>"
```

## TODO: Что еще нужно сделать

### 1. Обновить остальные сервисы

Следующие сервисы требуют обновления для поддержки `userId`:
- `SessionsService` - добавить фильтрацию по `userId`
- `QuestsService` - добавить фильтрацию по `userId`
- `EvidenceService` - добавить фильтрацию по `userId`
- `TreeService` - обновить для работы с пользовательскими деревьями
- `SyncService` - обновить для создания записей с `userId`

### 2. Обновить контроллеры

Все контроллеры должны использовать `@CurrentUser()` декоратор:
```typescript
@Get()
async getAll(@CurrentUser() user: JwtPayload) {
  return this.service.getAll(user.sub);
}
```

### 3. Миграция существующих данных

Если в базе уже есть данные без `userId`, нужно:
1. Создать скрипт миграции для присвоения существующих записей пользователю
2. Или создать дефолтного пользователя и привязать все записи к нему

### 4. Включить глобальную защиту

В `app.module.ts` раскомментируйте:
```typescript
{
  provide: APP_GUARD,
  useClass: JwtAuthGuard,
},
```

Это включит защиту всех endpoints по умолчанию (кроме помеченных `@Public()`).

## Безопасность

1. **Пароли:** Хранятся в хэшированном виде (bcrypt, 10 раундов)
2. **Токены:** JWT с настраиваемым временем жизни (по умолчанию 7 дней)
3. **Валидация:** Все входные данные валидируются через DTO
4. **Роли:** Проверка ролей через `RolesGuard`

## Примеры использования в коде

### Защищенный endpoint

```typescript
@Controller('entries')
export class EntriesController {
  @Get()
  async getAll(@CurrentUser() user: JwtPayload) {
    // user.sub содержит ID пользователя
    return this.entriesService.getAll(user.sub);
  }
}
```

### Админский endpoint

```typescript
@Controller('admin')
export class AdminController {
  @Get('users')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAllUsers() {
    // Доступно только админам
    return this.userService.getAll();
  }
}
```

## Примечания

- Legacy поддержка API ключей сохранена для обратной совместимости
- Telegram username должен содержать только буквы, цифры и подчеркивания
- Пароль должен быть минимум 8 символов
- Каждый пользователь имеет свое дерево способностей (`TreeSemantic`)

