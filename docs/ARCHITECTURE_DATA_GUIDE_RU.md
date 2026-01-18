---
title: Руководство по архитектуре данных
title_en: architecture-data-guide
type: reference
status: final
domain: leadership
created: 2026-01-13
modified: 2026-01-13
tags: [архитектура, данные, контент, миграция]
---

# Руководство по архитектуре данных Leadership Architect

## Принцип единого источника истины (SSOT)

Проект использует разделение данных на три категории:

| Категория | Где хранится | Что содержит |
|-----------|--------------|--------------|
| **Структура** | Seed файлы + БД | Связи, иерархия, условия разблокировки |
| **Контент** | JSON файлы в `data/` | Названия, описания, примеры |
| **Пользовательские данные** | Таблицы в БД | XP, прогресс, состояние узлов |

---

## Карта файлов данных

### 1. Структура (Seed файлы)

```
packages/shared/src/seed/
├── initial-ability-tree.json      # Основной seed: узлы, ветки, связи
└── initial-ability-tree-expanded.json  # Расширенная версия (не используется)
```

**`initial-ability-tree.json`** — единственный источник истины для структуры дерева:
- `nodes[]` — список узлов (node_id, branch_id, tier, prerequisites, xp_required)
- `branches[]` — список веток (branch_id, color, icon)
- `edges[]` — связи между узлами
- `tree_revision` — версия структуры

⚠️ **Важно:** Seed файл содержит ТОЛЬКО структуру. Контент (name, description) загружается из `data/node-descriptions.json`.

---

### 2. Контент (JSON файлы)

```
data/
├── node-descriptions.json       # Контент для узлов способностей
├── branch-descriptions.json     # Контент для веток
├── quest-templates.json         # Шаблоны квестов
├── interactive-cases.json       # Интерактивные кейсы
├── builds.json                  # Стили лидерства
├── quest-theories-mapping.json  # Маппинг теории для квестов
└── missing-cases.json           # Список недостающих кейсов
```

#### Подробное описание файлов:

| Файл | Назначение | Формат |
|------|------------|--------|
| `node-descriptions.json` | Названия, описания, примеры узлов | `{ "node_descriptions": { "node_id": { name, full_description, examples, ... } } }` |
| `branch-descriptions.json` | Названия и описания веток | `{ "branch_descriptions": { "branch_id": { name, description } } }` |
| `quest-templates.json` | Базовые квесты для новых пользователей | `{ "quest_templates": [ { title, description, steps, criteria, reward, ... } ] }` |
| `interactive-cases.json` | Кейсы с вариантами ответов | `{ "cases": [ { id, title, context, options, reflection, ... } ] }` |
| `builds.json` | Стили лидерства и их условия | `{ "builds": [ { id, name, description, conditions, ... } ] }` |

---

### 3. Пользовательские данные (БД)

```
Таблицы в PostgreSQL:
├── UserAbilityState    # Состояние узлов: state, xp_current, progress
├── Quest               # Квесты пользователя
├── CaseProgress        # Прогресс по кейсам
├── Entry               # Записи пользователя (ситуации, рефлексии)
├── Session             # Результаты анализа
└── Evidence            # Доказательства применения способностей
```

---

## Как данные объединяются в runtime

```
┌─────────────────────────────────┐
│         API запрос              │
│    GET /tree/semantic           │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  1. Загрузка структуры          │
│     из TreeSemantic.data        │
│     (только node_id, tier...)   │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  2. Загрузка контента           │
│     из node-descriptions.json   │
│     (name, description...)      │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  3. Загрузка пользовательских   │
│     данных из UserAbilityState  │
│     (state, xp_current...)      │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  4. Объединение в runtime       │
│     Возврат полного дерева      │
└─────────────────────────────────┘
```

---

## Инструкции по обновлению данных

### Изменение контента узлов

**Если нужно изменить название, описание или примеры для узла:**

1. Открыть файл `data/node-descriptions.json`
2. Найти узел по `node_id`
3. Изменить нужные поля:
   - `name` — название на русском
   - `full_description` — полное описание
   - `practical_meaning` — практический смысл
   - `examples` — примеры применения
   - `integration_levels` — уровни интеграции (Novice, Integrated, Embodied)
   - `reflection_prompts` — вопросы для рефлексии
