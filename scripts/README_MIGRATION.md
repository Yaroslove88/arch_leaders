# Скрипты миграции: Разделение структуры, контента и пользовательских данных

## Обзор

Эти скрипты используются для миграции от смешанной архитектуры к разделению структуры, контента и пользовательских данных.

## Скрипты

### 1. extract-structure-from-tree.ts

**Назначение:** Извлекает только структуру из TreeSemantic.data (не изменяет БД)

**Использование:**
```bash
npx ts-node scripts/extract-structure-from-tree.ts
```

**Что делает:**
- Читает TreeSemantic.data из БД
- Создает резервную копию в `backups/tree-semantic-backup-*.json`
- Извлекает только структуру (удаляет name, description, state, xp_current)
- Сохраняет результат в `backups/tree-structure-only.json`
- **НЕ изменяет БД** (безопасный скрипт для проверки)

**Результат:**
- Резервная копия: `backups/tree-semantic-backup-*.json`
- Структура: `backups/tree-structure-only.json`

### 2. migrate-tree-separation.ts

**Назначение:** Полная миграция структуры и контента

**Использование:**
```bash
npx ts-node scripts/migrate-tree-separation.ts
```

**Что делает:**
- Читает TreeSemantic.data из БД
- Создает резервные копии (TreeSemantic.data и node-descriptions.json)
- Извлекает только структуру (удаляет контент и пользовательские данные)
- Мигрирует контент в node-descriptions.json (если его там нет)
- Сохраняет структуру в файл для проверки
- **НЕ изменяет БД автоматически** (требуется ручное подтверждение)

**Результат:**
- Резервная копия TreeSemantic.data: `backups/tree-semantic-backup-*.json`
- Резервная копия node-descriptions.json: `backups/node-descriptions-backup-*.json`
- Структура: `backups/tree-structure-only-migrated.json`
- Обновленный node-descriptions.json (если был добавлен контент)

**⚠️ ВНИМАНИЕ:** После проверки файлов раскомментируйте код для применения изменений к БД.

## Процесс миграции

### Шаг 1: Подготовка

```bash
# Создайте резервную копию БД
pg_dump -U postgres -d leadership_architect > backup_before_migration.sql

# Убедитесь, что директория backups существует
mkdir -p backups
```

### Шаг 2: Извлечение структуры (безопасно, не изменяет БД)

```bash
npx ts-node scripts/extract-structure-from-tree.ts
```

Проверьте файл `backups/tree-structure-only.json` - он должен содержать только структуру.

### Шаг 3: Миграция контента

```bash
npx ts-node scripts/migrate-tree-separation.ts
```

Проверьте:
- `backups/tree-structure-only-migrated.json` - только структура
- `data/node-descriptions.json` - контент для всех узлов
- Резервные копии созданы

### Шаг 4: Применение изменений к БД

**⚠️ ВНИМАНИЕ:** Только после проверки всех файлов!

Откройте `scripts/migrate-tree-separation.ts` и раскомментируйте код для обновления БД:

```typescript
await prisma.treeSemantic.update({
  where: { id: 'tree_main' },
  data: {
    data: structureOnly as any,
  },
});
console.log('   ✅ TreeSemantic.data обновлен в БД');
```

Затем запустите скрипт снова:

```bash
npx ts-node scripts/migrate-tree-separation.ts
```

### Шаг 5: Обновление seed файла

После успешной миграции БД, обновите seed файл:

```bash
# Скопируйте структуру в seed файл
cp backups/tree-structure-only-migrated.json packages/shared/src/seed/initial-ability-tree.json

# Проверьте валидность JSON
npx jsonlint packages/shared/src/seed/initial-ability-tree.json
```

## Проверка после миграции

1. **Структура:**
   ```bash
   # Проверьте, что TreeSemantic.data содержит только структуру
   # Должно быть: node_id, branch_id, tier, prerequisites, unlock_conditions, xp_required
   # НЕ должно быть: name, description, state, xp_current
   ```

2. **Контент:**
   ```bash
   # Проверьте, что node-descriptions.json содержит контент для всех узлов
   cat data/node-descriptions.json | jq '.node_descriptions | keys | length'
   ```

3. **Пользовательские данные:**
   ```bash
   # Проверьте, что UserAbilityState содержит пользовательские данные
   # Они не должны были измениться при миграции
   ```

## Откат изменений

Если что-то пошло не так:

```bash
# 1. Восстановите БД из резервной копии
psql -U postgres -d leadership_architect < backup_before_migration.sql

# 2. Восстановите seed файл
cp backups/initial-ability-tree-backup.json packages/shared/src/seed/initial-ability-tree.json

# 3. Восстановите node-descriptions.json
cp backups/node-descriptions-backup-*.json data/node-descriptions.json
```

## Устранение проблем

### Ошибка: "TreeSemantic.data не найдено в БД"

Убедитесь, что:
- БД доступна и работает
- Prisma подключена правильно
- Таблица tree_semantic существует

### Ошибка: "Failed to load node descriptions"

Убедитесь, что:
- Файл `data/node-descriptions.json` существует
- Файл содержит валидный JSON
- Права доступа к файлу правильные

### Ошибка при применении изменений к БД

Убедитесь, что:
- БД доступна
- Нет активных подключений к БД
- Резервная копия создана перед изменениями

## См. также

- [MIGRATION_GUIDE.md](../docs/migration/MIGRATION_GUIDE.md) - Полное руководство по миграции
- [ARCHITECTURE_RULES.md](../docs/audit/ARCHITECTURE_RULES.md) - Правила архитектуры
- [FULL_ARCHITECTURE_AUDIT.md](../docs/audit/FULL_ARCHITECTURE_AUDIT.md) - Полный аудит
