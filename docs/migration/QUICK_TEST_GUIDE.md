# Краткое руководство по тестированию миграции

**Дата создания:** 2025-01-27  
**Этап:** Тестирование миграции (Этап 3)

---

## Быстрый старт

### Подготовка

1. **Убедитесь, что БД запущена:**
   ```bash
   docker-compose -f infra/docker-compose.dev.yml up -d
   ```

2. **Убедитесь, что Prisma Client сгенерирован:**
   ```bash
   cd apps/api
   pnpm prisma:generate
   cd ../..
   ```

3. **Убедитесь, что зависимости установлены:**
   ```bash
   pnpm install
   ```

4. **Создайте резервную копию БД:**
   ```bash
   pg_dump -U postgres -d leadership_architect > backup_before_migration_test.sql
   ```

---

## Тест 1: Извлечение структуры (безопасно, не изменяет БД)

**Команда:**
```bash
cd d:\gpt\Professional\leadership-architect
npx ts-node scripts/extract-structure-from-tree.ts
```

**Что проверить:**
- ✅ Скрипт выполнился без ошибок
- ✅ Создана резервная копия: `backups/tree-semantic-backup-*.json`
- ✅ Создан файл структуры: `backups/tree-structure-only.json`
- ✅ Структура содержит только нужные поля (node_id, branch_id, tier, prerequisites, unlock_conditions, xp_required)
- ✅ Структура НЕ содержит name, description, state, xp_current

**Проверка результата:**
```bash
# Проверить структуру одного узла
cat backups/tree-structure-only.json | jq '.nodes[0] | keys'
```

**Ожидаемый результат:** 
Должно быть только: `["node_id", "branch_id", "tier", "prerequisites", "unlock_conditions", "xp_required"]`

---

## Тест 2: Полная миграция (без флага --apply, безопасно)

**Команда:**
```bash
cd d:\gpt\Professional\leadership-architect
npx ts-node scripts/migrate-tree-separation.ts
```

**Что проверить:**
- ✅ Скрипт выполнился без ошибок
- ✅ Созданы резервные копии:
  - `backups/tree-semantic-backup-*.json`
  - `backups/node-descriptions-backup-*.json` (если node-descriptions.json существовал)
- ✅ Создан файл структуры: `backups/tree-structure-only-migrated.json`
- ✅ Контент мигрирован в `data/node-descriptions.json`
- ✅ Количество узлов с контентом >= количество узлов в seed файле
- ✅ БД не изменена (без флага --apply)

**Проверка результата:**
```bash
# Проверить количество узлов с контентом
cat data/node-descriptions.json | jq '.node_descriptions | keys | length'

# Проверить структуру контента одного узла
cat data/node-descriptions.json | jq '.node_descriptions.node_grounding_point'
```

**Ожидаемый результат:**
- Должно быть контент для всех узлов (минимум столько же, сколько узлов в seed файле)
- Контент должен содержать: name, full_description, practical_meaning, examples, integration_levels

---

## Тест 3: Обновление seed файла (изменяет файл, но создает резервную копию)

**⚠️ ВНИМАНИЕ:** Этот скрипт изменяет seed файл! Создайте резервную копию перед запуском!

**Резервная копия:**
```bash
cp packages/shared/src/seed/initial-ability-tree.json backups/initial-ability-tree-backup-manual.json
```

**Команда:**
```bash
cd d:\gpt\Professional\leadership-architect
npx ts-node scripts/update-seed-structure-only.ts
```

**Что проверить:**
- ✅ Скрипт выполнился без ошибок
- ✅ Создана резервная копия: `backups/initial-ability-tree-backup-*.json`
- ✅ Seed файл обновлен: `packages/shared/src/seed/initial-ability-tree.json`
- ✅ Seed файл содержит только структуру (нет name, description)
- ✅ JSON валиден

**Проверка результата:**
```bash
# Проверить структуру одного узла в seed файле
cat packages/shared/src/seed/initial-ability-tree.json | jq '.nodes[0] | keys'

# Проверить валидность JSON
npx jsonlint packages/shared/src/seed/initial-ability-tree.json
```

