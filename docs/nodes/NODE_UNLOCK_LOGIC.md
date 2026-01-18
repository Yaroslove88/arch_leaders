# Логика разблокировки узлов

## Обзор

Узел становится доступным (разблокированным) при выполнении определенных условий. Есть несколько механизмов разблокировки, которые работают вместе.

## Состояния узлов

Узлы проходят через следующие состояния:

1. **`locked`** — узел заблокирован, недоступен для развития
2. **`available`** — узел доступен, можно начинать развивать
3. **`active`** — узел активно развивается (30-99% прогресса)
4. **`unlocked`** — узел разблокирован (100-149% прогресса)
5. **`integrated`** — узел интегрирован (150%+ прогресса)

## Механизмы разблокировки

### 1. Prerequisites (Предварительные условия)

**Основной механизм разблокировки узлов выше первого уровня.**

Узел 2 становится доступным, когда:
- Все узлы из массива `prerequisites` разблокированы (их `state !== 'locked'`)
- Узел 1 достиг состояния `unlocked` (100% прогресса) или выше

**Пример:**
```json
{
  "node_id": "node_scenario_analysis",
  "prerequisites": ["node_role_differentiation"],
  "state": "locked"
}
```

Узел `node_scenario_analysis` разблокируется, когда:
- Узел `node_role_differentiation` достиг состояния `unlocked` или выше

**Важно:** 
- Prerequisites проверяются автоматически при обновлении прогресса узлов
- Если узел 1 достиг 100%, но узел 2 все еще `locked`, проверьте:
  1. Есть ли у узла 2 поле `prerequisites` с ID узла 1
  2. Достиг ли узел 1 состояния `unlocked` (не просто 100% XP, а именно состояние `unlocked`)

### 2. Прогресс по опыту (XP)

**УПРОЩЕННАЯ СИСТЕМА:** TreeSemantic - единственный источник истины для опыта и состояния.

Узлы автоматически меняют состояние на основе прогресса:

| Прогресс | Состояние | Условие |
|----------|-----------|---------|
| 0% | `locked` | Начальное состояние |
| 1-29% | `available` | Если был `locked` |
| 30-99% | `active` | Если был `locked` или `available` |
| 100-149% | `unlocked` | Автоматически при обновлении xp_current |
| 150%+ | `integrated` | Автоматически при обновлении xp_current |

**Формула прогресса:**
```
progress = (xp_current / xp_required) * 100%
```

**Важно:** 
- `xp_current` и `xp_required` хранятся в **TreeSemantic** (источник истины)
- `state` вычисляется **автоматически** при изменении `xp_current` через `updateNodeProgress()`
- `progress` вычисляется **на лету** из `xp_current / xp_required` (не хранится в БД)

### 3. Unlock Conditions (из seed)

В файле `initial-ability-tree.json` могут быть указаны дополнительные условия:

```json
{
  "unlock_conditions": {
    "type": "prerequisite",
    "required_nodes": ["node_role_differentiation"]
  }
}
```

**Типы условий:**
- `prerequisite` — требует разблокировки указанных узлов
- `quest_count` — требует завершения определенного количества квестов
- `evidence_count` — требует определенного количества доказательств
- `quest_completion` — требует завершения конкретного квеста
- `manual` — разблокируется вручную

**Важно:** Эти условия описаны в seed, но основная логика разблокировки работает через поле `prerequisites` в базе данных.

## Как понять, почему узел 2 закрыт?

### Шаг 1: Проверьте prerequisites

Узел 2 должен иметь в поле `prerequisites` ID узла 1:

```json
{
  "node_id": "node_2",
  "prerequisites": ["node_1"]  // ← Должен быть здесь
}
```

### Шаг 2: Проверьте состояние узла 1

Узел 1 должен быть в состоянии `unlocked` или выше:

- ✅ `unlocked` — узел разблокирован (100-149% прогресса)
- ✅ `integrated` — узел интегрирован (150%+ прогресса)
- ❌ `active` — недостаточно (30-99% прогресса)
- ❌ `available` — недостаточно (1-29% прогресса)
- ❌ `locked` — недостаточно (0% прогресса)

### Шаг 3: Проверьте прогресс узла 1

Даже если узел 1 достиг 100% XP, он должен перейти в состояние `unlocked`:

```
Если xp_current >= xp_required:
  state = 'unlocked'
```

Если узел 1 на 100%, но состояние все еще `active`, возможно:
- Не хватает XP для перехода в `unlocked`
- Логика обновления состояния не сработала

## Примеры

### Пример 1: Простая цепочка

```
Узел 1 (node_grounding_point)
  ├─ state: available (базовый узел)
  ├─ xp_required: 100
  └─ xp_current: 0

Узел 2 (node_self_regulation)
  ├─ prerequisites: ["node_grounding_point"]
  ├─ state: locked
  └─ xp_required: 100
```

**Когда разблокируется узел 2?**
- Когда узел 1 достигнет состояния `unlocked` (100% прогресса)
- То есть когда `xp_current >= 100` для узла 1

### Пример 2: Множественные prerequisites

```
Узел 1 (node_field_of_differences)
Узел 2 (node_system_thinking)

Узел 3 (node_form_assembly)
  ├─ prerequisites: ["node_field_of_differences", "node_system_thinking"]
  └─ state: locked
```

**Когда разблокируется узел 3?**
- Когда **оба** узла 1 и 2 достигнут состояния `unlocked` или выше

### Пример 3: Базовые узлы

```
Узел 1 (node_grounding_point)
  ├─ tier: "basic"
  ├─ state: available (автоматически разблокирован)
  └─ xp_required: 0
```

