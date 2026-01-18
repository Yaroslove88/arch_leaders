# План тестирования миграции: Разделение структуры, контента и пользовательских данных

**Дата создания:** 2025-01-27  
**Этап:** Тестирование миграции (Этап 3)

---

## Цель тестирования

Проверить, что скрипты миграции работают корректно и безопасно:
1. Извлекают структуру из TreeSemantic.data (без изменения БД)
2. Мигрируют контент в node-descriptions.json (без изменения БД)
3. Обновляют tree.service.ts для использования разделения
4. Обновляют seed файл (только структура)

---

## Шаги тестирования

### Шаг 1: Подготовка к тестированию

**Проверка окружения:**
```bash
# 1. Убедиться, что БД запущена
# 2. Убедиться, что Prisma Client сгенерирован
pnpm prisma generate

# 3. Проверить, что переменные окружения настроены
# DATABASE_URL должна быть в .env файле

# 4. Убедиться, что зависимости установлены
pnpm install
```

**Создание резервных копий:**
```bash
# Создать резервную копию БД
pg_dump -U postgres -d leadership_architect > backup_before_test.sql

# Создать резервную копию seed файла
cp packages/shared/src/seed/initial-ability-tree.json backups/initial-ability-tree-backup-test.json

# Создать резервную копию node-descriptions.json (если существует)
cp data/node-descriptions.json backups/node-descriptions-backup-test.json
```

### Шаг 2: Тестирование скрипта извлечения структуры (безопасно, не изменяет БД)

**Команда:**
```bash
cd d:\gpt\Professional\leadership-architect
npx ts-node scripts/extract-structure-from-tree.ts
```

**Ожидаемый результат:**
- ✅ Скрипт успешно запускается
- ✅ Читает TreeSemantic.data из БД
- ✅ Создает резервную копию в `backups/tree-semantic-backup-*.json`
- ✅ Извлекает только структуру (удаляет name, description, state, xp_current)
- ✅ Сохраняет результат в `backups/tree-structure-only.json`
- ✅ **НЕ изменяет БД**

**Проверка результатов:**
1. Проверить файл `backups/tree-semantic-backup-*.json`:
   - Должен содержать полные данные из БД
   - Должен иметь поля name, description, state, xp_current (для проверки исходных данных)

2. Проверить файл `backups/tree-structure-only.json`:
   - Должен содержать только структуру (node_id, branch_id, tier, prerequisites, unlock_conditions, xp_required)
   - НЕ должен содержать name, description, state, xp_current

**Пример проверки:**
```bash
# Проверить, что структура содержит только нужные поля
cat backups/tree-structure-only.json | jq '.nodes[0] | keys'
# Должно быть: ["node_id", "branch_id", "tier", "prerequisites", "unlock_conditions", "xp_required"]
# НЕ должно быть: name, description, state, xp_current
```

### Шаг 3: Тестирование полной миграции (без флага --apply, не изменяет БД)

**Команда:**
```bash
cd d:\gpt\Professional\leadership-architect
npx ts-node scripts/migrate-tree-separation.ts
```

**Ожидаемый результат:**
- ✅ Скрипт успешно запускается
- ✅ Читает TreeSemantic.data из БД
- ✅ Создает резервные копии (TreeSemantic.data и node-descriptions.json)
- ✅ Извлекает только структуру
- ✅ Мигрирует контент в node-descriptions.json (если его там нет)
- ✅ Сохраняет результат в `backups/tree-structure-only-migrated.json`
- ✅ **НЕ изменяет БД** (без флага --apply)

**Проверка результатов:**
1. Проверить резервные копии:
   - `backups/tree-semantic-backup-*.json` - должна быть создана
   - `backups/node-descriptions-backup-*.json` - должна быть создана (если node-descriptions.json существовал)

2. Проверить структуру:
   - `backups/tree-structure-only-migrated.json` - должна содержать только структуру

3. Проверить контент:
   - `data/node-descriptions.json` - должен содержать контент для всех узлов
   - Проверить, что контент не дублируется (если уже был в node-descriptions.json)

**Пример проверки:**
```bash
# Проверить количество узлов с контентом
cat data/node-descriptions.json | jq '.node_descriptions | keys | length'

# Проверить структуру одного узла
cat data/node-descriptions.json | jq '.node_descriptions.node_grounding_point'
# Должно содержать: name, full_description, practical_meaning, examples, integration_levels
```

