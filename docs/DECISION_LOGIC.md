# Логика принятия решений системы Leadership Architect

> **Дата создания:** 2026-01-14
> **Статус:** Актуальная
> **Связанный код:** `packages/shared/src/ontology.ts`

---

## Введение

Этот документ описывает логику принятия решений системой Leadership Architect.
Все автоматические решения системы должны быть объяснимыми и основываться на
определённых правилах и принципах.

---

## 1. Принципы принятия решений

### 1.1. Прозрачность (Explainability)

Каждое решение системы должно сопровождаться `rationale`:

```typescript
interface Rationale {
  summary: string;        // Краткое объяснение
  reasons: string[];      // Причины решения
  evidenceLinks?: string[]; // Ссылки на evidence
  linkedNodes?: string[]; // Связанные узлы дерева
  confidence?: number;    // Уверенность (0-1)
}
```

### 1.2. Детерминизм

При одинаковых входных данных система должна принимать одинаковые решения.
Исключение: LLM-компоненты, где допускается вариативность.

### 1.3. Консервативность

При неопределённости система выбирает более консервативное решение
(меньше XP, ниже уровень, требуется больше evidence).

---

## 2. Логика анализа ситуации (Entry → Session)

### 2.1. Входные данные

```
Entry {
  text: string           // Описание ситуации
  type: 'situation' | ...
  participants: string[]
  context_json: object
}
```

### 2.2. Процесс анализа

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Entry     │ ──▶ │  LLM Service │ ──▶ │   Session   │
│             │     │              │     │             │
│ text        │     │ Извлечение:  │     │ themes      │
│ context     │     │ - themes     │     │ patterns    │
│             │     │ - patterns   │     │ tensions    │
└─────────────┘     │ - tensions   │     │ insights    │
                    │ - signals    │     │ ability_signals
                    └──────────────┘     └─────────────┘
```

### 2.3. Правила извлечения ability_signals

1. Каждый ability_signal должен быть связан с существующим node_id
2. Signal strength определяется по:
   - Явное упоминание способности в тексте: +0.3
   - Контекстное упоминание: +0.2
   - Связь с другими паттернами: +0.1

### 2.4. Rationale для анализа

```typescript
{
  summary: "Анализ выявил 3 ключевые темы и 2 ability signals",
  reasons: [
    "Тема 'делегирование' определена по ключевым словам",
    "Signal 'node_responsibility_as_form' связан с паттерном принятия решений"
  ],
  linkedNodes: ["node_responsibility_as_form", "node_feedback_types"],
  confidence: 0.85
}
```

---

## 3. Логика генерации квестов (Session → Quest)

### 3.1. Триггеры генерации

1. **Завершение анализа Session** → асинхронная генерация
2. **Ручной запрос пользователя** → синхронная генерация
3. **Системный cron** → генерация недельных квестов

### 3.2. Правила генерации

```
Входные данные:
- ability_signals из Session
- Текущее состояние дерева пользователя
- История квестов пользователя
- Контекст ситуации

Алгоритм:
1. Отфильтровать signals с strength < 0.3
2. Для каждого signal:
   a. Найти соответствующий node в дереве
   b. Проверить state узла (available/active → можно генерить)
   c. Проверить лимит активных квестов (max 5)
3. Выбрать тип квеста:
   - Если срочно → micro
   - Если требует практики → weekly
   - Если сложная тема → story
4. Сгенерировать через QuestEngine + LLM
```

### 3.3. Структура квеста

```typescript
Quest {
  title: string
  description: string
  type: 'micro' | 'weekly' | 'story' | 'in-person'
  criteria: {
    type: string
    target: string
    description: string
    theory_and_examples?: string
  }
  reward: { xp: number }
  linked_nodes: string[]
  rationale: Rationale  // ← ОБЯЗАТЕЛЬНО
}
```

### 3.4. Rationale для квеста

```typescript
{
  summary: "Квест создан для развития способности X на основе ситуации Y",
  reasons: [
    "В анализе выявлен signal 'node_X' с strength 0.7",
    "Узел в состоянии 'active', прогресс 45%",
    "Пользователь не выполнял квестов на этом узле 7 дней"
  ],
  evidenceLinks: ["session_123"],
  linkedNodes: ["node_X"],
  confidence: 0.8
}
```

---

## 4. Логика обновления дерева (XP → State)

### 4.1. Источники XP

| Источник | XP | Условие |
|----------|-----|---------|
| Завершение квеста | 5-50 | По типу квеста |
| Решение кейса | 5-15 | По сложности |
| Добавление evidence | 2-5 | Релевантность |
| Регулярная активность | 1-3 | Streak bonus |

### 4.2. Правила изменения state

```
progress = (xp_current / xp_required) * 100

