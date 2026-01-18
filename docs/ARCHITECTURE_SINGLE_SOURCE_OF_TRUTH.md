# Правильная архитектура: Единый источник истины

## Проблема текущей архитектуры

**Сейчас:**
- `TreeSemantic.data` хранит ВСЁ: структуру + контент + пользовательские данные
- При обновлении seed файла система **перезаписывает всё**, включая пользовательские данные
- Потом пытается "обогатить" из `UserAbilityState`, но данные уже потеряны
- Нет единого источника истины - данные дублируются и конфликтуют

**Результат:** При обновлении seed файла теряются пользовательские данные (state, xp_current).

---

## Правильная архитектура

### Принцип разделения ответственности

**1. Структура (неизменяемая база)**
- **Источник:** `packages/shared/src/seed/initial-ability-tree.json`
- **Содержит:** Только структуру дерева
  - `node_id`, `branch_id`, `tier`, `prerequisites`
  - `unlock_conditions` (структура, не контент)
  - `xp_required` (базовые значения)
- **Хранится в БД:** `TreeSemantic.data` (только структура, без контента)
- **Обновляется:** Только при изменении структуры (добавление/удаление узлов)

**2. Контент (переводы, описания)**
- **Источник:** `data/node-descriptions.json`
- **Содержит:** Только контент
  - `name` (русское название)
  - `full_description`, `practical_meaning`, `examples`
  - `integration_levels`
- **Хранится в БД:** НЕ хранится в `TreeSemantic.data`
- **Обновляется:** Независимо от структуры

**3. Пользовательские данные (уникальны для каждого пользователя)**
- **Источник:** `UserAbilityState` (таблица в БД)
- **Содержит:** Только пользовательские данные
  - `state` (locked, available, active, unlocked, integrated)
  - `xp_current` (текущий прогресс)
  - `progress`, `relevance`
- **Хранится в БД:** Только в `UserAbilityState`
- **Обновляется:** Только через действия пользователя

---

## Как это должно работать

### При запросе дерева (`GET /tree/semantic`)

```typescript
async getSemantic(userId?: string): Promise<SemanticTree> {
  // 1. Загружаем СТРУКТУРУ из seed (или TreeSemantic для глобального дерева)
  const structure = await this.loadStructure();
  
  // 2. Загружаем КОНТЕНТ из node-descriptions.json
  const content = await this.loadContent();
  
  // 3. Если есть userId - загружаем ПОЛЬЗОВАТЕЛЬСКИЕ ДАННЫЕ
  const userData = userId ? await this.loadUserData(userId) : null;
  
  // 4. ОБЪЕДИНЯЕМ в runtime (не сохраняем в БД!)
  return this.mergeData(structure, content, userData);
}
```

### Структура данных

```typescript
// Структура (из seed)
interface NodeStructure {
  node_id: string;
  branch_id: string;
  tier: 'basic' | 'intermediate' | 'advanced';
  prerequisites: string[];
  unlock_conditions: any;
  xp_required: number; // базовое значение
}

// Контент (из node-descriptions.json)
interface NodeContent {
  name: string;
  full_description: string;
  practical_meaning: string;
  examples: string[];
  integration_levels: {
    Novice: string;
    Integrated: string;
    Embodied: string;
  };
}

// Пользовательские данные (из UserAbilityState)
interface NodeUserData {
  state: 'locked' | 'available' | 'active' | 'unlocked' | 'integrated';
  xp_current: number;
  progress: number;
  relevance: number;
}

// Объединенный узел (только в runtime)
interface AbilityNode {
  // Из структуры
  node_id: string;
  branch_id: string;
  tier: string;
  prerequisites: string[];
  xp_required: number;
  
  // Из контента
  name: string;
  description: string;
  full_description: string;
  // ...
  
  // Из пользовательских данных (если есть userId)
  state: string;
  xp_current: number;
  // ...
}
```

---

## Изменения в коде

### 1. TreeSemantic.data должен хранить ТОЛЬКО структуру

```typescript
// ❌ БЫЛО: хранит всё
{
  nodes: [
    {
      node_id: "node_grounding_point",
      name: "Точка опоры",  // ❌ контент
      description: "...",   // ❌ контент
      state: "available",   // ❌ пользовательские данные
      xp_current: 50,       // ❌ пользовательские данные
      // ...
    }
  ]
}

// ✅ ДОЛЖНО БЫТЬ: только структура
{
  nodes: [
    {
      node_id: "node_grounding_point",
      branch_id: "branch_subjectivity",
      tier: "basic",
      prerequisites: [],
      unlock_conditions: { type: "quest_count", ... },
      xp_required: 100,  // базовое значение
      // НЕТ name, description, state, xp_current
    }
  ]
}
```