### Шаг 4: Тестирование обновления seed файла (безопасно, создает резервную копию)

**⚠️ ВНИМАНИЕ:** Этот скрипт изменяет seed файл! Создайте резервную копию перед запуском!

**Команда:**
```bash
cd d:\gpt\Professional\leadership-architect
npx ts-node scripts/update-seed-structure-only.ts
```

**Ожидаемый результат:**
- ✅ Скрипт успешно запускается
- ✅ Создает резервную копию seed файла в `backups/initial-ability-tree-backup-*.json`
- ✅ Читает seed файл
- ✅ Извлекает только структуру (удаляет name, description)
- ✅ Сохраняет результат для проверки в `backups/initial-ability-tree-structure-only.json`
- ✅ Обновляет seed файл только структурой
- ✅ Проверяет валидность структуры

**Проверка результатов:**
1. Проверить резервную копию:
   - `backups/initial-ability-tree-backup-*.json` - должна содержать исходный seed файл

2. Проверить обновленный seed файл:
   - `packages/shared/src/seed/initial-ability-tree.json` - должен содержать только структуру
   - НЕ должен содержать name, description в узлах и ветках

**Пример проверки:**
```bash
# Проверить, что seed файл содержит только структуру
cat packages/shared/src/seed/initial-ability-tree.json | jq '.nodes[0] | keys'
# Должно быть: ["node_id", "branch_id", "tier", "prerequisites", "unlock_conditions", "xp_required"]
# НЕ должно быть: name, description, state, xp_current

# Проверить валидность JSON
npx jsonlint packages/shared/src/seed/initial-ability-tree.json
```

### Шаг 5: Тестирование работы tree.service.ts

**Команда:**
```bash
# Запустить API в режиме разработки
cd d:\gpt\Professional\leadership-architect
pnpm dev
```

**Проверка через API:**
```bash
# Проверить загрузку дерева без userId (глобальное дерево)
curl http://localhost:3000/api/tree/semantic

# Проверить загрузку дерева с userId (с пользовательскими данными)
curl http://localhost:3000/api/tree/semantic?userId=test-user-id
```

**Ожидаемый результат:**
- ✅ API возвращает дерево с контентом из node-descriptions.json
- ✅ API возвращает дерево с пользовательскими данными из UserAbilityState
- ✅ Контент (name, description) загружается из node-descriptions.json, а не из TreeSemantic.data
- ✅ Пользовательские данные (state, xp_current) загружаются из UserAbilityState
- ✅ Структура (node_id, branch_id, tier) загружается из TreeSemantic.data

**Проверка в логах:**
- Проверить логи API на наличие сообщений о загрузке контента:
  - `✅ Loaded X node descriptions into cache`
  - `🔧 Enriching tree with UserAbilityState for userId=...`

### Шаг 6: Проверка целостности данных после миграции

**Проверка структуры:**
```bash
# Проверить, что TreeSemantic.data содержит только структуру
# (После применения миграции с флагом --apply)
psql -U postgres -d leadership_architect -c "SELECT jsonb_pretty(data->'nodes'->0) FROM tree_semantic WHERE id='tree_main' LIMIT 1;"
```

**Ожидаемый результат:**
- ✅ TreeSemantic.data содержит только структуру (node_id, branch_id, tier, prerequisites, unlock_conditions, xp_required)
- ✅ НЕ содержит name, description, state, xp_current

**Проверка контента:**
```bash
# Проверить, что node-descriptions.json содержит контент для всех узлов
cat data/node-descriptions.json | jq '.node_descriptions | keys | length'
# Должно быть >= количество узлов в seed файле
```

**Проверка пользовательских данных:**
```bash
# Проверить, что UserAbilityState содержит пользовательские данные
psql -U postgres -d leadership_architect -c "SELECT COUNT(*) FROM user_ability_state;"
# Должно быть > 0 (если есть пользователи)
```

---

## Критерии успешного тестирования

### ✅ Успешное извлечение структуры

- [ ] Скрипт `extract-structure-from-tree.ts` успешно выполняется
- [ ] Резервная копия TreeSemantic.data создана
- [ ] Структура извлечена корректно (только нужные поля)
- [ ] Файл `backups/tree-structure-only.json` содержит валидную структуру

### ✅ Успешная миграция контента

