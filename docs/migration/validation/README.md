# Генерация MD-документов для валидации данных

**Дата создания:** 2025-01-27  
**Скрипт:** `scripts/generate-validation-docs.ts`

---

## Описание

Скрипт `generate-validation-docs.ts` извлекает структуру и данные по каждой сущности (Nodes, Branches, Edges) из БД и `node-descriptions.json`, и генерирует отдельные MD-файлы для валидации.

## Использование

### Предварительные требования

1. **База данных должна быть запущена:**
   ```bash
   docker-compose -f infra/docker-compose.dev.yml up -d
   ```

2. **Prisma Client должен быть сгенерирован:**
   ```bash
   cd apps/api
   pnpm prisma:generate
   cd ../..
   ```

3. **Переменные окружения настроены:**
   - `.env` файл с `DATABASE_URL`

### Запуск скрипта

```bash
cd d:\gpt\Professional\leadership-architect
npx ts-node scripts/generate-validation-docs.ts
```

### Выходные файлы

Скрипт создает следующие MD-файлы в директории `docs/migration/validation/`:

1. **00_SUMMARY.md** - Общая сводка со статистикой
2. **01_NODES_STRUCTURE.md** - Структура узлов (только структурные поля)
3. **02_NODES_CONTENT.md** - Контент узлов (только контентные поля из node-descriptions.json)
4. **03_NODES_FULL.md** - Полные данные узлов (структура + контент)
5. **04_BRANCHES_STRUCTURE.md** - Структура веток (только структурные поля)
6. **05_BRANCHES_CONTENT.md** - Контент веток (только контентные поля)
7. **06_BRANCHES_FULL.md** - Полные данные веток (структура + контент + связанные узлы)
8. **07_EDGES.md** - Связи между узлами (если есть)

## Структура данных

### Структура (Structure)

- **Определение**: Неизменяемая база, определяющая топологию дерева
- **Поля**: `node_id`, `branch_id`, `tier`, `prerequisites`, `unlock_conditions`, `xp_required`
- **Источник**: `initial-ability-tree.json` → `TreeSemantic.data` (БД)

### Контент (Content)

- **Определение**: Переводимые, изменяемые текстовые данные
- **Поля**: `name`, `description`, `full_description`, `practical_meaning`, `examples`, `integration_levels`, `reflection_prompts`
- **Источник**: `node-descriptions.json`

### Пользовательские данные (User Data)

- **Определение**: Уникальные для каждого пользователя данные
- **Поля**: `state`, `xp_current`, `progress`, `relevance`
- **Источник**: `UserAbilityState` (БД)
- **Примечание**: Не включаются в документы валидации (не являются частью базовых данных)

## Использование документов

Эти документы предназначены для:
- ✅ Валидации структуры данных
- ✅ Проверки полноты контента
- ✅ Выявления дублирования данных
- ✅ Проверки согласованности между структурой и контентом
- ✅ Анализа покрытия узлов контентом

## Пример использования

```bash
# 1. Убедитесь, что БД запущена
docker-compose -f infra/docker-compose.dev.yml ps

# 2. Запустите скрипт
npx ts-node scripts/generate-validation-docs.ts

# 3. Проверьте созданные файлы
ls docs/migration/validation/
```

## Результат

После успешного выполнения скрипта вы увидите:

```
📋 Генерация MD-документов для валидации данных...

1️⃣  Загрузка данных из БД...
   ✅ Загружено: X узлов, Y веток

2️⃣  Загрузка контента из node-descriptions.json...
   ✅ Загружено: Z узлов с контентом

3️⃣  Создание директории для документов...
   ✅ Директория создана: docs/migration/validation

4️⃣  Генерация MD-документов...
   ✅ Создан: 00_SUMMARY.md
   ✅ Создан: 01_NODES_STRUCTURE.md
   ✅ Создан: 02_NODES_CONTENT.md
   ✅ Создан: 03_NODES_FULL.md
   ✅ Создан: 04_BRANCHES_STRUCTURE.md
   ✅ Создан: 05_BRANCHES_CONTENT.md
   ✅ Создан: 06_BRANCHES_FULL.md
   ✅ Создан: 07_EDGES.md

✅ Все MD-документы успешно созданы!

📁 Расположение: docs/migration/validation
```

## Устранение проблем

### Ошибка: "TreeSemantic.data не найдено в БД"

**Решение:**
- Убедитесь, что БД запущена
- Проверьте, что данные инициализированы (запустите API или скрипт инициализации)

### Ошибка: "Cannot find module '@prisma/client'"

**Решение:**
```bash
cd apps/api
pnpm prisma:generate
cd ../..
```

### Ошибка: "Can't reach database server"

**Решение:**
```bash
# Проверить, что БД запущена
docker-compose -f infra/docker-compose.dev.yml ps

# Запустить БД, если не запущена
docker-compose -f infra/docker-compose.dev.yml up -d
```

---

**См. также:**
- [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) - Руководство по миграции
- [ARCHITECTURE_RULES.md](../../audit/ARCHITECTURE_RULES.md) - Правила архитектуры