**Ожидаемый результат:**
- Должно быть только: `["node_id", "branch_id", "tier", "prerequisites", "unlock_conditions", "xp_required"]`
- НЕ должно быть: name, description, state, xp_current

---

## Тест 4: Проверка работы tree.service.ts

**Команда:**
```bash
# Запустить API в режиме разработки
cd d:\gpt\Professional\leadership-architect
pnpm dev
```

**Проверка через API (в другом терминале или через браузер):**
```bash
# Проверить загрузку дерева без userId (глобальное дерево)
curl http://localhost:3000/api/tree/semantic

# Проверить загрузку дерева с userId (с пользовательскими данными)
curl http://localhost:3000/api/tree/semantic?userId=test-user-id
```

**Что проверить:**
- ✅ API возвращает дерево с контентом из node-descriptions.json (name, description на русском)
- ✅ API возвращает дерево с пользовательскими данными из UserAbilityState (если userId указан)
- ✅ Контент (name, description) загружается из node-descriptions.json, а не из TreeSemantic.data
- ✅ Пользовательские данные (state, xp_current) загружаются из UserAbilityState
- ✅ Структура (node_id, branch_id, tier) загружается из TreeSemantic.data

**Проверка в логах API:**
- Должно быть: `✅ Loaded X node descriptions into cache`
- Должно быть: `🔧 Enriching tree with UserAbilityState for userId=...` (если userId указан)

---

## Применение миграции к БД (после успешного тестирования)

**⚠️ ВНИМАНИЕ:** Только после успешного прохождения всех предыдущих тестов!

**Команда:**
```bash
cd d:\gpt\Professional\leadership-architect
npx ts-node scripts/migrate-tree-separation.ts --apply
```

**Что проверить:**
- ✅ Скрипт выполнился без ошибок
- ✅ Транзакция успешно завершена
- ✅ TreeSemantic.data обновлено только структурой
- ✅ Пользовательские данные не затронуты (проверить UserAbilityState)

**Проверка результата:**
```bash
# Проверить структуру TreeSemantic.data в БД
psql -U postgres -d leadership_architect -c "SELECT jsonb_pretty(data->'nodes'->0) FROM tree_semantic WHERE id='tree_main' LIMIT 1;"
```

**Ожидаемый результат:**
- Должно содержать только структуру (node_id, branch_id, tier, prerequisites, unlock_conditions, xp_required)
- НЕ должно содержать name, description, state, xp_current

---

## Устранение проблем

### Проблема: "Cannot find module '@prisma/client'"

**Решение:**
```bash
cd apps/api
pnpm prisma:generate
cd ../..
```

### Проблема: "Can't reach database server"

**Решение:**
```bash
# Проверить, что БД запущена
docker-compose -f infra/docker-compose.dev.yml ps

# Запустить БД, если не запущена
docker-compose -f infra/docker-compose.dev.yml up -d
```

### Проблема: "TreeSemantic.data не найдено в БД"

**Решение:**
```bash
# Проверить, что есть данные в БД
psql -U postgres -d leadership_architect -c "SELECT id FROM tree_semantic LIMIT 1;"

# Если нет, создать дерево из seed файла (через API или вручную)
```

---

## Откат изменений

Если что-то пошло не так:

```bash
# Откат БД
psql -U postgres -d leadership_architect < backup_before_migration_test.sql

# Откат seed файла
cp backups/initial-ability-tree-backup-*.json packages/shared/src/seed/initial-ability-tree.json

# Откат node-descriptions.json
cp backups/node-descriptions-backup-*.json data/node-descriptions.json
```

---

**См. также:**
- [TESTING_PLAN.md](./TESTING_PLAN.md) - Полный план тестирования
- [TESTING_CHECKLIST.md](../scripts/TESTING_CHECKLIST.md) - Чеклист тестирования
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Полное руководство по миграции