- [ ] Скрипт `migrate-tree-separation.ts` успешно выполняется (без флага --apply)
- [ ] Резервные копии созданы
- [ ] Контент мигрирован в node-descriptions.json
- [ ] Структура сохранена в `backups/tree-structure-only-migrated.json`
- [ ] БД не изменена (без флага --apply)

### ✅ Успешное обновление seed файла

- [ ] Скрипт `update-seed-structure-only.ts` успешно выполняется
- [ ] Резервная копия seed файла создана
- [ ] Seed файл обновлен только структурой
- [ ] Структура валидна (валидный JSON)
- [ ] Seed файл не содержит контента (name, description)

### ✅ Успешная работа tree.service.ts

- [ ] API возвращает дерево с контентом из node-descriptions.json
- [ ] API возвращает дерево с пользовательскими данными из UserAbilityState
- [ ] Контент загружается из node-descriptions.json (кэш работает)
- [ ] Пользовательские данные обогащаются из UserAbilityState
- [ ] Структура загружается из TreeSemantic.data

### ✅ Целостность данных

- [ ] TreeSemantic.data содержит только структуру (после применения миграции)
- [ ] node-descriptions.json содержит контент для всех узлов
- [ ] UserAbilityState содержит пользовательские данные
- [ ] Нет дублирования данных между источниками
- [ ] Объединение данных работает корректно в runtime

---

## Проблемы и их решение

### Проблема 1: Скрипт не запускается

**Симптом:** `Error: Cannot find module '@prisma/client'`

**Решение:**
```bash
# Установить зависимости
pnpm install

# Сгенерировать Prisma Client
pnpm prisma generate
```

### Проблема 2: Ошибка подключения к БД

**Симптом:** `Error: P1001: Can't reach database server`

**Решение:**
```bash
# Проверить, что БД запущена
docker-compose -f infra/docker-compose.dev.yml ps

# Запустить БД, если не запущена
docker-compose -f infra/docker-compose.dev.yml up -d

# Проверить DATABASE_URL в .env файле
```

### Проблема 3: TreeSemantic.data не найдено в БД

**Симптом:** `TreeSemantic.data не найдено в БД`

**Решение:**
```bash
# Создать дерево из seed файла (если его нет)
npx ts-node scripts/create-tree-semantic.ts

# Или проверить, что seed файл существует
ls packages/shared/src/seed/initial-ability-tree.json
```

### Проблема 4: Контент не мигрируется в node-descriptions.json

**Симптом:** Контент не добавляется в node-descriptions.json

**Решение:**
- Проверить, что контент есть в TreeSemantic.data (в резервной копии)
- Проверить, что node-descriptions.json существует и доступен для записи
- Проверить права доступа к файлу

### Проблема 5: API возвращает английские названия

**Симптом:** API возвращает name на английском, хотя в node-descriptions.json есть русские названия

**Решение:**
- Проверить, что node-descriptions.json содержит русские названия
- Проверить, что кэш контента загружается (`✅ Loaded X node descriptions into cache`)
- Принудительно обновить кэш: перезапустить API
- Проверить, что метод `mergeStructureWithContent()` вызывается

---

## Откат изменений (если что-то пошло не так)

### Откат БД

```bash
# Восстановить БД из резервной копии
psql -U postgres -d leadership_architect < backup_before_test.sql
```

### Откат seed файла

```bash
# Восстановить seed файл из резервной копии
cp backups/initial-ability-tree-backup-test.json packages/shared/src/seed/initial-ability-tree.json
```

### Откат node-descriptions.json

```bash
# Восстановить node-descriptions.json из резервной копии
cp backups/node-descriptions-backup-test-*.json data/node-descriptions.json
```

---

## Следующие шаги после успешного тестирования

1. ✅ Убедиться, что все тесты пройдены
2. ⏳ Применить миграцию к БД (с флагом --apply)
3. ⏳ Обновить seed файл (если еще не обновлен)
4. ⏳ Протестировать работу API с новой архитектурой
5. ⏳ Проверить, что обновление seed файла не затрагивает контент и пользовательские данные

---

**См. также:**
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Полное руководство по миграции
- [MIGRATION_PROGRESS.md](./MIGRATION_PROGRESS.md) - Прогресс миграции
- [README_MIGRATION.md](../../scripts/README_MIGRATION.md) - README для скриптов
