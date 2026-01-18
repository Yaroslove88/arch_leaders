# Структура стилей лидерства (Builds)

## Обзор

Стили лидерства (builds) — это временные идентичности, которые активируются автоматически на основе узлов способностей пользователя и паттернов поведения.

## Структура данных

### Формат JSON

```json
{
  "builds": [
    {
      "build_id": "build_crisis_solver",
      "name": "Кризисный решатель",
      "icon": "⚔️",
      "fantasy": "Я — тот, кто держит систему, когда всё рушится",
      "description": "Эффективен в турбулентности, быстро действует, держит давление",
      "entry_conditions": {
        "required_nodes": ["node_containment", "node_personal_resilience", "node_emotional_work"],
        "optional_nodes": ["node_cognitive_maturity"],
        "behavioral_patterns": {
          "crisis_decisions_percentage": 60,
          "personal_decisions_percentage": 50
        },
        "min_required_count": 3
      },
      "bonuses": { ... },
      "hidden_costs": { ... },
      "exit_conditions": { ... },
      "color": "#FF6B6B"
    }
  ]
}
```

## Поля

### Обязательные поля

- **`build_id`** (string) — уникальный идентификатор стиля
- **`name`** (string) — название стиля на русском языке
- **`icon`** (string) — эмодзи или код иконки
- **`fantasy`** (string) — краткое описание стиля (цитата)
- **`description`** (string) — подробное описание стиля
- **`entry_conditions`** (object) — условия активации стиля
  - **`required_nodes`** (string[]) — массив ID обязательных узлов (не может быть пустым)
  - **`min_required_count`** (number, опционально) — минимальное количество обязательных узлов для активации (по умолчанию = количество required_nodes)
  - **`optional_nodes`** (string[], опционально) — массив ID опциональных узлов (дают бонус к активации)
  - **`behavioral_patterns`** (object, опционально) — паттерны поведения для активации
