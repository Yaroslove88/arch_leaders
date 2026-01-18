# Типы развития узлов (development_type)

## Обзор

Каждый узел в дереве способностей имеет поле `development_type`, которое определяет основной тип работы, необходимой для развития этой способности.

## Типы развития

| Тип | Описание | Основной контент |
|-----|----------|------------------|
| `practice` | Практический | Квесты, кейсы, реальные ситуации |
| `reflection` | Рефлексивный | Самоанализ, prompts, работа с паттернами |
| `theory` | Теоретический | Модели, концепции, примеры для анализа |
| `mixed` | Смешанный | Комбинация нескольких типов |

---

## Practice (Практический)

### Характеристики
- Требует реальных ситуаций, действий, обратной связи
- Развивается через практику в реальной жизни
- Фокус на действия и результаты

### Контент
- Квесты с конкретными действиями
- Кейсы для разбора
- Ситуации для практики

### Узлы типа Practice

**Архитектурное мышление:**
- `node_architecture_coupling` - Архитектура сцепки
- `node_field_of_differences` - Поле различий
- `node_form_assembly` - Сборка форм
- `node_containment` - Контейнирование
- `node_thinking_through_form` - Мышление через форму

**Ответственность:**
- `node_responsibility_sag_diagnosis` - Диагностика провисания ответственности
- `node_delegation_as_coupling` - Делегирование как сцепка
- `node_upper_field_work` - Работа с верхним полем
- `node_leader_liberation` - Освобождение лидера
- `node_shared_leadership` - Shared Leadership
- `node_psychological_ownership` - Психологическая собственность
- `node_collective_efficacy` - Коллективная эффективность

**Обратная связь:**
- `node_language_of_differences` - Язык различий
- `node_mirror_holder` - Window Gazer vs Mirror Holder

**Среда зрелости:**
- `node_subjectivity_transfer` - Передача субъектности
- `node_scene_holding` - Удержание сцены
- `node_institutionalization` - Институционализация
- `node_mature_parting` - Зрелое расставание

---

## Reflection (Рефлексивный)

### Характеристики
- Требует самоанализа, работы с паттернами
- Фокус на внутренний мир, детские сценарии, психологию
- Развивается через осознавание

### Контент
- `reflection_prompts` - Вопросы для самоанализа
- `situation_guidance` - "Принеси такую ситуацию..."
- Теоретическая база для понимания

### Узлы типа Reflection

**Субъектность:**
- `node_grounding_point` - Точка опоры
- `node_self_regulation` - Саморегуляция
- `node_role_differentiation` - Различение ролей
- `node_scenario_analysis` - Разбор сценария

**Устойчивость:**
- `node_personal_resilience` - Личная устойчивость
- `node_weak_zone_diagnosis` - Диагностика слабых зон
- `node_recovery_skills` - Навыки восстановления
- `node_emotional_work` - Работа с эмоциями
- `node_role_energy` - Энергия роли

---

## Theory (Теоретический)

### Характеристики
- Требует изучения концепций, моделей
- Фокус на понимание, анализ примеров
- Развивается через обучение и анализ

### Контент
- `theory_content.core_concepts` - Ключевые концепции
- `theory_content.models` - Модели и фреймворки
- `theory_content.examples_for_analysis` - Примеры для анализа

### Узлы типа Theory

**Архитектурное мышление:**
- `node_system_thinking` - Системное мышление
- `node_scenario_thinking` - Сценарное мышление

**Ответственность:**
- `node_responsibility_as_form` - Ответственность как форма

**Обратная связь:**
- `node_feedback_types` - Типы обратной связи
- `node_rede_model` - REDE Model

**Среда зрелости:**
- `node_maturity_environment` - Среда зрелости
- `node_vertical_development` - Vertical Development
- `node_ddo` - Deliberately Developmental Organization

---

## Mixed (Смешанный)

### Характеристики
- Комбинация нескольких типов развития
- Требует и теории, и рефлексии, и/или практики
- Многогранный подход

### Контент
- Комбинация контента из разных типов
- Может включать все виды: theory_content, reflection_prompts, практические задания

### Узлы типа Mixed

**Субъектность:**
- `node_subject_in_system` - Субъект в системе (reflection + theory)
- `node_decision_authorship` - Авторство решений (reflection + practice)

**Устойчивость:**
- `node_cognitive_maturity` - Когнитивная зрелость (theory + reflection)

**Обратная связь:**
- `node_feedback_through_vulnerability` - Приём обратной связи через уязвимость (reflection + practice)
- `node_feedforward` - Feedforward (theory + practice)

---

## Использование в системе

### В UI
- Показывать тип развития на карточке узла
- Фильтрация узлов по типу
- Разный визуальный стиль для разных типов

### В анализе ситуаций
- Предлагать контент в зависимости от типа узла
- Для reflection-узлов: показывать prompts
- Для theory-узлов: показывать теоретический материал
- Для practice-узлов: предлагать квесты и кейсы

### В рекомендациях
- Учитывать тип при генерации рекомендаций
- Балансировать развитие между разными типами

---

## Структура данных

### В seed файле (initial-ability-tree.json)

```json
{
  "node_id": "node_system_thinking",
  "development_type": "theory",
  ...
}
```

### В node-descriptions.json

```json
{
  "node_system_thinking": {
    "development_type": "theory",
    "situation_guidance": "...",
    "theory_content": {
      "core_concepts": [...],
      "models": [...],
      "examples_for_analysis": [...]
    }
  }
}
```

### Для reflection-узлов

```json
{
  "node_grounding_point": {
    "development_type": "reflection",
    "situation_guidance": "...",
    "reflection_prompts": [
      "Вопрос 1?",
      "Вопрос 2?",
      ...
    ]
  }
}
```

---

## Распределение по веткам

| Ветка | Practice | Reflection | Theory | Mixed |
|-------|----------|------------|--------|-------|
| Субъектность | 0 | 4 | 0 | 2 |
| Арх. мышление | 5 | 0 | 2 | 0 |
| Устойчивость | 0 | 5 | 0 | 1 |
| Ответственность | 7 | 0 | 1 | 0 |
| Обратная связь | 2 | 0 | 2 | 2 |
| Среда зрелости | 4 | 0 | 3 | 0 |
| **Итого** | **18** | **9** | **8** | **5** |

---

## Рекомендации

1. **Для Theory-узлов**: Изучите теоретический материал перед практикой
2. **Для Reflection-узлов**: Используйте prompts для самоанализа
3. **Для Practice-узлов**: Ищите реальные ситуации для практики
4. **Для Mixed-узлов**: Комбинируйте подходы в зависимости от контекста
