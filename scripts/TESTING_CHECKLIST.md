# Чеклист тестирования миграции

**Дата создания:** 2025-01-27  
**Этап:** Тестирование миграции (Этап 3)

---

## Быстрый чеклист

### Шаг 1: Подготовка

- [ ] БД запущена (`docker-compose -f infra/docker-compose.dev.yml up -d`)
- [ ] Prisma Client сгенерирован (`cd apps/api && pnpm prisma:generate`)
- [ ] Переменные окружения настроены (`.env` файл с `DATABASE_URL`)
- [ ] Зависимости установлены (`pnpm install`)

### Шаг 2: Резервные копии

- [ ] Резервная копия БД создана
- [ ] Резервная копия seed файла создана
- [ ] Резервная копия node-descriptions.json создана (если существует)

### Шаг 3: Тест 1 - Извлечение структуры (безопасно)

**Команда:**
```bash
cd d:\gpt\Professional\leadership-architect
npx ts-node scripts/extract-structure-from-tree.ts
```

**Проверка:**
- [ ] Скрипт успешно выполнен
- [ ] Резервная копия создана: `backups/tree-semantic-backup-*.json`
- [ ] Структура сохранена: `backups/tree-structure-only.json`
- [ ] Структура содержит только нужные поля (node_id, branch_id, tier, prerequisites, unlock_conditions, xp_required)
- [ ] Структура НЕ содержит name, description, state, xp_current
- [ ] БД не изменена

**Верификация:**
```bash
# Проверить структуру одного узла
cat backups/tree-structure-only.json | jq '.nodes[0] | keys'
# Должно быть: ["node_id", "branch_id", "tier", "prerequisites", "unlock_conditions", "xp_required"]
# НЕ должно быть: name, description, state, xp_current
```

### Шаг 4: Тест 2 - Полная миграция (без флага --apply, безопасно)

**Команда:**
```bash
cd d:\gpt\Professional\leadership-architect
npx ts-node scripts/migrate-tree-separation.ts
```

**Проверка:**
- [ ] Скрипт успешно выполнен
- [ ] Резервные копии созданы:
  - [ ] `backups/tree-semantic-backup-*.json`
  - [ ] `backups/node-descriptions-backup-*.json` (если node-descriptions.json существовал)
- [ ] Структура сохранена: `backups/tree-structure-only-migrated.json`
- [ ] Контент мигрирован в `data/node-descriptions.json`
- [ ] Количество узлов с контентом >= количество узлов в seed файле
- [ ] БД не изменена (без флага --apply)

**Верификация:**
```bash
# Проверить количество узлов с контентом
cat data/node-descriptions.json | jq '.node_descriptions | keys | length'

# Проверить структуру контента одного узла
cat data/node-descriptions.json | jq '.node_descriptions.node_grounding_point'
# Должно содержать: name, full_description, practical_meaning, examples, integration_levels
```

### Шаг 5: Тест 3 - Обновление seed файла (изменяет файл, но создает резервную копию)

**⚠️ ВНИМАНИЕ:** Этот скрипт изменяет seed файл! Создайте резервную копию перед запуском!

**Команда:**
```bash
cd d:\gpt\Professional\leadership-architect
npx ts-node scripts/update-seed-structure-only.ts
```

**Проверка:**
- [ ] Скрипт успешно выполнен
- [ ] Резервная копия создана: `backups/initial-ability-tree-backup-*.json`
- [ ] Структура сохранена для проверки: `backups/initial-ability-tree-structure-only.json`
- [ ] Seed файл обновлен: `packages/shared/src/seed/initial-ability-tree.json`
- [ ] Seed файл содержит только структуру (нет name, description)
- [ ] JSON валиден

**Верификация:**
```bash
# Проверить структуру одного узла в seed файле
cat packages/shared/src/seed/initial-ability-tree.json | jq '.nodes[0] | keys'
# Должно быть: ["node_id", "branch_id", "tier", "prerequisites", "unlock_conditions", "xp_required"]
# НЕ должно быть: name, description, state, xp_current

# Проверить валидность JSON
npx jsonlint packages/shared/src/seed/initial-ability-tree.json
```

### Шаг 6: Тест 4 - Проверка работы tree.service.ts

**Команда:**
```bash
# Запустить API в режиме разработки
cd d:\gpt\Professional\leadership-architect
pnpm dev
```

**Проверка через API:**
```bash
# В другом терминале или через браузер
curl http://localhost:3000/api/tree/semantic
# или
curl http://localhost:3000/api/tree/semantic?userId=test-user-id
```

**Ожидаемый результат:**
- [ ] API возвращает дерево с контентом из node-descriptions.json
- [ ] API возвращает дерево с пользовательскими данными из UserAbilityState (если userId указан)
- [ ] Контент (name, description) загружается из node-descriptions.json
- [ ] Пользовательские данные (state, xp_current) загружаются из UserAbilityState
- [ ] Структура (node_id, branch_id, tier) загружается из TreeSemantic.data

**Проверка в логах:**
- [ ] Логи содержат: `✅ Loaded X node descriptions into cache`
- [ ] Логи содержат: `🔧 Enriching tree with UserAbilityState for userId=...` (если userId указан)

### Шаг 7: Применение миграции к БД (после проверки всех файлов)

**⚠️ ВНИМАНИЕ:** Только после успешного прохождения всех предыдущих тестов!

**Команда:**
```bash
cd d:\gpt\Professional\leadership-architect
npx ts-node scripts/migrate-tree-separation.ts --apply
```

**Проверка:**
- [ ] Скрипт успешно выполнен
- [ ] Транзакция успешно завершена
- [ ] TreeSemantic.data обновлено только структурой
- [ ] Пользовательские данные не затронуты (проверить UserAbilityState)

**Верификация:**
```bash
# Проверить структуру TreeSemantic.data в БД
psql -U postgres -d leadership_architect -c "SELECT jsonb_pretty(data->'nodes'->0) FROM tree_semantic WHERE id='tree_main' LIMIT 1;"
# Должно содержать только структуру (node_id, branch_id, tier, prerequisites, unlock_conditions, xp_required)
# НЕ должно содержать name, description, state, xp_current
```

---

## Критерии успешного тестирования

### ✅ Все тесты пройдены

- [x] Скрипт извлечения структуры работает корректно
- [x] Скрипт миграции работает корректно (без флага --apply)
- [x] Скрипт обновления seed файла работает корректно
- [x] API возвращает данные с правильной структурой
- [x] Контент загружается из node-descriptions.json
- [x] Пользовательские данные загружаются из UserAbilityState
- [x] Структура загружается из TreeSemantic.data

### ⚠️ Проблемы, требующие исправления

- [ ] Ошибки при выполнении скриптов
- [ ] Невалидные данные в резервных копиях
- [ ] Контент не мигрируется в node-descriptions.json
- [ ] API возвращает неправильные данные
- [ ] Дублирование данных между источниками

---

## Откат изменений (если что-то пошло не так)

### Откат БД

```bash
psql -U postgres -d leadership_architect < backup_before_test.sql
```

### Откат seed файла

```bash
cp backups/initial-ability-tree-backup-*.json packages/shared/src/seed/initial-ability-tree.json
```

### Откат node-descriptions.json

```bash
cp backups/node-descriptions-backup-*.json data/node-descriptions.json
```

---

**См. также:**
- [TESTING_PLAN.md](../docs/migration/TESTING_PLAN.md) - Полный план тестирования
- [MIGRATION_GUIDE.md](../docs/migration/MIGRATION_GUIDE.md) - Руководство по миграции
- [README_MIGRATION.md](./README_MIGRATION.md) - README для скриптов
