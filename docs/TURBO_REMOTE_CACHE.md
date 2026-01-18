# Настройка Turbo Remote Cache

Remote cache позволяет переиспользовать результаты сборки между разными машинами и CI/CD.

## Вариант 1: Vercel Remote Cache (рекомендуется)

Бесплатный для личного использования.

### Настройка

```bash
# 1. Авторизация в Vercel
pnpm turbo login

# 2. Привязка проекта
pnpm turbo link

# 3. Готово! Теперь кэш будет автоматически синхронизироваться
```

### Проверка работы

```bash
# Очистить локальный кэш и запустить сборку
pnpm turbo run build --force

# Повторная сборка должна использовать remote cache
pnpm turbo run build
# Должно показать: ">>> FULL TURBO" или "cache hit"
```

## Вариант 2: Self-hosted Cache

Если нужен полный контроль над данными.

### Используя ducktape/turborepo-remote-cache

```bash
# 1. Запустить сервер кэша (Docker)
docker run -d \
  -p 3333:3333 \
  -v turbo-cache:/cache \
  ducktape/turborepo-remote-cache

# 2. Создать .turbo/config.json
```

Создайте файл `.turbo/config.json`:

```json
{
  "teamId": "team_leadership_architect",
  "apiUrl": "http://localhost:3333"
}
```

### Для production

Используйте S3/MinIO backend:

```bash
docker run -d \
  -p 3333:3333 \
  -e STORAGE_PROVIDER=s3 \
  -e S3_ACCESS_KEY=your-key \
  -e S3_SECRET_KEY=your-secret \
  -e S3_BUCKET=turbo-cache \
  -e S3_REGION=us-east-1 \
  ducktape/turborepo-remote-cache
```

## Переменные окружения

Для CI/CD добавьте:

```bash
# Vercel
TURBO_TOKEN=your-vercel-token
TURBO_TEAM=your-team-slug

# Self-hosted
TURBO_API=https://your-cache-server.com
TURBO_TOKEN=your-api-token
TURBO_TEAM=team_leadership_architect
```

## Отключение remote cache

Если нужно временно отключить:

```bash
# Использовать только локальный кэш
pnpm turbo run build --remote-only=false

# Полностью отключить кэш
pnpm turbo run build --no-cache
```