**Базовые узлы (tier: "basic")** автоматически разблокируются при инициализации дерева.

## Проверка в коде

Логика проверки prerequisites находится в:

```typescript
// apps/api/src/ability/ability-engine.service.ts
private checkPrerequisites(
  prerequisiteIds: string[],
  allStates: Map<string, AbilityStateSnapshot>,
): boolean {
  // Проверяет, что все prerequisite узлы разблокированы
  // (state !== 'locked')
}
```

## Частые проблемы

### Проблема 1: Узел 1 на 100%, но узел 2 все еще locked

**Причина:** Узел 1 не перешел в состояние `unlocked`

**Решение:**
1. Проверьте, что `xp_current >= xp_required` для узла 1
2. Проверьте, что состояние узла 1 обновилось до `unlocked`
3. Если нет — возможно, нужно вручную обновить состояние через API

### Проблема 2: Узел 2 не имеет prerequisites

**Причина:** В базе данных у узла 2 нет поля `prerequisites` с ID узла 1

**Решение:**
1. Проверьте структуру узла 2 в `initial-ability-tree.json`
2. Проверьте, что `prerequisites` правильно сохранены в БД
3. Если нужно, обновите `prerequisites` через API

### Проблема 3: Prerequisites указаны в unlock_conditions, но не работают

**Причина:** `unlock_conditions` в seed — это описание, а реальная логика работает через `prerequisites` в БД

**Решение:**
1. Убедитесь, что `prerequisites` правильно синхронизированы из seed в БД
2. Проверьте миграции базы данных

## API для проверки

### Получить информацию об узле

```http
GET /api/tree/semantic?userId={userId}
```

Ответ включает:
- `prerequisites` — массив ID узлов-предшественников
- `state` — текущее состояние узла
- `xp_current` — текущий опыт
- `xp_required` — требуемый опыт

### Проверить, почему узел заблокирован

```typescript
// Псевдокод проверки
function checkWhyNodeLocked(nodeId: string, tree: SemanticTree): string[] {
  const node = tree.nodes.find(n => n.node_id === nodeId);
  const reasons: string[] = [];
  
  if (!node.prerequisites || node.prerequisites.length === 0) {
    reasons.push("Узел не имеет prerequisites - проверьте unlock_conditions в seed");
    return reasons;
  }
  
  for (const prereqId of node.prerequisites) {
    const prereq = tree.nodes.find(n => n.node_id === prereqId);
    if (!prereq) {
      reasons.push(`Prerequisite узел ${prereqId} не найден`);
      continue;
    }
    
    if (prereq.state === 'locked') {
      reasons.push(`Prerequisite узел ${prereqId} заблокирован (state: locked)`);
    } else if (prereq.state !== 'unlocked' && prereq.state !== 'integrated') {
      reasons.push(
        `Prerequisite узел ${prereqId} не разблокирован ` +
        `(state: ${prereq.state}, progress: ${(prereq.xp_current / prereq.xp_required * 100).toFixed(0)}%)`
      );
    }
  }
  
  return reasons;
}
```

## Важно: Prerequisites в БД vs unlock_conditions в seed

**Критическое различие:**

- **`unlock_conditions` в `initial-ability-tree.json`** — это описание условий разблокировки в seed-файле
- **`prerequisites` в базе данных** — это реальное поле, которое используется для проверки разблокировки

**Проблема:** Если в seed указано:
```json
{
  "unlock_conditions": {
    "type": "prerequisite",
    "required_nodes": ["node_1"]
  }
}
```

Но в БД в таблице `AbilityNode` поле `prerequisites` пустое или не содержит `node_1`, то узел 2 **не разблокируется**.

**Решение:** Нужно синхронизировать `unlock_conditions.required_nodes` из seed в поле `prerequisites` в БД.

**Проверка:**
```sql
-- Проверить prerequisites узла в БД
SELECT id, prerequisites 
FROM ability_nodes 
WHERE id = 'node_2';
```

Если `prerequisites` пустой, но в seed есть `unlock_conditions.type: "prerequisite"`, нужно:
1. Извлечь `required_nodes` из `unlock_conditions`
2. Сохранить их в поле `prerequisites` в БД

## Упрощенная система (2025-01-09)

**TreeSemantic - единственный источник истины:**
- `xp_current` / `xp_required` - опыт узла
- `state` - вычисляется автоматически при изменении `xp_current`
- `progress` - вычисляется на лету: `progress = xp_current / xp_required`

**UserAbilityState - только для аналитики:**
- `state` - синхронизируется из TreeSemantic
- `relevance` - актуальность узла
- `last_activity_date` - дата последней активности

**Убрано:**
- ❌ `progress` - больше не хранится, вычисляется на лету
- ❌ `internal_progress` - больше не используется
- ❌ `stored_experience` - больше не храним сохраненный опыт

Подробнее: [XP_SYSTEM_SIMPLIFIED.md](./XP_SYSTEM_SIMPLIFIED.md)

## Резюме

**Узел 2 становится доступным, когда:**

1. ✅ Узел 1 указан в `prerequisites` узла 2 **в базе данных** (не только в seed)
2. ✅ Узел 1 достиг состояния `unlocked` (100% прогресса) или выше
3. ✅ Состояние узла 1 обновлено автоматически при изменении `xp_current`

**Если узел 2 все еще закрыт:**
- Проверьте `prerequisites` узла 2 **в базе данных** (не только в seed)
- Проверьте состояние узла 1 (должно быть `unlocked` или `integrated`)
- Проверьте прогресс узла 1 (`xp_current >= xp_required`)
- Запустите скрипт исправления: `npx ts-node scripts/fix-node-states-from-xp.ts [userId]`
