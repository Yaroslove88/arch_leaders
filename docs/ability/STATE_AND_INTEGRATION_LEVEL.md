# Связь state и integration_level в дереве способностей

## Обзор

В системе существуют **два параметра** для отслеживания прогресса узла способности:

1. **state** - статус разблокировки (техническое состояние)
2. **integration_level** - уровень интеграции (качественное освоение)

Эти параметры связаны через прогресс XP и автоматически синхронизируются.

---

## State (Статус разблокировки)

| Статус | Описание | Условие перехода |
|--------|----------|------------------|
| `locked` | Узел заблокирован, недоступен | Начальное состояние |
| `available` | Узел доступен для работы | XP > 0 или выполнены unlock_conditions |
| `active` | Пользователь активно работает | XP >= 30% от xp_required |
| `unlocked` | Узел разблокирован | XP >= 100% от xp_required |
| `integrated` | Полностью интегрирован | XP >= 150% от xp_required |

### Где хранится
- **TreeSemantic**: `data.nodes[].state`
- **UserAbilityState**: `state`
- **Источник истины**: TreeSemantic

---

## Integration Level (Уровень интеграции)

| Уровень | Описание | Поведение |
|---------|----------|-----------|
| `Novice` | Новичок | Может применять в простых ситуациях, требуется усилие |
| `Integrated` | Интегрировано | Регулярно применяет, это становится привычкой |
| `Embodied` | Воплощено | Естественная часть поведения, применяется автоматически |

### Где хранится
- **TreeSemantic**: `data.nodes[].integration_level`
- **node-descriptions.json**: `integration_levels` (описания для каждого уровня)

---

## Связь state и integration_level

```
Прогресс XP:  0%  ──────  30%  ──────  70%  ──────  100%  ──────  150%+
              │           │            │             │              │
State:     locked    available/    active       unlocked       integrated
                      active
              │           │            │             │              │
Integration: Novice ────────────────────────────── Integrated ── Embodied
```

### Автоматические переходы

При обновлении XP через `TreeService.updateNodeProgress()`:

```typescript
if (progressPercent >= 150) {
  state = 'integrated';
  integrationLevel = 'Embodied';
} else if (progressPercent >= 100) {
  state = 'unlocked';
  integrationLevel = 'Integrated';
} else if (progressPercent >= 30) {
  state = 'active';
  integrationLevel = 'Novice';
} else if (progressPercent > 0) {
  state = 'available';
  integrationLevel = 'Novice';
} else {
  state = 'locked';
  integrationLevel = 'Novice';
}
```

---

## Использование в UI

### На карточке узла
- **Иконка замка**: state === 'locked'
- **Прогресс-бар**: xp_current / xp_required
- **Бейдж уровня**: integration_level (Novice/Integrated/Embodied)

### В детальном описании узла
Показываем три уровня интеграции из `nodeDescription.integration_levels`:

```json
{
  "integration_levels": {
    "Novice": "Могу найти точку опоры в простых ситуациях",
    "Integrated": "Регулярно опираюсь на внутреннюю устойчивость",
    "Embodied": "Точка опоры всегда доступна, это часть меня"
  }
}
```

Текущий уровень пользователя подсвечивается.

---

## Синхронизация между системами

### TreeSemantic → UserAbilityState

При изменении state в TreeSemantic автоматически обновляется state в UserAbilityState:

```typescript
// В TreeService
await this.syncStateToUserAbilityState(userId, nodeId, newState);
```

### UserAbilityState → TreeSemantic

**НЕ происходит автоматически**. UserAbilityState используется для:
- Аналитики (relevance, last_activity_date)
- Сигналов из анализа сессий

**TreeSemantic является источником истины для state и integration_level.**

---

## Пороговые значения

| Прогресс | State | Integration Level | XP (при xp_required=500) |
|----------|-------|-------------------|--------------------------|
| 0% | locked | Novice | 0 |
| 1-29% | available | Novice | 1-144 |
| 30-69% | active | Novice | 150-344 |
| 70-99% | active | Novice | 350-494 |
| 100-149% | unlocked | Integrated | 500-749 |
| 150%+ | integrated | Embodied | 750+ |

---

## Рекомендации по реализации

### Для нового узла
1. Начальный state: `locked` (или `available` для базовых узлов)
2. Начальный integration_level: `Novice`
3. xp_current: 0

### При завершении квеста
1. Вызвать `TreeService.updateNodeProgress(nodeId, xpDelta, userId)`
2. Система автоматически обновит state и integration_level
3. Синхронизируется с UserAbilityState

### При анализе сессии
1. Обновляется только relevance в UserAbilityState
2. State НЕ меняется из анализа (только из квестов/кейсов)

---

## FAQ

**Q: Может ли state откатиться назад?**
A: Нет, state только увеличивается. XP может уменьшаться теоретически, но state сохраняется.

**Q: Как узел становится "available" без XP?**
A: Базовые узлы (tier: "basic") имеют xp_required: 0 и автоматически доступны.

**Q: Почему integration_level и state дублируют друг друга?**
A: Они дополняют друг друга:
- state = техническое состояние (можно ли работать с узлом)
- integration_level = качественное описание (как хорошо освоено)

**Q: Где настроить пороги?**
A: В `TreeService.updateNodeProgress()` и в документации выше. Значения 30%, 100%, 150% являются текущими дефолтами.
