# Полный архитектурный аудит: Единый источник истины

**Дата создания:** 2025-01-27  
**Статус:** Этап 1 - Аудит и документация

---

## Резюме

**Критическая проблема:** Система нарушает принцип единого источника истины (SSOT), смешивая структуру, контент и пользовательские данные в одних и тех же местах хранения. Это приводит к:
- Перезаписи переведенного контента английскими названиями из seed файлов
- Потере пользовательских данных при обновлении seed
- Дублированию данных в разных местах
- Невозможности безопасно обновлять структуру или контент

---

## 1. Все места хранения данных

### 1.1. Структура дерева способностей (Nodes)

#### 1.1.1. Seed файл
- **Путь:** `packages/shared/src/seed/initial-ability-tree.json`
- **Содержит:** 
  - ✅ Структуру: `node_id`, `branch_id`, `tier`, `prerequisites`, `unlock_conditions`, `xp_required`
  - ❌ **ПРОБЛЕМА:** Также содержит контент: `name`, `description` (английские названия)
- **Используется:**
  - При первом запуске для заполнения БД (`tree.service.ts:90-145`)
  - При обновлении `tree_revision` для синхронизации с БД (`tree.service.ts:307-334`)
  - При создании нового пользователя
- **Проблема:** Если здесь английские названия, они перезапишут русские в БД

#### 1.1.2. TreeSemantic.data (JSON поле в БД)
- **Таблица:** `tree_semantic` (Prisma: `TreeSemantic`)
- **Поле:** `data` (JSON)
- **Содержит:** 
  - ❌ **ПРОБЛЕМА:** Полное семантическое дерево со ВСЕМ:
    - Структура (node_id, branch_id, tier, prerequisites)
    - Контент (name, description) - смешано!
    - Пользовательские данные (state, xp_current) - смешано!
- **Обновляется из:** seed файла при `seedRevision > dbRevision` (`tree.service.ts:307-334`)
- **Критическая проблема:** При обновлении seed файла система **полностью перезаписывает** это поле, теряя:
  - Русские переводы (перезаписываются английскими)
  - Пользовательские данные (state, xp_current)

#### 1.1.3. AbilityNode (таблица в БД)
- **Таблица:** `ability_nodes` (Prisma: `AbilityNode`)
- **Поля:** `id`, `title`, `description`, `branch`, `level`, `prerequisites`
- **Заполняется из:** seed файла при первом запуске (`tree.service.ts:90-145`)
- **Используется:** Для быстрого доступа к базовым данным узлов
- **Проблема:** Заполняется только при первом запуске, но может быть перезаписана

#### 1.1.4. node-descriptions.json (детальные описания)
- **Путь:** `data/node-descriptions.json`
- **Содержит:** Детальные описания узлов
  - `name` (русское название)
  - `full_description`, `practical_meaning`, `examples`
  - `integration_levels`
  - `reflection_prompts`
- **Используется:** 
  - API endpoint `/nodes/descriptions` (`nodes.service.ts`)
  - Фронтенд для отображения детальной информации
- **✅ ХОРОШО:** Отдельный файл, не перезаписывается автоматически

#### 1.1.5. node-translations.ts (переводы на фронтенде)
- **Путь:** `apps/web/src/lib/node-translations.ts`
- **Содержит:** Статический маппинг `node_id -> русское название`
- **Используется:** Фронтенд как fallback, если API возвращает английские названия
- **✅ ХОРОШО:** Не перезаписывается автоматически, но требует ручного обновления

### 1.2. Квесты (Quests)

#### 1.2.1. quest-templates.json (базовые шаблоны)
- **Путь:** `data/quest-templates.json`
- **Содержит:** Шаблоны квестов (title, description, steps, criteria, reward, linked_nodes)
- **Используется:** 
  - При создании пользователя (`user-initialization.service.ts:68-149`)
  - При синхронизации базовых квестов (`sync-base-quests.ts`)

#### 1.2.2. Quest (таблица в БД)
- **Таблица:** `quests` (Prisma: `Quest`)
- **Поля:** `id`, `userId`, `title`, `description`, `type`, `status`, `steps_json`, `criteria_json`, `reward_json`, `linked_nodes`, `source`, `tags`
- **Содержит:**
  - ✅ Базовые квесты (source='base_template')
  - ✅ Автоматически сгенерированные квесты (source='auto_generated')
  - ✅ Пользовательские квесты (source='user_generated' или null)
