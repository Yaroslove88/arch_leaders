# Настройка проекта "Архитектор лидерства"

## Требования

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker и Docker Compose (для локальной БД PostgreSQL)

## Шаги установки

### 1. Установка зависимостей

```bash
pnpm install
```

### 2. Настройка базы данных

#### Запуск PostgreSQL в Docker (опционально)

Если вы используете локальную установку PostgreSQL (рекомендуется), этот шаг можно пропустить.

**Важно:** Перед запуском Docker Compose создайте `.env` файл (см. шаг 2 ниже), так как docker-compose использует переменные окружения из `.env`.

```bash
# Убедитесь, что .env файл создан (см. шаг 2)
docker-compose -f infra/docker-compose.dev.yml --env-file .env up -d
```

Или если `.env` находится в корне проекта, Docker Compose автоматически подхватит его:

```bash
docker-compose -f infra/docker-compose.dev.yml up -d
```

Проверка, что контейнер запущен:

```bash
docker ps | grep leadership-architect-postgres
```

**Примечание:** Если вы используете локальную установку PostgreSQL, убедитесь, что:
- PostgreSQL запущен как служба Windows
- Порт по умолчанию: 5432 (не 5433)
- База данных и пользователь созданы через pgAdmin4 или psql

#### Создание .env файла

**Важно:** Никогда не коммитьте `.env` файл в git! Он уже добавлен в `.gitignore`.

1. Скопируйте шаблон из `.env.example`:
   ```bash
   # Linux/Mac
   cp .env.example .env
   
   # Windows PowerShell
   Copy-Item .env.example .env
   ```

2. Откройте `.env` и заполните значения:
   ```env
   # Database - ОБЯЗАТЕЛЬНО измените пароль!
   DATABASE_URL="postgresql://leadership_architect:YOUR_STRONG_PASSWORD@localhost:5433/leadership_architect?schema=public"
   POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD
   
   # API
   PORT=3001
   NODE_ENV=development
   WEB_URL=http://localhost:3000
   
   # LLM (хотя бы один ключ рекомендуется)
   OPENAI_API_KEY=your_openai_key_here
   # или
   ANTHROPIC_API_KEY=your_anthropic_key_here
   
   # Telegram Bot (опционально)
   TELEGRAM_BOT_TOKEN=
   TELEGRAM_CHAT_ID=
   ```

3. **Для Docker Compose:** Убедитесь, что `POSTGRES_PASSWORD` в `.env` совпадает с паролем в `DATABASE_URL`.

### 3. Настройка Prisma

**Важно:** Используйте `pnpm prisma` или `npx prisma`, а не просто `prisma`

```bash
cd apps/api

# Сгенерировать Prisma Client
pnpm prisma generate
# или
pnpm prisma:generate

# Применить миграции
pnpm prisma migrate dev --name init
# или
pnpm prisma:migrate
# (введите имя миграции: init)
```

**Подробнее:** См. [PRISMA_SETUP.md](apps/api/PRISMA_SETUP.md)

### 4. Запуск в режиме разработки

Из корня проекта:

```bash
pnpm dev
```

Это запустит:
- API на http://localhost:3001
- Web приложение на http://localhost:3000

## Структура проекта

```
leadership-architect/
├── apps/
│   ├── api/          # Backend (NestJS)
│   └── web/          # Frontend (Next.js)
├── packages/
│   ├── shared/       # Общие типы и схемы
│   └── ui/           # UI компоненты
├── scripts/          # Утилиты и миграции
├── infra/            # Docker конфигурация
└── data/             # Данные (layouts, seed)
```

## Следующие шаги

1. Создать seed данные для дерева способностей
2. Настроить аналитический пайплайн (LLM)
3. Реализовать базовые модули API (entries, sessions, quests, tree)
4. Создать визуализацию дерева способностей

## Troubleshooting

### Порт 5432 уже занят

Если порт 5432 занят другим экземпляром PostgreSQL:

1. **Использовать другой порт в docker-compose** (если используете Docker):
   ```yaml
   ports:
     - "5433:5432"  # Используйте другой порт
   ```

2. **Или изменить порт в .env** (если используете локальную установку):
   ```env
   DATABASE_URL="postgresql://leadership_architect:YOUR_PASSWORD@localhost:5433/leadership_architect?schema=public"
   POSTGRES_PORT=5433
   ```

### Prisma не может подключиться к БД

Убедитесь, что:
1. Docker контейнер запущен: `docker ps`
2. Порт в `.env` соответствует порту в `docker-compose.dev.yml`
3. Учетные данные совпадают

