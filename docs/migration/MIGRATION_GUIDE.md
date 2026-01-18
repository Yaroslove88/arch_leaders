# Руководство по миграции: Разделение структуры, контента и пользовательских данных

**Дата создания:** 2025-01-27  
**Этап:** Этап 3 - Миграция Nodes

---

## Обзор

Это руководство описывает процесс миграции от смешанной архитектуры к разделению структуры, контента и пользовательских данных.

## Подготовка

### 1. Создание резервных копий

Перед началом миграции обязательно создайте резервные копии:

```bash
# Резервная копия БД
pg_dump -U postgres -d leadership_architect > backup_before_migration.sql

# Резервная копия seed файла
cp packages/shared/src/seed/initial-ability-tree.json backups/initial-ability-tree-backup.json

# Резервная копия node-descriptions.json
cp data/node-descriptions.json backups/node-descriptions-backup.json
```

### 2. Проверка текущего состояния

Убедитесь, что:
- ✅ БД доступна и работает
- ✅ seed файл содержит актуальные данные
- ✅ node-descriptions.json существует и содержит контент

## Процесс миграции

### Шаг 1: Извлечение структуры (безопасно, не изменяет БД)

```bash
# Запуск скрипта для извлечения структуры
npx ts-node scripts/extract-structure-from-tree.ts
```

**Что делает:**
- Читает TreeSemantic.data из БД
- Создает резервную копию
- Извлекает только структуру (удаляет name, description, state, xp_current)
- Сохраняет результат в файл для проверки
- **НЕ изменяет БД**

**Результат:**
- Файл `backups/tree-structure-only.json` со структурой

### Шаг 2: Миграция контента

```bash
# Запуск скрипта для миграции контента
npx ts-node scripts/migrate-tree-separation.ts
```

**Что делает:**
- Читает TreeSemantic.data из БД
- Создает резервную копию
- Извлекает структуру (удаляет контент и пользовательские данные)
- Мигрирует контент в node-descriptions.json (если его там нет)
- Сохраняет структуру в файл для проверки
- **НЕ изменяет БД автоматически**

**Результат:**
- Обновленный `data/node-descriptions.json` (если был добавлен контент)
- Файл `backups/tree-structure-only-migrated.json` со структурой
- Резервные копии в `backups/`

### Шаг 3: Проверка результатов

Проверьте созданные файлы:

1. **backups/tree-structure-only-migrated.json**
   - Должен содержать только структуру (node_id, branch_id, tier, prerequisites, unlock_conditions, xp_required)
   - НЕ должен содержать name, description, state, xp_current

2. **data/node-descriptions.json**
   - Должен содержать контент для всех узлов
   - Должен иметь поле `name` для каждого узла

3. **backups/tree-semantic-backup-*.json**
   - Должна быть резервная копия исходных данных

### Шаг 4: Применение изменений к БД

**⚠️ ВНИМАНИЕ:** Этот шаг перезапишет TreeSemantic.data только структурой. Пользовательские данные останутся в UserAbilityState.

После проверки файлов, раскомментируйте код в `scripts/migrate-tree-separation.ts` для применения изменений к БД:

```typescript
// Раскомментируйте этот код после проверки:
await prisma.treeSemantic.update({
  where: { id: 'tree_main' },
  data: {
    data: structureOnly as any,
  },
});
console.log('   ✅ TreeSemantic.data обновлен в БД');
```

Или выполните вручную через SQL/Prisma:

```typescript
// Пример обновления через Prisma Studio или скрипт
const structureOnly = JSON.parse(fs.readFileSync('backups/tree-structure-only-migrated.json', 'utf-8'));
await prisma.treeSemantic.update({
  where: { id: 'tree_main' },
  data: {
    data: structureOnly,
  },
});
```

### Шаг 5: Обновление seed файла

После успешной миграции БД, обновите seed файл, чтобы он содержал только структуру:

```bash
# Копируем структуру в seed файл
cp backups/tree-structure-only-migrated.json packages/shared/src/seed/initial-ability-tree.json

# Убедитесь, что файл валидный JSON
npx jsonlint packages/shared/src/seed/initial-ability-tree.json
```

### Шаг 6: Обновление tree.service.ts

Обновите `tree.service.ts` для загрузки структуры и контента отдельно:

1. Добавьте методы `loadStructure()`, `loadContent()`, `mergeData()`
2. Обновите `getSemantic()` для использования новых методов
3. Сохраните обратную совместимость с флагом `USE_SEPARATED_DATA`

### Шаг 7: Тестирование

После миграции протестируйте:

1. **Загрузка дерева:**
   ```bash
   curl http://localhost:3000/api/tree/semantic?userId=test-user-id
   ```
   - Должно возвращать дерево с контентом и пользовательскими данными

2. **Проверка контента:**
   ```bash
   curl http://localhost:3000/api/nodes/descriptions
   ```
   - Должен возвращать весь контент из node-descriptions.json

3. **Проверка пользовательских данных:**
   - Проверьте, что состояние узлов (state, xp_current) загружается из UserAbilityState
   - Проверьте, что контент (name, description) загружается из node-descriptions.json
   - Проверьте, что структура (node_id, branch_id, tier) загружается из TreeSemantic.data

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

## Проверка целостности данных

После миграции проверьте:

1. **Структура:**
   - Все узлы имеют node_id, branch_id, tier, prerequisites, unlock_conditions, xp_required
   - Нет полей name, description, state, xp_current в TreeSemantic.data

2. **Контент:**
   - Все узлы имеют контент в node-descriptions.json
   - Поле name заполнено для всех узлов

3. **Пользовательские данные:**
   - Пользовательские данные остались в UserAbilityState
   - Не потеряны при миграции

## Следующие шаги

После успешной миграции Nodes:

1. **Этап 4:** Миграция Quests (разделение базовых и пользовательских квестов)
2. **Этап 5:** Экспорт пользовательских данных
3. **Этап 6:** Защита от перезаписи (middleware/guard)

---

**См. также:**
- [FULL_ARCHITECTURE_AUDIT.md](../audit/FULL_ARCHITECTURE_AUDIT.md) - Полный аудит
- [ARCHITECTURE_RULES.md](../audit/ARCHITECTURE_RULES.md) - Правила архитектуры
- [ARCHITECTURE_SINGLE_SOURCE_OF_TRUTH.md](../ARCHITECTURE_SINGLE_SOURCE_OF_TRUTH.md) - Правильная архитектура