- **Проблема:** `sync-base-quests.ts` обновляет квесты по `title`, что может перезаписать пользовательские квесты, если у них совпадает title

### 1.3. Кейсы (Cases)

#### 1.3.1. interactive-cases.json
- **Путь:** `data/interactive-cases.json`
- **Содержит:** Интерактивные кейсы (context, options, reflection, indicators)
- **Используется:** API для загрузки кейсов (`cases.service.ts`)
- **✅ ХОРОШО:** Отдельный файл, не перезаписывается автоматически

#### 1.3.2. CaseProgress (таблица в БД)
- **Таблица:** `case_progress` (Prisma: `CaseProgress`)
- **Поля:** `id`, `userId`, `case_id`, `selected_option`, `completed_at`, `reflection_text`
- **Содержит:** Только пользовательские данные (прогресс по кейсам)
- **✅ ХОРОШО:** Правильно разделено - контент в JSON, прогресс в БД

### 1.4. Стили лидерства (Builds)

#### 1.4.1. builds.json
- **Путь:** `data/builds.json`
- **Содержит:** Стили лидерства (builds)
- **Используется:** API для загрузки стилей
- **✅ ХОРОШО:** Отдельный файл, не перезаписывается автоматически

### 1.5. Пользовательские данные

#### 1.5.1. UserAbilityState (таблица в БД)
- **Таблица:** `user_ability_state` (Prisma: `UserAbilityState`)
- **Поля:** `id`, `userId`, `node_id`, `state`, `xp_current`, `progress`, `relevance`
- **Содержит:** Только пользовательские данные (прогресс по узлам)
- **✅ ХОРОШО:** Правильно разделено, но проблема в том, что эти данные также хранятся в `TreeSemantic.data`

#### 1.5.2. Entry (таблица в БД)
- **Таблица:** `entries` (Prisma: `Entry`)
- **Содержит:** Пользовательские записи (ситуации, рефлексии, обратная связь)
- **✅ ХОРОШО:** Правильно разделено

#### 1.5.3. Session (таблица в БД)
- **Таблица:** `sessions` (Prisma: `Session`)
- **Содержит:** Результаты анализа записей пользователя
- **✅ ХОРОШО:** Правильно разделено

#### 1.5.4. Evidence (таблица в БД)
- **Таблица:** `evidence` (Prisma: `Evidence`)
- **Содержит:** Доказательства применения способностей
- **✅ ХОРОШО:** Правильно разделено

---

## 2. Все места перезаписи данных

### 2.1. Критические места перезаписи

#### 2.1.1. `tree.service.ts:307-334` - Обновление TreeSemantic из seed
```typescript
// ❌ ПРОБЛЕМА: Перезаписывает ВСЕ данные
if (seedRevision > dbRevision) {
  await this.prisma.treeSemantic.upsert({
    update: {
      data: normalizedSeedData as any,  // ⚠️ ПЕРЕЗАПИСЫВАЕТ ВСЕ ДАННЫЕ
    },
  });
}
```
**Что перезаписывается:**
- Структура (правильно)
- Контент (name, description) - ❌ ПРОБЛЕМА: перезаписывает русские переводы английскими
- Пользовательские данные (state, xp_current) - ❌ ПРОБЛЕМА: теряются!

#### 2.1.2. `tree.service.ts:236-270` - Создание дерева пользователя из seed
```typescript
// ❌ ПРОБЛЕМА: Создает из seed со всем контентом
if (userId) {
  const seedData = JSON.parse(content) as SemanticTree;
  await this.prisma.treeSemantic.create({
    data: {
      data: seedData as any,  // ⚠️ СОЗДАЕТ ИЗ SEED С КОНТЕНТОМ
    },
  });
}
```

#### 2.1.3. `tree.service.ts:90-145` - Заполнение AbilityNode из seed
```typescript
// ❌ ПРОБЛЕМА: Заполняет из seed с английскими названиями
async onModuleInit(): Promise<void> {
  await this.ensureAbilityNodesSeeded();  // ⚠️ ЗАПОЛНЯЕТ ИЗ SEED
}
```

