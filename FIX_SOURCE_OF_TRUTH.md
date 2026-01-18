# Исправление источников истины для XP и состояний узлов

## Проблема

Данные о XP и состояниях узлов хранились в разных местах и не синхронизировались:
- XP записывался в `UserAbilityState.internal_progress`
- Frontend читал из `TreeSemantic.data.nodes[].xp_current`
- Состояния узлов не учитывали `'available'` как активное
- Процент выполнения и количество активных узлов показывались неверно

## Решение

### 1. UserAbilityState = источник истины

`UserAbilityState` теперь единственный источник истины для:
- `internal_progress` (XP)
- `state` (состояние узла)
- `progress` (отображаемый прогресс 0-1.0)

### 2. Обогащение TreeSemantic при запросе

`TreeService.getSemantic()` теперь обогащает данные из `UserAbilityState` при каждом запросе:

```typescript
private async enrichWithUserState(data: SemanticTree, userId: string) {
  const userStates = await this.prisma.userAbilityState.findMany({
    where: { user_id: userId },
  });
  
  // Обогащаем nodes данными из UserAbilityState
  data.nodes = data.nodes.map(node => {
    const state = userStates.find(s => s.node_id === node.node_id);
    if (state) {
      return {
        ...node,
        state: state.state,
        xp_current: Number(state.internal_progress) || 0,
      };
    }
    return node;
  });
}
```

### 3. Исправлена логика активных узлов

**BuildsService** (`apps/api/src/builds/builds.service.ts`):
```typescript
// Было: только active, unlocked, integrated
// Стало: + available
const activeNodes = tree.nodes.filter(
  (n) => n.state === 'active' || n.state === 'available' || 
        n.state === 'unlocked' || n.state === 'integrated'
);
```

**Frontend - Architecture** (`apps/web/src/app/architecture/page.tsx`):
- Исправлено в 3 местах: считает `'available'` как активное состояние

**Frontend - Dashboard** (`apps/web/src/app/dashboard/page.tsx`):
```typescript
// Было: только unlocked, integrated
// Стало: + available, active
const unlockedNodes = tree?.nodes?.filter((n: any) => 
  n.state === 'active' || n.state === 'available' || 
  n.state === 'unlocked' || n.state === 'integrated'
).length || 0;
```

**Frontend - Development** (`apps/web/src/app/development/page.tsx`):
```typescript
// Было: статус определялся по overallProgress
// Стало: статус определяется по node.state (источник истины)
if (node.state === 'locked') {
  status = 'locked';
} else if (node.state === 'integrated' || ...) {
  status = 'mastered';
} else if (node.state === 'active' || node.state === 'available' || node.state === 'unlocked') {
  status = 'in_progress';
}
```

### 4. Автозаполнение AbilityNode

При старте сервера таблица `ability_nodes` автоматически заполняется из seed файла если пустая.

### 5. TreeSemantic.data содержит только seed

`TreeSemantic.data` теперь содержит только seed данные (все узлы locked, xp=0). Пользовательские данные обогащаются при каждом запросе.

## Архитектура после исправления

```
┌─────────────────┐
│ Quest/Case Done │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ UserAbilityState     │ ← ИСТОЧНИК ИСТИНЫ
│ - internal_progress  │
│ - state              │
│ - progress           │
└────────┬─────────────┘
         │
         │ GET /tree/semantic
         ▼
┌─────────────────────┐
│ enrichWithUserState │
│ (обогащение)        │
└────────┬─────────────┘
         │
         ▼
┌─────────────────────┐
│ TreeSemantic.data   │ ← Seed + обогащение
│ (временные данные)  │
└────────┬─────────────┘
         │
         ▼
┌─────────────────────┐
│ Frontend            │
│ - XP отображается   │
│ - Процент правильный│
│ - Стили активируются│
└─────────────────────┘
```

## Файлы изменены

### Backend:
- `apps/api/src/tree/tree.service.ts` - добавлен `enrichWithUserState()`, обогащение во всех точках возврата
- `apps/api/src/builds/builds.service.ts` - добавлен `'available'` в фильтр активных узлов
- `apps/api/src/tree/tree.controller.ts` - добавлена проверка `user.sub`
- `apps/api/src/ability/ability-state.service.ts` - удалены debug логи
- `apps/api/src/quests/quests.service.ts` - удалены debug логи

### Frontend:
- `apps/web/src/app/architecture/page.tsx` - исправлена логика активных узлов (3 места)
- `apps/web/src/app/dashboard/page.tsx` - исправлен подсчет `unlockedNodes`
- `apps/web/src/app/development/page.tsx` - исправлено определение статуса узлов

### Scripts:
- `scripts/create-clean-test-user.ts` - добавлен пароль (bcrypt)
- `scripts/reset-tree-semantic.ts` - сброс TreeSemantic к seed состоянию
- `scripts/check-and-fix-node-states.ts` - проверка и исправление состояний

## Проверка

После перезапуска API сервера:
1. ✅ XP отображается на карточках узлов
2. ✅ Процент выполнения веток правильный
3. ✅ Количество активных узлов правильное
4. ✅ Стили лидерства активируются когда узлы available/active
5. ✅ Dashboard показывает правильное количество открытых узлов
6. ✅ Development показывает правильный прогресс по веткам

## Статус

✅ Все исправления применены
✅ Архитектура источников данных зафиксирована
✅ Frontend и Backend синхронизированы
