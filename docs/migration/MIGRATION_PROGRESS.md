# Прогресс миграции: Разделение структуры, контента и пользовательских данных

**Дата обновления:** 2025-01-27  
**Этап:** Этап 3 - Миграция Nodes (в процессе)

---

## ✅ Выполнено

### Немедленные исправления

1. ✅ **Исправлены английские названия в seed файле (6 узлов)**
   - `node_shared_leadership`: "Shared Leadership" → "Распределённое лидерство"
   - `node_feedforward`: "Feedforward" → "Обратная связь в будущее"
   - `node_rede_model`: "REDE Model" → "Модель REDE"
   - `node_mirror_holder`: "Window Gazer vs Mirror Holder" → "Смотрящий в окно vs Держащий зеркало"
   - `node_vertical_development`: "Vertical Development" → "Вертикальное развитие"
   - `node_ddo`: "Deliberately Developmental Organization" → "Организация как тренажёр"

2. ✅ **Добавлена защита от перезаписи в sync-base-quests.ts**
   - Проверка поля `source` перед обновлением квестов
   - Обновляются только квесты с `source='base_template'`
   - Пользовательские квесты (`source='user_generated'` или `'auto_generated'`) не перезаписываются

3. ✅ **Добавлено предупреждение в tree.service.ts**
   - Предупреждение о критической проблеме при обновлении seed файла
   - Возможность отключения auto-sync через переменную окружения `DISABLE_TREE_AUTO_SYNC=true`

### Этап 1: Аудит и документация (завершен)

1. ✅ **Полный аудит архитектуры**
   - Документ: `docs/audit/FULL_ARCHITECTURE_AUDIT.md`
   - Выявлены все места хранения, перезаписи и смешивания данных
   - Найдены все проблемы и критические места

2. ✅ **Визуализация архитектуры**
   - Документ: `docs/audit/ARCHITECTURE_VISUALIZATION.md`
   - Диаграммы текущей и правильной архитектуры
   - Сравнение архитектур

3. ✅ **Правила архитектуры**
   - Документ: `docs/audit/ARCHITECTURE_RULES.md`
   - Четкие правила разделения ответственности
   - Правила обновления данных
   - Защита от перезаписи

### Этап 3: Миграция Nodes (в процессе)

1. ✅ **Созданы скрипты миграции**
   - `scripts/extract-structure-from-tree.ts` - Извлечение структуры (безопасно, не изменяет БД)
   - `scripts/migrate-tree-separation.ts` - Полная миграция структуры и контента
   - `scripts/update-seed-structure-only.ts` - Обновление seed файла (только структура)

2. ✅ **Обновлен tree.service.ts для разделения**
   - Добавлен метод `loadNodeContent()` - загрузка контента из node-descriptions.json
   - Добавлен метод `mergeStructureWithContent()` - объединение структуры и контента в runtime
   - Обновлен метод `enrichNodeWithContent()` - обогащение узла контентом
   - Обновлен метод `getSemantic()` - использует разделение структуры и контента
   - Все пути в `getSemantic()` теперь объединяют структуру и контент в runtime

3. ✅ **Создана документация**
   - `docs/migration/MIGRATION_GUIDE.md` - Полное руководство по миграции
   - `scripts/README_MIGRATION.md` - README для скриптов миграции

---

## ⏳ В процессе

### Обновление seed файла

**Скрипт готов:** `scripts/update-seed-structure-only.ts`

**Что делает:**
- Создает резервную копию seed файла
- Удаляет контент (name, description) из узлов и веток
- Удаляет пользовательские данные (state, xp_current)
- Оставляет только структуру (node_id, branch_id, tier, prerequisites, unlock_conditions, xp_required)
- Сохраняет результат в seed файл

**⚠️ ВНИМАНИЕ:** Скрипт изменяет seed файл. Создайте резервную копию перед запуском!

**Запуск:**
```bash
npx ts-node scripts/update-seed-structure-only.ts
```

---

## 📋 Следующие шаги

### 1. Миграция БД (выполнить миграцию структуры)

**Шаг 1:** Проверить скрипты миграции (безопасно, не изменяет БД)
```bash
# Извлечь структуру для проверки
npx ts-node scripts/extract-structure-from-tree.ts

# Проверить файл backups/tree-structure-only.json
# Убедиться, что содержит только структуру (нет name, description, state, xp_current)
```

**Шаг 2:** Выполнить полную миграцию (создает резервные копии, не изменяет БД без флага --apply)
```bash
# Миграция структуры и контента (без применения к БД)
npx ts-node scripts/migrate-tree-separation.ts

# Проверить файлы в backups/
# - backups/tree-semantic-backup-*.json - резервная копия БД
# - backups/tree-structure-only-migrated.json - структура для проверки
# - backups/node-descriptions-backup-*.json - резервная копия node-descriptions.json
# - data/node-descriptions.json - должен содержать контент для всех узлов
```

**Шаг 3:** Применить изменения к БД (после проверки файлов)
```bash
# Применить изменения к БД (транзакция)
npx ts-node scripts/migrate-tree-separation.ts --apply
```

**Шаг 4:** Обновить seed файл (после успешной миграции БД)
```bash
# Обновить seed файл только структурой
npx ts-node scripts/update-seed-structure-only.ts

# Проверить файл packages/shared/src/seed/initial-ability-tree.json
# Убедиться, что содержит только структуру
```