#### 2.1.4. `sync-base-quests.ts:44-66` - Обновление квестов по title
```typescript
// ❌ ПРОБЛЕМА: Обновляет по title, может перезаписать пользовательские квесты
const existing = await prisma.quest.findFirst({
  where: { title: title }
});

if (existing) {
  // Обновляем существующий
  await prisma.quest.update({
    where: { id: existing.id },
    data: questData  // ⚠️ МОЖЕТ ПЕРЕЗАПИСАТЬ ПОЛЬЗОВАТЕЛЬСКИЙ КВЕСТ
  });
}
```
**Проблема:** Если пользователь создал квест с таким же title, как базовый шаблон, он будет перезаписан.

### 2.2. Места, где НЕ должно быть перезаписи (но есть риск)

#### 2.2.1. `user-initialization.service.ts:102-107` - Создание базовых квестов
```typescript
// ✅ ХОРОШО: Проверяет существование перед созданием
const existing = await this.prisma.quest.findFirst({
  where: {
    userId,
    title: template.title,
  },
});

if (!existing) {
  // Создает только если не существует
}
```
**✅ ХОРОШО:** Не перезаписывает существующие квесты

---

## 3. Все места смешивания типов данных

### 3.1. TreeSemantic.data - КРИТИЧЕСКАЯ ПРОБЛЕМА

**Текущая структура:**
```json
{
  "nodes": [
    {
      "node_id": "node_grounding_point",
      "branch_id": "branch_subjectivity",
      "tier": "basic",
      "prerequisites": [],
      "unlock_conditions": {...},
      "xp_required": 100,
      // ❌ СТРУКТУРА + КОНТЕНТ + ПОЛЬЗОВАТЕЛЬСКИЕ ДАННЫЕ СМЕШАНЫ:
      "name": "Точка опоры",  // КОНТЕНТ
      "description": "...",   // КОНТЕНТ
      "state": "available",   // ПОЛЬЗОВАТЕЛЬСКИЕ ДАННЫЕ
      "xp_current": 50        // ПОЛЬЗОВАТЕЛЬСКИЕ ДАННЫЕ
    }
  ]
}
```

**Проблемы:**
1. Структура (node_id, branch_id, tier) смешана с контентом (name, description)
2. Контент смешан с пользовательскими данными (state, xp_current)
3. При обновлении seed файла теряются и контент, и пользовательские данные

### 3.2. AbilityNode - дублирование контента

**Проблема:** Контент (title, description) дублируется в:
- `TreeSemantic.data` (JSON)
- `AbilityNode` (таблица)
- `node-descriptions.json` (файл)

**Результат:** Нет единого источника истины для контента.

### 3.3. Quest - смешивание базовых и пользовательских квестов

**Проблема:** В одной таблице `Quest` хранятся:
- Базовые квесты (из `quest-templates.json`)
- Автоматически сгенерированные квесты (из анализа записей)
- Пользовательские квесты (созданные вручную)

**Результат:** `sync-base-quests.ts` может перезаписать пользовательские квесты, если у них совпадает title.

---

## 4. Найденные проблемы

### 4.1. Английские названия в seed файле

В `packages/shared/src/seed/initial-ability-tree.json` найдены узлы с английскими названиями:

1. **node_shared_leadership** (строка 439):
   - ❌ `"name": "Shared Leadership"`
   - ✅ Должно быть: `"name": "Распределённое лидерство"`

2. **node_feedforward** (строка 534):
   - ❌ `"name": "Feedforward"`
   - ✅ Должно быть: `"name": "Обратная связь в будущее"`

3. **node_mirror_holder** (строка 566):
   - ❌ `"name": "Window Gazer vs Mirror Holder"`
   - ✅ Должно быть: `"name": "Смотрящий в окно vs Держащий зеркало"`

4. **node_vertical_development** (строка 645):
   - ❌ `"name": "Vertical Development"`
   - ✅ Должно быть: `"name": "Вертикальное развитие"`

5. **node_ddo** (строка 661):
   - ❌ `"name": "Deliberately Developmental Organization"`
   - ✅ Должно быть: `"name": "Организация как тренажёр"`

### 4.2. Потеря пользовательских данных

**Сценарий:**
1. Пользователь разблокировал узлы (state='unlocked', xp_current=50)
2. Разработчик обновляет seed файл (увеличивает tree_revision)
3. Система запускается, видит `seedRevision > dbRevision`
4. Система перезаписывает `TreeSemantic.data` из seed файла
5. **Результат:** Пользовательские данные (state, xp_current) потеряны!

### 4.3. Перезапись русских переводов

