# Инфраструктура

## Docker Compose

Файл `docker-compose.dev.yml` содержит конфигурацию для локальной разработки:

- **PostgreSQL 15** на порту 5433 (по умолчанию)
- База данных: `leadership_architect` (настраивается через переменные окружения)
- Пользователь: `leadership_architect` (настраивается через переменные окружения)
- Пароль: **из переменной окружения** `POSTGRES_PASSWORD`

## Настройка переменных окружения

**Важно:** Перед запуском Docker Compose создайте `.env` файл в корне проекта (см. `.env.example`).

Минимальные переменные для Docker Compose:
```env
POSTGRES_USER=leadership_architect
POSTGRES_PASSWORD=your_strong_password_here
POSTGRES_DB=leadership_architect
POSTGRES_PORT=5433
```

## Запуск

```bash
# Из корня проекта (Docker Compose автоматически подхватит .env)
docker-compose -f infra/docker-compose.dev.yml up -d

# Или явно указать .env файл
docker-compose -f infra/docker-compose.dev.yml --env-file .env up -d
```

## Проверка статуса

```bash
docker ps | grep leadership-architect-postgres
```

## Остановка

```bash
docker-compose -f infra/docker-compose.dev.yml down
```

## Очистка данных

```bash
docker-compose -f infra/docker-compose.dev.yml down -v
```

⚠️ **Внимание:** Это удалит все данные из базы!

## Безопасность

- ✅ Пароли больше не хранятся в коде
- ✅ Используйте сильные пароли в `.env`
- ✅ Никогда не коммитьте `.env` в git (уже в `.gitignore`)
- ✅ В production используйте секреты из безопасного хранилища

