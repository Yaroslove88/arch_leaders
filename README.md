# Архитектор лидерства

Life-RPG система для развития лидерских способностей через архитектурное мышление.

## Структура проекта

Monorepo на базе Turborepo и pnpm:

- `apps/api` - Backend API (NestJS)
- `apps/web` - Frontend (Next.js)
- `packages/shared` - Общие типы и схемы
- `packages/ui` - UI компоненты и design tokens

## Быстрый старт

### Требования

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker и Docker Compose (для локальной БД)

### Установка

```bash
# Установка зависимостей
pnpm install

# Запуск PostgreSQL в Docker
docker-compose -f infra/docker-compose.dev.yml up -d

# Настройка базы данных
cd apps/api
pnpm prisma migrate dev
pnpm prisma generate

# Запуск в режиме разработки
pnpm dev
```

## Документация

- [План реализации](./docs/IMPLEMENTATION_PLAN.md) - детальный план разработки по фазам
- [Быстрый старт](./docs/QUICK_START.md) - шпаргалка для начала работы
- [Настройка](./SETUP.md) - инструкции по настройке окружения
- [Правила проекта](./PROJECT_RULES.md) - обязательные правила кодирования
- [Краткая справка правил](./README_RULES.md) - быстрая справка по правилам

### Исходные документы

- [Концепт игры](../Концепт%20игры%20-%20Архитектор%20лидерства%20-%20Базовая%20версия.md)
- [PRD](../PRD%20Проект%20«Архитектор%20лидерства».md)
- [Анализ переиспользования](../АНАЛИЗ_ПЕРЕИСПОЛЬЗОВАНИЯ_LIFE_RPG.md)

## Лицензия

Private