**Сценарий:**
1. Разработчик перевел названия узлов на русский в БД
2. Разработчик обновляет seed файл (но забыл обновить переводы в seed)
3. Система запускается, видит `seedRevision > dbRevision`
4. Система перезаписывает `TreeSemantic.data` из seed файла
5. **Результат:** Русские переводы перезаписаны английскими из seed!

### 4.4. Перезапись пользовательских квестов

**Сценарий:**
1. Пользователь создал квест "Развить способность X" (source=null или 'user_generated')
2. Разработчик добавляет базовый квест с таким же title в `quest-templates.json`
3. Запускается `sync-base-quests.ts`
4. Скрипт находит существующий квест по title
5. **Результат:** Пользовательский квест перезаписан базовым шаблоном!

---

## 5. Карта зависимостей данных

### 5.1. Nodes (Узлы способностей)

```
initial-ability-tree.json (seed)
    ↓
    ├─→ TreeSemantic.data (БД) ❌ СМЕШАНО: структура + контент + пользовательские данные
    ├─→ AbilityNode (БД) ❌ ДУБЛИРОВАНИЕ: контент
    └─→ node-descriptions.json ✅ ОТДЕЛЬНО: контент
    
UserAbilityState (БД) ✅ ОТДЕЛЬНО: пользовательские данные
    ↓
    └─→ TreeSemantic.data ❌ СМЕШАНО: также хранит пользовательские данные
```

### 5.2. Quests (Квесты)

```
quest-templates.json
    ↓
    ├─→ Quest (БД, source='base_template') ✅
    └─→ sync-base-quests.ts ❌ ПРОБЛЕМА: может перезаписать по title
    
Quest Generation (LLM)
    ↓
    └─→ Quest (БД, source='auto_generated') ✅
    
User creates quest
    ↓
    └─→ Quest (БД, source='user_generated' или null) ❌ ПРОБЛЕМА: может быть перезаписан
```

---

## 6. Рекомендации

### 6.1. Немедленные действия

1. **Проверить seed файл** на наличие английских названий
2. **Проверить БД** на наличие английских названий в `TreeSemantic.data` и `AbilityNode`
3. **Добавить защиту** от перезаписи пользовательских данных

### 6.2. Краткосрочные действия

1. **Обновить seed файл** русскими переводами
2. **Исправить sync-base-quests.ts** - обновлять только квесты с source='base_template'
3. **Добавить валидацию** перед обновлением TreeSemantic.data

### 6.3. Долгосрочные действия

1. **Разделить структуру и контент:**
   - Seed файл → только структура
   - node-descriptions.json → только контент
   - TreeSemantic.data → только структура

2. **Разделить базовые и пользовательские квесты:**
   - Добавить поле `source` в Quest (уже есть!)
   - Обновлять только квесты с source='base_template'

3. **Убрать пользовательские данные из TreeSemantic.data:**
   - Хранить только в UserAbilityState
   - Объединять в runtime при запросе

---

## 7. Следующие шаги

1. ✅ Создать полный документ аудита (этот документ)
2. ⏳ Визуализировать текущую и правильную архитектуру
3. ⏳ Создать документ с правилами архитектуры
4. ⏳ Начать миграцию (Этап 3-6)

---

## Приложение: Код проблемных мест

### A.1. tree.service.ts:307-334
```typescript
// ❌ ПРОБЛЕМА: Перезаписывает все данные
if (seedRevision > dbRevision) {
  await this.prisma.treeSemantic.upsert({
    update: {
      data: normalizedSeedData as any,  // Перезаписывает ВСЕ
    },
  });
}
```

### A.2. sync-base-quests.ts:44-66
```typescript
// ❌ ПРОБЛЕМА: Обновляет по title, может перезаписать пользовательские квесты
const existing = await prisma.quest.findFirst({
  where: { title: title }
});

if (existing) {
  await prisma.quest.update({
    where: { id: existing.id },
    data: questData  // Может перезаписать пользовательский квест
  });
}
```

---

**См. также:**
- [ARCHITECTURE_SINGLE_SOURCE_OF_TRUTH.md](../ARCHITECTURE_SINGLE_SOURCE_OF_TRUTH.md) - Правильная архитектура
- [CONTENT_STORAGE_LOCATIONS.md](../CONTENT_STORAGE_LOCATIONS.md) - Места хранения контента
