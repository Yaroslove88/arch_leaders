# Scripts

Утилиты и скрипты для разработки и администрирования проекта.

## Структура

```
scripts/
├── migrations/      # Миграции БД и данных
├── admin/           # Админские утилиты (пользователи, права)
├── content/         # Работа с контентом (кейсы, квесты)
├── dev/             # Dev-утилиты (проверки качества, порты)
├── tree/            # Работа с деревом способностей
└── utils/           # Общие утилиты
```

## Часто используемые скрипты

### Миграции

```bash
# Миграция структуры дерева
pnpm tsx scripts/migrate-tree-separation.ts

# Миграция системы опыта
pnpm migrate:experience
```

### Администрирование

```bash
# Создание админ-пользователя
pnpm tsx scripts/create-admin-user.ts

# Проверка пользователей
pnpm tsx scripts/check-users.ts
```

### Контент

```bash
# Конвертация кейсов
pnpm convert:cases

# Проверка кейсов
pnpm verify:cases
```

### Разработка

```bash
# Проверка качества кода
pnpm check:quality

# Проверка портов
node scripts/check-ports.js
```

### Дерево способностей

```bash
# Проверка и исправление дерева
pnpm tsx scripts/check-and-fix-tree.ts

# Верификация дерева
pnpm tsx scripts/verify-tree.ts
```

## Запуск скриптов

Используйте `tsx` для TypeScript скриптов (быстрее чем ts-node):

```bash
# Из корня проекта
pnpm tsx scripts/имя-скрипта.ts

# Или через npm script если добавлен в package.json
pnpm имя-скрипта
```

## Устаревшие скрипты

Скрипты, которые больше не используются, помечены комментарием `// @deprecated` или находятся в процессе миграции в подпапки.