### 2. Обновление TreeSemantic не должно перезаписывать пользовательские данные

```typescript
// ❌ БЫЛО: перезаписывает всё
if (seedRevision > dbRevision) {
  await this.prisma.treeSemantic.upsert({
    update: {
      data: normalizedSeedData as any,  // ❌ перезаписывает ВСЁ
    },
  });
}

// ✅ ДОЛЖНО БЫТЬ: обновляет только структуру
if (seedRevision > dbRevision) {
  const structureOnly = this.extractStructure(normalizedSeedData);
  await this.prisma.treeSemantic.upsert({
    update: {
      data: structureOnly as any,  // ✅ только структура
    },
  });
}
```

### 3. Объединение данных в runtime

```typescript
private mergeData(
  structure: SemanticTree,
  content: Record<string, NodeContent>,
  userData: Record<string, NodeUserData> | null
): SemanticTree {
  return {
    ...structure,
    nodes: structure.nodes.map(node => {
      const nodeContent = content[node.node_id];
      const nodeUserData = userData?.[node.node_id];
      
      return {
        // Структура (из seed)
        ...node,
        
        // Контент (из node-descriptions.json)
        name: nodeContent?.name || node.node_id,
        description: nodeContent?.full_description || '',
        full_description: nodeContent?.full_description,
        practical_meaning: nodeContent?.practical_meaning,
        examples: nodeContent?.examples || [],
        integration_levels: nodeContent?.integration_levels,
        
        // Пользовательские данные (из UserAbilityState)
        state: nodeUserData?.state || node.state || 'locked',
        xp_current: nodeUserData?.xp_current || 0,
        progress: nodeUserData?.progress || 0,
        relevance: nodeUserData?.relevance || 0,
      };
    }),
  };
}
```

---

## Преимущества новой архитектуры

1. **Единый источник истины для каждого типа данных:**
   - Структура → seed файл
   - Контент → node-descriptions.json
   - Пользовательские данные → UserAbilityState

2. **Нет дублирования:**
   - Контент не хранится в БД
   - Пользовательские данные не хранятся в TreeSemantic

3. **Безопасные обновления:**
   - Обновление seed файла не затрагивает пользовательские данные
   - Обновление контента не затрагивает структуру
   - Обновление пользовательских данных не затрагивает ничего другого

4. **Производительность:**
   - Контент кэшируется в памяти (не в БД)
   - Пользовательские данные загружаются только при необходимости
   - Структура обновляется редко

---

## Миграция

### Шаг 1: Извлечь структуру из TreeSemantic.data

Создать скрипт, который:
1. Загружает текущий `TreeSemantic.data`
2. Извлекает только структуру (удаляет name, description, state, xp_current)
3. Сохраняет обратно в `TreeSemantic.data`

### Шаг 2: Обновить логику загрузки

Изменить `tree.service.ts`:
1. Загружать структуру из `TreeSemantic.data` (или seed)
2. Загружать контент из `node-descriptions.json`
3. Загружать пользовательские данные из `UserAbilityState`
4. Объединять в runtime

### Шаг 3: Обновить логику сохранения

Изменить `tree.service.ts`:
1. При обновлении seed - обновлять только структуру
2. Пользовательские данные сохранять только в `UserAbilityState`
3. Контент не сохранять в БД

---

## Итог

**Текущая проблема:** Нет единого источника истины, данные смешаны, при обновлении теряются пользовательские данные.

**Решение:** Разделить на 3 независимых источника:
- Структура → seed файл
- Контент → node-descriptions.json  
- Пользовательские данные → UserAbilityState

**Результат:** Безопасные обновления, нет дублирования, единый источник истины для каждого типа данных.

---

## Связанные документы

- [FULL_ARCHITECTURE_AUDIT.md](./audit/FULL_ARCHITECTURE_AUDIT.md) - Полный аудит архитектуры
- [ARCHITECTURE_VISUALIZATION.md](./audit/ARCHITECTURE_VISUALIZATION.md) - Визуализация текущей и правильной архитектуры
- [ARCHITECTURE_RULES.md](./audit/ARCHITECTURE_RULES.md) - Правила архитектуры
- [CONTENT_STORAGE_LOCATIONS.md](./CONTENT_STORAGE_LOCATIONS.md) - Места хранения контента
