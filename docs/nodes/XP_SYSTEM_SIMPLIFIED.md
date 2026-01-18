# Упрощенная система опыта и прогресса

## Обзор изменений

Система упрощена: **TreeSemantic является единственным источником истины** для опыта и состояния узлов.

## Что изменилось

### До упрощения

**Две параллельные системы:**
1. **TreeSemantic** — `xp_current`, `xp_required`, `state`
2. **UserAbilityState** — `progress`, `internal_progress`, `stored_experience`, `state`

**Проблемы:**
- Рассинхронизация данных
- Дублирование логики
- Сложность поддержки
- Баги (узел на 400% XP, но состояние `available`)

### После упрощения

**Единая система:**
1. **TreeSemantic** — единственный источник истины:
   - `xp_current` — текущий опыт узла
   - `xp_required` — требуемый опыт для разблокировки
   - `state` — состояние узла (вычисляется автоматически)
   - `integration_level` — уровень интеграции (вычисляется автоматически)

2. **UserAbilityState** — только для аналитики:
   - `state` — синхронизируется из TreeSemantic
   - `relevance` — актуальность узла (для аналитики)
   - `last_activity_date` — дата последней активности

**Убрано:**
- ❌ `progress` — вычисляется на лету: `progress = xp_current / xp_required`
- ❌ `internal_progress` — больше не используется
- ❌ `stored_experience` — больше не храним сохраненный опыт

## Как работает теперь

### 1. Применение опыта от квеста/кейса

```typescript
// В ability-state.service.ts
async applyQuestExperience(userId, nodeId, experienceAmount) {
  // Обновляем xp_current в TreeSemantic
  const updatedNode = await this.treeService.updateNodeProgress(
    nodeId, 
    experienceAmount, 
    userId
  );
  
  // updateNodeProgress автоматически:
  // 1. Обновляет xp_current
  // 2. Вычисляет state на основе xp_current / xp_required
  // 3. Обновляет integration_level
  // 4. Синхронизирует state с UserAbilityState
}
```

### 2. Вычисление состояния

```typescript
// В tree.service.ts - updateNodeProgress
const progressPercent = (xp_current / xp_required) * 100;

if (progressPercent >= 150) {
  state = 'integrated';
  integration_level = 'Embodied';
} else if (progressPercent >= 100) {
  state = 'unlocked';
  integration_level = 'Integrated';
} else if (progressPercent >= 30) {
  state = 'active';
  integration_level = 'Novice';
} else if (progressPercent > 0) {
  state = 'available';
  integration_level = 'Novice';
}
```

### 3. Получение прогресса

```typescript
// Вычисляется на лету из TreeSemantic
const progress = Math.min(1.0, xp_current / xp_required);
```

## Миграция данных

### Скрипт для исправления состояния узлов

```bash
cd apps/api
npx tsx ../../scripts/fix-node-states-from-xp.ts [userId]
```

**Что делает:**
1. Читает все деревья (глобальное + пользовательские)
2. Для каждого узла вычисляет правильное состояние на основе `xp_current / xp_required`
3. Обновляет `state` и `integration_level` в TreeSemantic
4. Синхронизирует `state` с UserAbilityState

**Пример:**
```bash
# Исправить для всех пользователей
npx ts-node scripts/fix-node-states-from-xp.ts

# Исправить для конкретного пользователя
npx ts-node scripts/fix-node-states-from-xp.ts 91500418-d30d-49f3-9af0-0f881d90333b
```

## API изменения

### GET /api/ability/states

**До:**
```json
{
  "node_id": "node_grounding_point",
  "state": "available",
  "progress": 0.5,
  "internal_progress": 1.5,
  "relevance": 0.8,
  "stored_experience": 0.3,
  "last_activity_date": "2025-01-09T12:00:00Z"
}
```

**После:**
```json
{
  "node_id": "node_grounding_point",
  "state": "unlocked",
  "progress": 1.0,  // Вычисляется на лету из TreeSemantic
  "relevance": 0.8,
  "last_activity_date": "2025-01-09T12:00:00Z"
}
```

## Схема базы данных

### UserAbilityState (упрощена)

```prisma
model UserAbilityState {
  user_id       String
  node_id       String
  state         String   // Синхронизируется из TreeSemantic
  relevance     Decimal  // Для аналитики
  last_activity_date DateTime?
  last_updated_at DateTime @default(now()) @updatedAt
  
  // УБРАНО:
  // progress      Decimal  ❌
  // internal_progress Decimal ❌
  // stored_experience Decimal ❌
}
```

**Примечание:** Поля `progress`, `internal_progress`, `stored_experience` остаются в схеме для обратной совместимости, но больше не используются.

## Преимущества

1. ✅ **Нет рассинхронизации** — один источник истины
2. ✅ **Проще логика** — нет дублирования
3. ✅ **Автоматическое обновление** — состояние обновляется при изменении XP
4. ✅ **Меньше багов** — нет проблем с несинхронизированными данными

## Обратная совместимость

- Старые поля в UserAbilityState игнорируются
- API возвращает `progress`, вычисленный на лету
- Фронтенд получает `progress` как раньше, но он вычисляется из TreeSemantic

## Миграция кода

### Где были изменения:

1. ✅ `ability-state.service.ts` — упрощен `applyQuestExperience`
2. ✅ `ability.controller.ts` — получает progress из TreeSemantic
3. ✅ `tree.service.ts` — `enrichWithUserState` не перезаписывает xp_current
4. ✅ `user-initialization.service.ts` — убраны internal_progress
5. ✅ `api.ts` (фронтенд) — убраны internal_progress/stored_experience из интерфейса
6. ✅ `tree-fix.controller.ts` — упрощено создание состояний

### Где еще могут быть ссылки:

- Тесты (ability-engine.service.spec.ts, ability-engine-experience.spec.ts)
- Скрипты (check-and-fix-node-states.ts и другие)
- Документация

## Проверка после миграции

1. Запустить скрипт исправления:
   ```bash
   npx ts-node scripts/fix-node-states-from-xp.ts
   ```

2. Проверить, что узлы с XP > 100% имеют состояние `unlocked` или `integrated`

3. Проверить, что узлы с prerequisites разблокируются автоматически

4. Проверить, что опыт от квестов/кейсов правильно применяется