- **`bonuses`** (object) — бонусы активного стиля
- **`hidden_costs`** (object) — скрытые издержки активного стиля
- **`exit_conditions`** (object) — условия выхода из стиля
- **`color`** (string) — цвет стиля в формате hex (#RRGGBB)

## Логика активации

### Основные условия

1. **Обязательные узлы** (`required_nodes`):
   - Минимум `min_required_count` узлов из `required_nodes` должны быть активны/разблокированы
   - Если `min_required_count` не указано, требуется все узлы из `required_nodes`
   - Это основное условие активации стиля

2. **Опциональные узлы** (`optional_nodes`):
   - Дают дополнительный бонус к активации (+0.5 к score, если активны 2+ узла)
   - Не обязательны для активации, но влияют на процент активации

3. **Паттерны поведения** (`behavioral_patterns`):
   - Дополнительные условия активации (например, процент решений определенного типа)
   - Используются для более точной активации стиля

### Расчет активации

```typescript
let activationScore = 0;
let maxScore = 0;

// Обязательные узлы
const requiredNodes = build.entry_conditions.required_nodes;
const minRequiredCount = build.entry_conditions.min_required_count || requiredNodes.length;
maxScore += minRequiredCount;

const matchedRequired = requiredNodes.filter(nodeId => 
  activeNodeIds.includes(nodeId)
);

if (matchedRequired.length >= minRequiredCount) {
  activationScore += matchedRequired.length;
}

// Опциональные узлы (бонус)
if (build.entry_conditions.optional_nodes) {
  const optionalActive = build.entry_conditions.optional_nodes.filter(nodeId =>
    activeNodeIds.includes(nodeId)
  );
  if (optionalActive.length >= 2) {
    activationScore += 0.5;
    maxScore += 0.5;
  }
}

const activationPercentage = maxScore > 0 ? (activationScore / maxScore) * 100 : 0;
const isActive = activationPercentage >= 60; // Порог активации 60%
```

## Миграция с `required_skills` на `required_nodes`

### Старая структура (deprecated)

```json
{
  "entry_conditions": {
    "required_skills": ["node_containment", "node_personal_resilience"],
    "min_skills_count": 2
  },
  "related_nodes": ["node_containment", "node_personal_resilience", "node_cognitive_maturity"]
}
```

### Новая структура

```json
{
  "entry_conditions": {
    "required_nodes": ["node_containment", "node_personal_resilience"],
    "optional_nodes": ["node_cognitive_maturity"],
    "min_required_count": 2
  }
}
```

### Правила миграции

1. **`required_skills` → `required_nodes`**: Переименовать поле
2. **`min_skills_count` → `min_required_count`**: Переименовать поле
3. **`related_nodes` → `optional_nodes`**: 
   - Узлы, которые были в `related_nodes`, но не в `required_skills`, переносятся в `optional_nodes`
   - Поле `related_nodes` удаляется полностью

## Примеры

### Пример 1: Кризисный решатель

```json
{
  "build_id": "build_crisis_solver",
  "entry_conditions": {
    "required_nodes": [
      "node_containment",
      "node_personal_resilience",
      "node_emotional_work"
    ],
    "optional_nodes": [
      "node_cognitive_maturity"
    ],
    "min_required_count": 3
  }
}
```

**Логика:** Для активации нужно минимум 3 из 3 обязательных узлов. Опциональный узел `node_cognitive_maturity` дает бонус, если активен.

### Пример 2: Архитектор системы

```json
{
  "build_id": "build_architect",
  "entry_conditions": {
    "required_nodes": [
      "node_thinking_through_form",
      "node_form_assembly",
      "node_system_thinking"
    ],
    "optional_nodes": [
      "node_scenario_thinking",
      "node_institutionalization"
    ],
    "min_required_count": 2
  }
}
```

**Логика:** Для активации нужно минимум 2 из 3 обязательных узлов. Опциональные узлы дают бонус к активации.

## Валидация

Все узлы в `required_nodes` и `optional_nodes` должны:
- Существовать в семантическом дереве (`initial-ability-tree.json`)
- Иметь валидный формат ID (начинаться с `node_`)
- `required_nodes` не может быть пустым массивом
- `min_required_count` не может быть больше количества `required_nodes`

## Использование в коде

### TypeScript интерфейс

```typescript
export interface Build {
  build_id: string;
  name: string;
  icon: string;
  fantasy: string;
  description: string;
  entry_conditions: {
    required_nodes: string[];
    optional_nodes?: string[];
    behavioral_patterns?: Record<string, any>;
    min_required_count?: number;
  };
  bonuses: Record<string, any>;
  hidden_costs: Record<string, any>;
  exit_conditions: Record<string, any>;
  color: string;
}
```

### Проверка активации

```typescript
// В builds.service.ts
const requiredNodes = build.entry_conditions.required_nodes;
const minRequiredCount = build.entry_conditions.min_required_count || requiredNodes.length;

const matchedRequired = requiredNodes.filter((nodeId) =>
  activeNodeIds.includes(nodeId)
);

if (matchedRequired.length >= minRequiredCount) {
  // Стиль активирован
}
```

### Отображение в UI

```typescript
// Обязательные узлы
const requirements = build.entry_conditions.required_nodes.map((nodeId) => {
  // Отображение как обязательные требования
});

// Опциональные узлы
const optionalNodes = build.entry_conditions.optional_nodes?.map((nodeId) => {
  // Отображение как дополнительные связанные узлы
});
```

## Преимущества новой структуры

1. **Единая терминология**: Используется только `nodes`, без смешивания `skills` и `nodes`
2. **Явное разделение**: Четкое разделение на обязательные и опциональные узлы
3. **Нет дублирования**: Узлы не дублируются между `required_skills` и `related_nodes`
4. **Проще поддерживать**: Одна структура данных вместо двух перекрывающихся