### 2. Тестирование миграции

**Проверка структуры:**
- ✅ TreeSemantic.data содержит только структуру (нет name, description, state, xp_current)
- ✅ node-descriptions.json содержит контент для всех узлов
- ✅ seed файл содержит только структуру

**Проверка загрузки данных:**
- ✅ API возвращает дерево с контентом из node-descriptions.json
- ✅ API возвращает дерево с пользовательскими данными из UserAbilityState
- ✅ Контент не перезаписывается при обновлении seed файла

**Проверка обновления:**
- ✅ Обновление seed файла не затрагивает контент
- ✅ Обновление контента не затрагивает структуру
- ✅ Обновление структуры не затрагивает пользовательские данные

### 3. Этап 4: Миграция Quests

После завершения миграции Nodes:
1. Разделить базовые и пользовательские квесты (использовать поле `source`)
2. Обновить `sync-base-quests.ts` для обновления только базовых квестов
3. Защитить пользовательские квесты от перезаписи

---

## 📝 Статус файлов

### Созданные/обновленные файлы

**Скрипты:**
- ✅ `scripts/extract-structure-from-tree.ts` - Извлечение структуры
- ✅ `scripts/migrate-tree-separation.ts` - Полная миграция (с флагом --apply)
- ✅ `scripts/update-seed-structure-only.ts` - Обновление seed файла

**Документация:**
- ✅ `docs/audit/FULL_ARCHITECTURE_AUDIT.md` - Полный аудит
- ✅ `docs/audit/ARCHITECTURE_VISUALIZATION.md` - Визуализация архитектуры
- ✅ `docs/audit/ARCHITECTURE_RULES.md` - Правила архитектуры
- ✅ `docs/migration/MIGRATION_GUIDE.md` - Руководство по миграции
- ✅ `scripts/README_MIGRATION.md` - README для скриптов
- ✅ `docs/migration/MIGRATION_PROGRESS.md` - Этот документ (прогресс)

**Код:**
- ✅ `apps/api/src/tree/tree.service.ts` - Обновлен для разделения структуры и контента
- ✅ `apps/api/src/scripts/sync-base-quests.ts` - Добавлена защита от перезаписи
- ✅ `packages/shared/src/seed/initial-ability-tree.json` - Исправлены английские названия

**Данные:**
- ⏳ `packages/shared/src/seed/initial-ability-tree.json` - Требует обновления (удалить контент)
- ⏳ `data/node-descriptions.json` - Требует проверки (убедиться, что содержит весь контент)
- ⏳ `TreeSemantic.data` в БД - Требует миграции (разделить структуру и контент)

---

## ⚠️ Важные замечания

### Перед миграцией БД

1. **Создайте резервную копию БД:**
   ```bash
   pg_dump -U postgres -d leadership_architect > backup_before_migration.sql
   ```

2. **Проверьте скрипты миграции:**
   - Запустите `extract-structure-from-tree.ts` для проверки
   - Проверьте файл `backups/tree-structure-only.json`
   - Убедитесь, что структура корректна

3. **Проверьте контент в node-descriptions.json:**
   - Убедитесь, что все узлы имеют контент
   - Проверьте, что все поля заполнены

### После миграции БД

1. **Обновите seed файл:**
   - Запустите `update-seed-structure-only.ts`
   - Проверьте, что seed файл содержит только структуру

2. **Проверьте работу API:**
   - Проверьте загрузку дерева через API
   - Убедитесь, что контент загружается из node-descriptions.json
   - Убедитесь, что пользовательские данные загружаются из UserAbilityState

3. **Проверьте обновление:**
   - Попробуйте обновить seed файл (увеличить tree_revision)
   - Убедитесь, что контент не перезаписывается
   - Убедитесь, что пользовательские данные не теряются

---

## 🎯 Критерии успешной миграции

1. ✅ **Структура разделена:**
   - TreeSemantic.data содержит только структуру (node_id, branch_id, tier, prerequisites, unlock_conditions, xp_required)
   - Нет полей name, description, state, xp_current в TreeSemantic.data

2. ✅ **Контент разделен:**
   - Контент хранится в node-descriptions.json
   - Контент не хранится в БД
   - Контент загружается в runtime при запросе

3. ✅ **Пользовательские данные разделены:**
   - Пользовательские данные хранятся только в UserAbilityState
   - Пользовательские данные не хранятся в TreeSemantic.data
   - Пользовательские данные не перезаписываются при обновлении seed файла

4. ✅ **Runtime объединение работает:**
   - API возвращает дерево с контентом из node-descriptions.json
   - API возвращает дерево с пользовательскими данными из UserAbilityState
   - Объединение происходит в runtime, не сохраняется в БД

5. ✅ **Защита от перезаписи:**
   - Обновление seed файла не затрагивает контент
   - Обновление контента не затрагивает структуру
   - Обновление структуры не затрагивает пользовательские данные

---

**См. также:**
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Полное руководство по миграции
- [FULL_ARCHITECTURE_AUDIT.md](../audit/FULL_ARCHITECTURE_AUDIT.md) - Полный аудит
- [ARCHITECTURE_RULES.md](../audit/ARCHITECTURE_RULES.md) - Правила архитектуры