4. Сохранить файл
5. Перезапустить API или вызвать `refreshContentCache()`

**Пример изменения:**
```json
{
  "node_descriptions": {
    "node_grounding_point": {
      "name": "Точка опоры",
      "full_description": "Внутренняя устойчивость...",
      "practical_meaning": "Способность сохранять...",
      "examples": ["Пример 1", "Пример 2"],
      "integration_levels": {
        "Novice": "Начинаю осознавать...",
        "Integrated": "Регулярно применяю...",
        "Embodied": "Это стало частью меня..."
      }
    }
  }
}
```

---

### Изменение контента веток

**Если нужно изменить название или описание ветки:**

1. Открыть файл `data/branch-descriptions.json`
2. Найти ветку по `branch_id`
3. Изменить нужные поля:
   - `name` — название ветки
   - `description` — описание
4. Сохранить файл
5. Перезапустить API

---

### Добавление/изменение квестов

**Если нужно изменить базовые квесты:**

1. Открыть файл `data/quest-templates.json`
2. Найти квест по `title` или добавить новый
3. Изменить нужные поля:
   - `title` — название
   - `description` — описание
   - `steps` — шаги выполнения
   - `criteria` — критерии успеха
   - `reward` — награда (XP)
   - `linked_nodes` — связанные узлы
4. Сохранить файл
5. Для новых пользователей квесты создадутся автоматически
6. Для существующих — запустить синхронизацию: `npx ts-node scripts/sync-quests-from-templates.py`

⚠️ **Важно:** Квесты с `source='user_generated'` не перезаписываются.

---

### Добавление/изменение кейсов

**Если нужно изменить интерактивные кейсы:**

1. Открыть файл `data/interactive-cases.json`
2. Найти кейс по `id` или добавить новый
3. Изменить нужные поля:
   - `title` — название
   - `context` — контекст ситуации
   - `options` — варианты ответов с последствиями
   - `reflection` — вопросы для рефлексии
   - `linked_nodes` — связанные узлы
4. Сохранить файл
5. Изменения применятся автоматически при следующем запросе

---

### Изменение структуры дерева

**Если нужно добавить/удалить узлы или изменить связи:**

⚠️ **Внимание:** Это критичная операция!

1. Создать резервную копию:
   ```bash
   cp packages/shared/src/seed/initial-ability-tree.json backups/
   ```

2. Открыть файл `packages/shared/src/seed/initial-ability-tree.json`

3. Изменить структуру:
   - `nodes[]` — добавить/удалить узлы
   - `branches[]` — добавить/удалить ветки
   - `edges[]` — изменить связи

4. Увеличить `tree_revision` на 1

5. Добавить контент для новых узлов в `data/node-descriptions.json`

6. Запустить миграцию:
   ```bash
   npx ts-node scripts/migrate-tree-separation.ts --apply
   ```

7. Проверить результат:
   ```bash
   npx ts-node scripts/test-migration-api.ts
   ```

---

## Проверка целостности данных

### Проверить структуру дерева
```bash
npx ts-node scripts/verify-tree.ts
```

### Проверить полноту контента
```bash
npx ts-node scripts/validate-content-completeness.ts
```

### Проверить миграцию
```bash
npx ts-node scripts/test-migration-api.ts
```

---

## Резервные копии

Резервные копии создаются автоматически при запуске скриптов миграции:

```
backups/
├── tree-semantic-backup-*.json       # Резервные копии БД
├── node-descriptions-backup-*.json   # Резервные копии контента
├── initial-ability-tree-backup-*.json # Резервные копии seed
└── tree-structure-only.json          # Последняя извлечённая структура
```

---

## Связанные документы

- [ARCHITECTURE_SINGLE_SOURCE_OF_TRUTH.md](./ARCHITECTURE_SINGLE_SOURCE_OF_TRUTH.md) — детали архитектуры SSOT
- [docs/audit/FULL_ARCHITECTURE_AUDIT.md](./audit/FULL_ARCHITECTURE_AUDIT.md) — полный аудит архитектуры
- [docs/migration/MIGRATION_GUIDE.md](./migration/MIGRATION_GUIDE.md) — руководство по миграции
- [scripts/README.md](../scripts/README.md) — описание скриптов