if progress >= 150%:
  state = 'integrated'
  integration_level = 'Embodied'
  
elif progress >= 100%:
  state = 'unlocked'
  integration_level = 'Integrated'
  
elif progress >= 30%:
  state = 'active'
  integration_level = 'Novice'
  
elif progress > 0%:
  state = 'available'
  integration_level = 'Novice'
```

### 4.3. Каскадная разблокировка

При изменении узла в `unlocked` или `integrated`:

```
1. Найти все узлы, у которых этот узел в prerequisites
2. Для каждого найденного узла:
   a. Проверить, все ли prerequisites выполнены
   b. Если да → изменить state на 'available'
   c. Создать ChangeLog запись с rationale
```

### 4.4. Rationale для изменения дерева

```typescript
{
  summary: "Узел 'node_X' разблокирован, открыто 2 зависимых узла",
  reasons: [
    "Достигнут прогресс 100% (xp: 100/100)",
    "Источник XP: завершение квеста 'quest_123'",
    "Зависимые узлы: node_Y, node_Z теперь доступны"
  ],
  evidenceLinks: ["quest_123", "evidence_456"],
  linkedNodes: ["node_X", "node_Y", "node_Z"],
  confidence: 1.0
}
```

---

## 5. Логика доступности кейсов

### 5.1. Правила доступа

```
Basic кейсы:
  - Условие: ≥1 завершённый квест на узле
  
Intermediate кейсы:
  - Условие: progress ≥30% ИЛИ ≥1 решённый basic кейс
  
Advanced кейсы:
  - Условие: progress ≥60% ИЛИ (≥2 кейса + ≥1 intermediate)
```

### 5.2. Ранжирование кейсов

```
Приоритет:
1. Доступные → Недоступные → Завершённые
2. По уровню узла (tier: basic → intermediate → advanced)
3. По node_id (группировка)
4. По сложности кейса
```

---

## 6. Логика обнаружения билдов

### 6.1. Критерии обнаружения

```
Билд обнаруживается когда:
- ≥3 узла в состоянии unlocked/integrated
- Узлы принадлежат паттерну билда
- Средний уровень интеграции ≥ Integrated
```

### 6.2. Паттерны билдов

| Билд | Требуемые узлы | Описание |
|------|----------------|----------|
| Architect | architecture_*, systems_* | Строит системы |
| Strategist | vision_*, planning_* | Долгосрочное видение |
| Catalyst | change_*, initiative_* | Запускает изменения |
| Coordinator | communication_*, alignment_* | Связывает людей |
| Mentor | development_*, feedback_* | Развивает других |

### 6.3. Влияние билда на систему

1. **Персонализация квестов**: акцент на сильные стороны
2. **Интерпретация ситуаций**: через призму билда
3. **Рекомендации**: комплементарные способности

---

## 7. Границы метода

### 7.1. Что система НЕ делает

1. **Не диагностирует** психологические проблемы
2. **Не заменяет** коучинг или терапию
3. **Не оценивает** личность пользователя
4. **Не сравнивает** пользователей между собой

### 7.2. Этические ограничения

1. Все данные принадлежат пользователю
2. Система не продаёт и не передаёт данные
3. LLM не получает персональные данные без согласия
4. Пользователь может удалить все свои данные

### 7.3. Ограничения метода

1. **Не подходит для кризисных ситуаций**
2. **Не заменяет обратную связь от реальных людей**
3. **Развитие требует действий в реальности**, не только в приложении

---

## 8. Версионирование логики

### 8.1. Текущая версия

```
Decision Logic Version: 1.0.0
Last Updated: 2026-01-14
```

### 8.2. Changelog

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.0.0 | 2026-01-14 | Первоначальная версия |

---

## Связанные документы

- [ontology.ts](../packages/shared/src/ontology.ts) — типы и константы
- [PROJECT_MATURITY_AUDIT_REPORT.md](./audit/PROJECT_MATURITY_AUDIT_REPORT.md) — аудит
- [ARCHITECTURE_DATA_GUIDE_RU.md](./ARCHITECTURE_DATA_GUIDE_RU.md) — архитектура данных
- [gap-analysis-bmad.md](../../projects/leadership-architect-docs/gap-analysis-bmad.md) — Gap Analysis
