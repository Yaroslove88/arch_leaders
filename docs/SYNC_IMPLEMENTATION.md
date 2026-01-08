# Реализация синхронизации TreeSemantic ↔ UserAbilityState

## ✅ Реализовано

### 1. Метод синхронизации в TreeService

Добавлен приватный метод `syncStateToUserAbilityState()`, который:
- Синхронизирует `state` из TreeSemantic в UserAbilityState
- Обновляет существующую запись или создает новую
- Сохраняет `progress` и `relevance` в UserAbilityState
- Логирует ошибки, но не прерывает выполнение

### 2. Автоматическая синхронизация при обновлении TreeSemantic

#### В `updateNodeProgress()`:
- После обновления XP и state в дереве
- Синхронизирует state, если он изменился

#### В `applyChange()`:
- После применения операций к дереву
- Синхронизирует state для всех узлов, у которых изменился state
- Вызывается через `syncStateChangesToUserAbilityState()`

### 3. Защита в AbilityStateService

Обновлена логика `applyChangesToDatabase()`:
- Обновляет `progress` и `relevance` всегда
- Обновляет `state` только для аналитических состояний (`active`, `available`)
- Не перезаписывает критичные состояния (`locked`, `unlocked`, `integrated`) - они синхронизируются из TreeSemantic

## 🔄 Поток синхронизации

### Сценарий 1: Завершение квеста
```
QuestsService.complete()
  → TreeService.updateNodeProgress(nodeId, xpDelta, userId)
    → TreeService.applyChange() [обновляет TreeSemantic]
    → TreeService.syncStateToUserAbilityState() [синхронизирует state]
```

### Сценарий 2: Ручное изменение дерева
```
TreeController.applyChange()
  → TreeService.applyChange()
    → Обновляет TreeSemantic
    → TreeService.syncStateChangesToUserAbilityState()
      → Для каждого измененного узла: syncStateToUserAbilityState()
```

### Сценарий 3: Анализ сессии
```
PipelineService.runApply()
  → AbilityStateService.applySignals()
    → Обновляет UserAbilityState (только relevance, progress, аналитические state)
    → НЕ перезаписывает locked/unlocked/integrated
```

## 📋 Правила синхронизации

1. **TreeSemantic - источник истины для `state`:**
   - Все изменения `state` в TreeSemantic автоматически синхронизируются в UserAbilityState
   - Критичные состояния (`locked`, `unlocked`, `integrated`) управляются только через TreeSemantic

2. **UserAbilityState - аналитика:**
   - Обновляет `relevance` и `progress` на основе анализа сессий
   - Может обновлять аналитические состояния (`active`, `available`)
   - НЕ перезаписывает критичные состояния из TreeSemantic

3. **Приоритет состояний:**
   - `locked` / `unlocked` / `integrated` → из TreeSemantic (приоритет)
   - `active` / `available` → могут быть из анализа сессий или TreeSemantic

## 🧪 Тестирование

### Проверка синхронизации:
1. Завершить квест → проверить, что state синхронизирован в UserAbilityState
2. Обновить state в дереве → проверить синхронизацию
3. Обновить relevance в UserAbilityState → проверить, что state не перезаписан

### Ожидаемое поведение:
- State в UserAbilityState соответствует state в TreeSemantic для критичных состояний
- Relevance и progress обновляются независимо
- Аналитические состояния могут отличаться

## 📝 Примечания

- Синхронизация выполняется асинхронно и не блокирует основную операцию
- Ошибки синхронизации логируются, но не прерывают выполнение
- Для новых узлов создается запись в UserAbilityState при первой синхронизации

