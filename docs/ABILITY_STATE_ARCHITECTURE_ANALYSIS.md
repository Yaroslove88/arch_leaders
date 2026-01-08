# Анализ архитектуры: UserAbilityState vs TreeSemantic

## 📊 Структура данных

### TreeSemantic (дерево способностей)
**Таблица:** `tree_semantic`
- `id`: String (tree_main или tree_user_${userId})
- `userId`: String? (null для глобального дерева)
- `data`: JSON (полное SemanticTree)
- `tree_revision`: Int

**Структура узла в дереве (AbilityNode):**
```typescript
{
  node_id: string;
  name: string;
  description: string;
  branch_id: string;
  tier: 'basic' | 'intermediate' | 'advanced';
  state: 'locked' | 'available' | 'active' | 'unlocked' | 'integrated';
  unlock_conditions: any;
  integration_level: 'Novice' | 'Integrated' | 'Embodied';
  xp_required: number;
  xp_current: number;  // ← Прогресс в опыте
}
```

**Назначение:**
- Хранит полное дерево способностей (структура + прогресс)
- Используется для отображения дерева в UI
- Содержит XP и состояние разблокировки узлов
- Обновляется при завершении квестов, начислении XP

### UserAbilityState (аналитическое состояние)
**Таблица:** `user_ability_state`
- `user_id`: String
- `node_id`: String
- `state`: String (locked, available, active, unlocked, integrated)
- `progress`: Decimal (0..1+) - прогресс в долях
- `relevance`: Decimal - актуальность узла для пользователя
- `last_updated_at`: DateTime

**Назначение:**
- Хранит аналитическое состояние узлов на основе сигналов из сессий
- Обновляется через `AbilityStateService.applySignals()`
- Используется для анализа и рекомендаций
- Содержит `relevance` - метрику, которой нет в дереве

## 🔍 Ключевые различия

| Аспект | TreeSemantic | UserAbilityState |
|--------|--------------|------------------|
| **Структура** | Полное дерево (JSON) | Отдельные записи по узлам |
| **Прогресс** | `xp_current` / `xp_required` (абсолютные значения) | `progress` (0..1+, относительное) |
| **Метрики** | XP, state, unlock_conditions | state, progress, **relevance** |
| **Обновление** | При завершении квестов, начислении XP | При анализе сессий через сигналы |
| **Источник данных** | Квесты, ручные обновления | Анализ текста сессий (LLM) |
| **Использование** | Отображение дерева, билды | Аналитика, рекомендации |

## 🔄 Текущее состояние синхронизации

### ❌ Синхронизация НЕ реализована

1. **Обновление TreeSemantic:**
   - Происходит через `TreeService.updateNodeProgress()` при завершении квестов
   - Обновляет `xp_current` и `state` в дереве

2. **Обновление UserAbilityState:**
   - Происходит через `AbilityStateService.applySignals()` при анализе сессий
   - Обновляет `state`, `progress`, `relevance`
   - **НЕ синхронизирует с TreeSemantic**

3. **Проблема:**
   - Две системы могут иметь разные значения `state` для одного узла
   - `xp_current` в дереве и `progress` в UserAbilityState не связаны
   - Изменения в одной системе не отражаются в другой

## 🤔 Должны ли они синхронизироваться?

### Вариант 1: Разные системы (текущее состояние) ✅
**Аргументы ЗА:**
- Разные источники данных (квесты vs анализ сессий)
- Разные метрики (XP vs progress + relevance)
- Разные цели использования (отображение vs аналитика)
- `relevance` есть только в UserAbilityState

**Аргументы ПРОТИВ:**
- Могут расходиться значения `state`
- Дублирование данных
- Потенциальная путаница для пользователя

### Вариант 2: Синхронизация (рекомендуется) ⚠️
**Архитектура:**
- `TreeSemantic` - источник истины для `state` и `xp_current`
- `UserAbilityState` - дополняет `relevance` и аналитику
- При обновлении TreeSemantic → синхронизировать `state` в UserAbilityState
- При обновлении UserAbilityState → обновлять только `relevance`, не трогать `state`

**Преимущества:**
- Единый источник истины для `state`
- Синхронизация данных
- Меньше путаницы

**Недостатки:**
- Нужна дополнительная логика синхронизации
- Возможны конфликты при одновременных обновлениях

## 📝 Рекомендации

### Вариант A: Минимальная синхронизация (рекомендуется)
1. **TreeSemantic - источник истины для `state`:**
   - При обновлении `state` в TreeSemantic → обновлять `state` в UserAbilityState
   - При обновлении `xp_current` → пересчитывать `progress` в UserAbilityState (если нужно)

2. **UserAbilityState - только для аналитики:**
   - Обновлять только `relevance` при анализе сессий
   - Не обновлять `state` напрямую (только через синхронизацию)

3. **Реализация:**
   ```typescript
   // В TreeService.updateNodeProgress()
   await this.updateNodeProgress(nodeId, xpDelta, userId);
   // После обновления дерева:
   await this.syncStateToUserAbilityState(userId, nodeId, newState);
   ```

### Вариант B: Полная синхронизация
1. При любом обновлении TreeSemantic → обновлять UserAbilityState
2. При обновлении UserAbilityState → обновлять TreeSemantic (только `state`, не XP)
3. Использовать транзакции для атомарности

### Вариант C: Оставить как есть
1. Документировать, что это две разные системы
2. Использовать TreeSemantic для отображения дерева
3. Использовать UserAbilityState только для аналитики
4. Принять, что `state` может расходиться

## 🔧 Текущее использование в коде

### Где обновляется TreeSemantic:
- `TreeService.updateNodeProgress()` - при завершении квестов
- `TreeService.applyChange()` - при ручных изменениях дерева
- `QuestsService.complete()` - вызывает `updateNodeProgress()`

### Где обновляется UserAbilityState:
- `AbilityStateService.applySignals()` - при анализе сессий
- `PipelineService.runApply()` - вызывает `applySignals()`

### Где используются вместе:
- Комментарий в `PipelineService`: "Этап 4: Apply (изменение состояния: tree/userAbilityState)"
- Но фактической синхронизации нет

## ✅ Выводы

1. **Текущее состояние:** Две независимые системы без синхронизации
2. **Проблема:** Могут расходиться значения `state` для одного узла
3. **Рекомендация:** Реализовать минимальную синхронизацию (Вариант A)
   - TreeSemantic - источник истины для `state`
   - UserAbilityState - только для `relevance` и аналитики
   - Синхронизировать `state` при обновлении TreeSemantic

4. **Приоритет:** Средний (не критично, но желательно для консистентности)

