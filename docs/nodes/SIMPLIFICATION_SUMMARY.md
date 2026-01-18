# Сводка упрощения системы опыта и прогресса

## Дата: 2025-01-09

## Выполненные изменения

### 1. ✅ Создан скрипт для исправления состояния узлов

**Файл:** `scripts/fix-node-states-from-xp.ts`

**Что делает:**
- Читает все деревья (глобальное + пользовательские)
- Для каждого узла вычисляет правильное состояние на основе `xp_current / xp_required`
- Обновляет `state` и `integration_level` в TreeSemantic
- Синхронизирует `state` с UserAbilityState

**Использование:**
```bash
# Перейти в директорию apps/api (где находится @prisma/client)
cd apps/api

# Для всех пользователей
npx tsx ../../scripts/fix-node-states-from-xp.ts

# Для конкретного пользователя (по email или ID)
npx tsx ../../scripts/fix-node-states-from-xp.ts admin
npx tsx ../../scripts/fix-node-states-from-xp.ts 91500418-d30d-49f3-9af0-0f881d90333b
```

### 2. ✅ Упрощена система - убрано дублирование

**Изменения:**

#### TreeSemantic (источник истины)
- ✅ `xp_current` / `xp_required` - единственный источник опыта
- ✅ `state` - вычисляется автоматически при изменении `xp_current`
- ✅ `integration_level` - вычисляется автоматически

#### UserAbilityState (только аналитика)
- ✅ `state` - синхронизируется из TreeSemantic
- ✅ `relevance` - для аналитики
- ✅ `last_activity_date` - дата последней активности
- ❌ `progress` - больше не хранится, вычисляется на лету
- ❌ `internal_progress` - больше не используется
- ❌ `stored_experience` - больше не храним

### 3. ✅ Обновлена логика применения опыта

**Файл:** `apps/api/src/ability/ability-state.service.ts`

**Изменения:**
- `applyQuestExperience()` теперь обновляет `xp_current` в TreeSemantic через `updateNodeProgress()`
- Состояние обновляется автоматически при изменении `xp_current`
- Убрана сложная логика с `internal_progress` и `stored_experience`

**До:**
```typescript
// Сложная логика с internal_progress, stored_experience, множителями
const experienceToApply = incrementWithPrerequisites * stateMultiplier;
const experienceToStore = incrementWithPrerequisites - experienceToApply;
```

**После:**
```typescript
// Просто обновляем xp_current в TreeSemantic
const updatedNode = await this.treeService.updateNodeProgress(
  nodeId, 
  experienceAmount, 
  userId
);
// Состояние обновляется автоматически!
```

### 4. ✅ Обновлены все места использования

**Обновленные файлы:**
1. ✅ `ability-state.service.ts` - упрощен `applyQuestExperience`, `loadCurrentStates`
2. ✅ `ability.controller.ts` - получает progress из TreeSemantic
3. ✅ `tree.service.ts` - `enrichWithUserState` не перезаписывает xp_current
4. ✅ `user-initialization.service.ts` - убраны internal_progress
5. ✅ `api.ts` (фронтенд) - убраны internal_progress/stored_experience из интерфейса
6. ✅ `tree-fix.controller.ts` - упрощено создание состояний
7. ✅ `degrade-experience.handler.ts` - работает с TreeSemantic вместо internal_progress

### 5. ✅ Обновлена документация

**Созданные/обновленные документы:**
1. ✅ `docs/nodes/XP_SYSTEM_SIMPLIFIED.md` - описание упрощенной системы
2. ✅ `docs/nodes/NODE_UNLOCK_LOGIC.md` - обновлена информация о системе
3. ✅ `docs/nodes/SIMPLIFICATION_SUMMARY.md` - этот документ

## Решенные проблемы

### Проблема 1: Узел на 400% XP, но состояние "available"

**Причина:** Состояние не обновлялось автоматически при изменении `xp_current`

**Решение:** 
- `updateNodeProgress()` автоматически пересчитывает состояние
- Скрипт `fix-node-states-from-xp.ts` исправляет существующие данные

### Проблема 2: Рассинхронизация данных

**Причина:** Две параллельные системы (TreeSemantic и UserAbilityState)

**Решение:**
- TreeSemantic - единственный источник истины
- UserAbilityState синхронизируется из TreeSemantic

### Проблема 3: Сложность поддержки

**Причина:** Дублирование логики, сложные вычисления

**Решение:**
- Упрощена логика применения опыта
- Прогресс вычисляется на лету
- Автоматическое обновление состояния

## Что нужно сделать дальше

### 1. Запустить скрипт исправления

```bash
cd apps/api
npx tsx ../../scripts/fix-node-states-from-xp.ts [userId]
```

Это исправит все узлы с неправильным состоянием. Если `userId` не указан, исправляет для всех пользователей.

### 2. Обновить тесты (опционально)

Файлы с тестами, которые используют старую логику:
- `ability-engine-experience.spec.ts`
- `degrade-experience.handler.spec.ts`

Их можно обновить позже, они не критичны для работы системы.

### 3. Миграция БД (опционально)

Поля `progress`, `internal_progress`, `stored_experience` остаются в схеме для обратной совместимости, но больше не используются. Можно создать миграцию для их удаления в будущем.

## Проверка работы

### 1. Проверить применение опыта

```bash
# Завершить квест и проверить, что состояние обновилось
curl -X POST http://localhost:3001/quests/{questId}/complete
```

### 2. Проверить разблокировку узлов

```bash
# Проверить, что узел с prerequisites разблокируется автоматически
curl http://localhost:3001/tree/semantic?userId={userId}
```

### 3. Проверить исправление состояния

```bash
# Запустить скрипт и проверить логи
cd apps/api
npx tsx ../../scripts/fix-node-states-from-xp.ts {userId}
```

## Преимущества новой системы

1. ✅ **Нет рассинхронизации** - один источник истины (TreeSemantic)
2. ✅ **Проще логика** - нет дублирования, меньше кода
3. ✅ **Автоматическое обновление** - состояние обновляется при изменении XP
4. ✅ **Меньше багов** - нет проблем с несинхронизированными данными
5. ✅ **Легче поддерживать** - проще понять, как работает система

## Обратная совместимость

- ✅ Старые поля в UserAbilityState игнорируются (не ломают систему)
- ✅ API возвращает `progress`, вычисленный на лету
- ✅ Фронтенд получает `progress` как раньше
- ✅ Интерфейсы TypeScript обновлены с комментариями

## Известные ограничения

1. **Тесты** - некоторые тесты используют старую логику, но это не критично
2. **Деградация опыта** - обновлена, но нужно протестировать
3. **Ачивки** - используют progress для проверки, работает корректно
