# Контент узлов (Nodes)

**Дата генерации:** 2026-01-10  
**Количество узлов с контентом:** 40

---

## Описание

Этот документ содержит только **контентные данные** узлов из `node-descriptions.json`.

## Схема данных

```typescript
interface NodeContent {
  name: string;
  full_description?: string;
  practical_meaning?: string;
  examples?: string[];
  integration_levels?: {
    Novice?: string;
    Integrated?: string;
    Embodied?: string;
  };
  development_type?: string;
  situation_guidance?: string;
  reflection_prompts?: string[];
}
```

## Поля контента

| Поле | Тип | Описание |
|------|-----|----------|
| `name` | `string` | Название узла (обязательное) |
| `full_description` | `string?` | Полное описание способности |
| `practical_meaning` | `string?` | Практическое значение |
| `examples` | `string[]?` | Примеры использования |
| `integration_levels` | `object?` | Уровни интеграции (Novice, Integrated, Embodied) |
| `development_type` | `string?` | Тип развития (reflection, action, etc.) |
| `situation_guidance` | `string?` | Руководство по ситуациям |
| `reflection_prompts` | `string[]?` | Промпты для рефлексии |

## Статистика

- **Всего узлов с контентом**: 40
- **Узлов с примерами**: 40
- **Узлов с промптами рефлексии**: 13

### По типу развития (development_type)

- **reflection**: 9 узлов
- **mixed**: 5 узлов
- **practice**: 18 узлов
- **theory**: 8 узлов

## Примеры

### Пример 1: node_grounding_point

```json
{
  "name": "Точка опоры",
  "development_type": "reflection",
  "full_description": "Внутренняя устойчивость. Основа субъектности. Способность иметь внутреннюю опору, на которую можно опереться в сложных ситуациях.",
  "practical_meaning": "Иметь внутреннюю точку опоры, которая не зависит от внешних обстоятельств. Это основа для всех других способностей субъектности.",
  "examples": [
    "В сложной ситуации вернуться к своим ценностям и принципам",
    "При давлении опереться на внутреннюю ясность",
    "В неопределенности удержать связь с собой"
  ],
  "integration_levels": {
    "Novice": "Могу найти точку опоры в простых ситуациях",
    "Integrated": "Регулярно опираюсь на внутреннюю устойчивость",
    "Embodied": "Точка опоры всегда доступна, это часть меня"
  },
  "situation_guidance": "Опишите ситуацию, где вы потеряли опору: сильная эмоциональная реакция, ощущение 'выбило из колеи', потеря уверенности в своих действиях. Что вы чувствовали? Что помогло или не помогло вернуть устойчивость?",
  "reflection_prompts": [
    "Когда вы последний раз чувствовали внутреннюю устойчивость? Что её создавало?",
    "Какие ценности для вас являются опорой в сложных ситуациях?",
    "Вспомните момент, когда вас 'выбило из колеи'. Что именно произошло?",
    "Что для вас означает 'быть в себе' vs 'потерять себя'?",
    "Какие триггеры чаще всего выбивают вас из состояния устойчивости?"
  ]
}
```

### Пример 2: node_self_regulation

```json
{
  "name": "Саморегуляция",
  "development_type": "reflection",
  "full_description": "Управление состоянием на трёх уровнях: телесный, эмоциональный, когнитивный. Способность регулировать своё состояние, а не быть им управляемым.",
  "practical_meaning": "Управлять своим состоянием на всех уровнях: телесном (напряжение, дыхание), эмоциональном (эмоции), когнитивном (мысли).",
  "examples": [
    "В стрессе заметить телесное напряжение и расслабить его",
    "При сильной эмоции не действовать из неё, а сначала отрегулировать",
    "В хаосе мыслей сделать паузу и упорядочить"
  ],
  "integration_levels": {
    "Novice": "Могу заметить и отрегулировать состояние на одном уровне",
    "Integrated": "Регулярно управляю состоянием на всех трёх уровнях",
    "Embodied": "Саморегуляция происходит естественно, почти автоматически"
  },
  "situation_guidance": "Опишите ситуацию, где вас 'захватило' состояние: сильный стресс, гнев, тревога, паника. Как вы заметили своё состояние (или не заметили)? Как справились или не справились?",
  "reflection_prompts": [
    "На каком уровне вам легче всего замечать своё состояние: тело, эмоции или мысли?",
    "Какой уровень саморегуляции для вас самый сложный?",
    "Вспомните ситуацию, когда вы действовали из сильной эмоции. Что бы вы сделали иначе?",
    "Какие телесные сигналы говорят вам о стрессе?",
    "Какие практики саморегуляции вы уже используете? Насколько они эффективны?"
  ]
}
```

### Пример 3: node_role_differentiation

```json
{
  "name": "Различение ролей",
  "development_type": "reflection",
  "full_description": "Осознание внутренних ролей. Понимание, какая роль сейчас активна, и способность выбирать роль уместно.",
  "practical_meaning": "Видеть, какая внутренняя роль сейчас активна (спасатель, контролёр, критик и т.д.), и выбирать роль уместно ситуации.",
  "examples": [
    "Заметить, что сейчас активна роль \"спасателя\"",
    "Выбрать роль \"архитектора\" вместо \"решателя\"",
    "Различить, когда роль уместна, а когда нет"
  ],
  "integration_levels": {
    "Novice": "Могу заметить свою роль постфактум",
    "Integrated": "Регулярно различаю роли и выбираю уместную",
    "Embodied": "Естественно различаю роли, это часть моего мышления"
  },
  "situation_guidance": "Опишите ситуацию, где вы действовали 'не как руководитель' — как ребёнок, спасатель, жертва, контролёр. Какая роль активировалась? Откуда она? Как вы это заметили (если заметили)?",
  "reflection_prompts": [
    "Какие роли вы чаще всего играете на работе? А в личной жизни?",
    "Вспомните ситуацию, где вы были 'спасателем'. Что вас в эту роль привело?",
    "Какая роль активируется у вас в конфликтных ситуациях?",
    "Откуда пришла ваша самая частая роль? Из детства? Из прошлого опыта?",
    "Какую роль вы хотели бы выбирать осознанно, но пока не получается?"
  ]
}
```


## Все узлы (контент)

### 1. node_grounding_point

- **Name**: Точка опоры
- **Full Description**: Внутренняя устойчивость. Основа субъектности. Способность иметь внутреннюю опору, на которую можно опереться в сложных ситуациях.
- **Practical Meaning**: Иметь внутреннюю точку опоры, которая не зависит от внешних обстоятельств. Это основа для всех других способностей субъектности.
- **Development Type**: `reflection`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied
- **Reflection Prompts**: 5 промптов



### 2. node_self_regulation

- **Name**: Саморегуляция
- **Full Description**: Управление состоянием на трёх уровнях: телесный, эмоциональный, когнитивный. Способность регулировать своё состояние, а не быть им управляемым.
- **Practical Meaning**: Управлять своим состоянием на всех уровнях: телесном (напряжение, дыхание), эмоциональном (эмоции), когнитивном (мысли).
- **Development Type**: `reflection`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied
- **Reflection Prompts**: 5 промптов



### 3. node_role_differentiation

- **Name**: Различение ролей
- **Full Description**: Осознание внутренних ролей. Понимание, какая роль сейчас активна, и способность выбирать роль уместно.
- **Practical Meaning**: Видеть, какая внутренняя роль сейчас активна (спасатель, контролёр, критик и т.д.), и выбирать роль уместно ситуации.
- **Development Type**: `reflection`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied
- **Reflection Prompts**: 5 промптов



### 4. node_scenario_analysis

- **Name**: Разбор сценария
- **Full Description**: Понимание жизненных паттернов. Видение повторяющихся сценариев и способность их различать.
- **Practical Meaning**: Видеть повторяющиеся паттерны в ситуациях, понимать, какой сценарий разворачивается, и действовать осознанно.
- **Development Type**: `reflection`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied
- **Reflection Prompts**: 5 промптов



### 5. node_subject_in_system

- **Name**: Субъект в системе
- **Full Description**: Действие в поле, не отдельно. Понимание себя как части системы, а не как отдельного элемента.
- **Practical Meaning**: Действовать, понимая себя как часть системы. Видеть, как мои действия влияют на систему, и как система влияет на меня.
- **Development Type**: `mixed`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied
- **Reflection Prompts**: 4 промптов



### 6. node_decision_authorship

- **Name**: Авторство решений
- **Full Description**: Создание новых рамок. Действие из субъектности, создание новых возможностей, а не выбор из существующих.
- **Practical Meaning**: Создавать новые рамки и возможности, а не выбирать из существующих. Действовать как автор, а не как исполнитель.
- **Development Type**: `mixed`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied
- **Reflection Prompts**: 3 промптов



### 7. node_architecture_coupling

- **Name**: Архитектура сцепки
- **Full Description**: Создание связей в команде. Связь + Направление + Доверие + Взаимность + Сознательное удержание различий.
- **Practical Meaning**: Создавать сцепки между людьми, командами, идеями. Это не просто связь, а архитектура взаимодействия с направлением, доверием, взаимностью и удержанием различий.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 8. node_field_of_differences

- **Name**: Поле различий
- **Full Description**: Удержание разнообразия. Создание пространства для различий без конфликта, удержание поля различий.
- **Practical Meaning**: Создавать пространство, где различия могут существовать без конфликта. Удерживать разнообразие, не гася его.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 9. node_system_thinking

- **Name**: Системное мышление
- **Full Description**: Видение целого. Понимание системы как совокупности элементов и связей.
- **Practical Meaning**: Видеть все элементы системы, а не только проблему. Понимать связи и зависимости. Предвидеть последствия изменений.
- **Development Type**: `theory`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 10. node_scenario_thinking

- **Name**: Сценарное мышление
- **Full Description**: Работа с неопределённостью. Видение нескольких сценариев развития и способность действовать в условиях неопределённости.
- **Practical Meaning**: Видеть несколько возможных сценариев развития ситуации и действовать, учитывая неопределённость. Не пытаться предсказать будущее, а работать со сценариями.
- **Development Type**: `theory`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 11. node_form_assembly

- **Name**: Сборка форм
- **Full Description**: Умение собирать связи, смыслы, различия в единую форму. Создание целого из частей без разрушения различий.
- **Practical Meaning**: Собирать разные элементы (связи, смыслы, различия) в единую форму, которая работает. Не унифицировать, а собрать в целое.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 12. node_containment

- **Name**: Контейнирование
- **Full Description**: Удержание напряжения без решения проблемы. Создание контейнера, в котором команда может переварить сложность.
- **Practical Meaning**: Создавать контейнер для напряжения, не решая проблему сразу. Удерживать пространство, где команда может переварить сложность.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 13. node_thinking_through_form

- **Name**: Мышление через форму
- **Full Description**: Создание структур. Проектирование форм, которые работают без постоянного вмешательства.
- **Practical Meaning**: Мышление через создание форм и структур, а не через решение задач. Проектировать формы, которые работают сами.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 14. node_personal_resilience

- **Name**: Личная устойчивость
- **Full Description**: Восстановление после напряжения. Базовая способность выдерживать давление.
- **Practical Meaning**: Выдерживать давление и восстанавливаться после него. Базовая способность устойчивости.
- **Development Type**: `reflection`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied
- **Reflection Prompts**: 5 промптов



### 15. node_weak_zone_diagnosis

- **Name**: Диагностика слабых зон
- **Full Description**: Понимание утечек энергии. Видение, где теряется ресурс, где есть слабые зоны.
- **Practical Meaning**: Видеть, где теряется энергия, где есть утечки ресурса. Диагностировать слабые зоны в себе и системе.
- **Development Type**: `reflection`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied
- **Reflection Prompts**: 5 промптов



### 16. node_recovery_skills

- **Name**: Навыки восстановления
- **Full Description**: Практики регенерации. Активное восстановление ресурсов, а не просто отдых.
- **Practical Meaning**: Иметь практики активного восстановления ресурсов. Не просто отдыхать, а восстанавливаться целенаправленно.
- **Development Type**: `reflection`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied
- **Reflection Prompts**: 5 промптов



### 17. node_emotional_work

- **Name**: Работа с эмоциями
- **Full Description**: Конструктивная эмоциональная работа. Обнаружить → различить → развернуть → сцепить.
- **Practical Meaning**: Работать с эмоциями конструктивно: обнаружить эмоцию, различить её, развернуть (понять источник), сцепить (связать с действием).
- **Development Type**: `reflection`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied
- **Reflection Prompts**: 5 промптов



### 18. node_cognitive_maturity

- **Name**: Когнитивная зрелость
- **Full Description**: Медленное мышление. Способность думать глубоко, не спешить с выводами, удерживать сложность.
- **Practical Meaning**: Думать медленно и глубоко, не спешить с выводами. Удерживать сложность, не упрощая преждевременно.
- **Development Type**: `mixed`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied
- **Reflection Prompts**: 4 промптов



### 19. node_role_energy

- **Name**: Энергия роли
- **Full Description**: Удержание границ роли. Понимание, где заканчивается роль и начинается личность.
- **Practical Meaning**: Понимать границы роли, не смешивать роль и личность. Удерживать энергию роли, не теряя себя.
- **Development Type**: `reflection`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied
- **Reflection Prompts**: 5 промптов



### 20. node_responsibility_as_form

- **Name**: Ответственность как форма
- **Full Description**: Понимание связи. Ответственность как связь, а не груз. Ответственность как форма взаимодействия.
- **Practical Meaning**: Понимать ответственность как связь, а не как груз. Ответственность как форма, которая создаёт связь между людьми и результатами.
- **Development Type**: `theory`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 21. node_responsibility_sag_diagnosis

- **Name**: Диагностика провисания ответственности
- **Full Description**: Умение видеть, где ответственность провисает, где провал в сцепке. Диагностика мест, где ответственность не удерживается.
- **Practical Meaning**: Видеть, где ответственность провисает, где нет связи между людьми и результатами. Диагностировать провалы в сцепке.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 22. node_delegation_as_coupling

- **Name**: Делегирование как сцепка
- **Full Description**: Передача через связь. Делегирование как создание связи, а не сброс задачи.
- **Practical Meaning**: Делегировать через создание связи, а не просто передать задачу. Делегирование как сцепка между тобой и тем, кому делегируешь.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 23. node_upper_field_work

- **Name**: Работа с верхним полем
- **Full Description**: Сцепка в поле власти и стратегии. Удержание смыслов и связей между уровнями организации.
- **Practical Meaning**: Работать в поле власти и стратегии, удерживая смыслы и связи между уровнями. Создавать сцепку между стратегией и операцией.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 24. node_leader_liberation

- **Name**: Освобождение лидера
- **Full Description**: Перестройка связей, возврат зон ответственности другим. Освобождение пространства для архитектурной функции.
- **Practical Meaning**: Освободить себя от операционных задач, вернув ответственность другим. Освободить пространство для архитектурной функции.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 25. node_shared_leadership

- **Name**: Shared Leadership
- **Full Description**: Распределённое лидерство. Создание системы, где лидерство распределено, а не сосредоточено в одном человеке.
- **Practical Meaning**: Создавать систему распределённого лидерства, где лидерство может проявляться в разных местах и ситуациях.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 26. node_psychological_ownership

- **Name**: Психологическая собственность
- **Full Description**: "Это наше". Создание чувства владения у команды. Психологическая собственность как основа ответственности.
- **Practical Meaning**: Создавать чувство "это наше" у команды. Психологическая собственность как основа для ответственности и инициативы.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 27. node_collective_efficacy

- **Name**: Коллективная эффективность
- **Full Description**: Вера в "мы можем". Создание коллективной уверенности в способности команды решать задачи.
- **Practical Meaning**: Создавать коллективную веру в способность команды. "Мы можем" как основа для сложных задач.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 28. node_feedback_types

- **Name**: Типы обратной связи
- **Full Description**: Реактивная/формирующая/структурирующая. Понимание разных типов обратной связи и их применения.
- **Practical Meaning**: Различать типы обратной связи и применять их уместно. Реактивная (на прошлое), формирующая (для развития), структурирующая (для системы).
- **Development Type**: `theory`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 29. node_language_of_differences

- **Name**: Язык различий
- **Full Description**: Предъявление различий, не обвинений. Обратная связь через язык различий, а не через обвинения.
- **Practical Meaning**: Давать обратную связь через предъявление различий, а не через обвинения. "Я вижу различие" вместо "ты неправ".
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 30. node_feedback_through_vulnerability

- **Name**: Приём обратной связи через уязвимость
- **Full Description**: Сцепка через уязвимость, не через защиту. Готовность встретиться с неизвестным о себе.
- **Practical Meaning**: Принимать обратную связь через уязвимость, а не через защиту. Встречаться с неизвестным о себе, не защищаясь.
- **Development Type**: `mixed`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied
- **Reflection Prompts**: 4 промптов



### 31. node_feedforward

- **Name**: Feedforward
- **Full Description**: Обратная связь в будущее. Фокус на будущее, а не на прошлое. Обратная связь для развития, а не для оценки.
- **Practical Meaning**: Давать обратную связь, фокусируясь на будущем, а не на прошлом. "Как можно сделать лучше" вместо "что было неправильно".
- **Development Type**: `mixed`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 32. node_rede_model

- **Name**: REDE Model
- **Full Description**: Relationship → Development → Engagement. Модель обратной связи через связь. Обратная связь через отношения, развитие и вовлечённость.
- **Practical Meaning**: Давать обратную связь через модель REDE: сначала связь (Relationship), потом развитие (Development), потом вовлечённость (Engagement).
- **Development Type**: `theory`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 33. node_mirror_holder

- **Name**: Window Gazer vs Mirror Holder
- **Full Description**: Держать зеркало, а не смотреть в окно. Обратная связь как зеркало, а не как оценка. Показывать, а не оценивать.
- **Practical Meaning**: Держать зеркало для другого, показывая ему его самого, а не смотреть в окно (оценивать со стороны). Обратная связь как зеркало.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 34. node_maturity_environment

- **Name**: Среда зрелости
- **Full Description**: Базовые условия развития. Создание среды, где люди могут расти, а не просто выполнять задачи.
- **Practical Meaning**: Создавать базовые условия для развития: безопасность, поддержка, вызов, обратная связь. Среда, где люди могут расти.
- **Development Type**: `theory`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 35. node_subjectivity_transfer

- **Name**: Передача субъектности
- **Full Description**: Autonomy Support. Создание условий для автономии других. Передача субъектности, а не контроль.
- **Practical Meaning**: Создавать условия для автономии других, поддерживать их субъектность. Не контролировать, а поддерживать автономию.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 36. node_scene_holding

- **Name**: Удержание сцены
- **Full Description**: Создание формы, в которой другой может действовать из себя. Не контроль, а удержание пространства для субъектности.
- **Practical Meaning**: Создавать форму (сцену), в которой другой может действовать из себя. Удерживать пространство, не контролируя действия.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 37. node_institutionalization

- **Name**: Институционализация
- **Full Description**: Перевод неформальных смыслов в формальные структуры. Преобразование сцепки между людьми в сцепку между смыслами, ролями, решениями.
- **Practical Meaning**: Переводить неформальные практики и смыслы в формальные структуры. Создавать институты, которые работают без постоянного присутствия.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 38. node_vertical_development

- **Name**: Vertical Development
- **Full Description**: Вертикальное развитие. Развитие способности думать и действовать на более высоком уровне сложности.
- **Practical Meaning**: Создавать условия для вертикального развития — развития способности думать и действовать на более высоком уровне сложности.
- **Development Type**: `theory`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 39. node_ddo

- **Name**: Deliberately Developmental Organization
- **Full Description**: Организация как тренажёр или Преднамеренно развивающаяся организация (Deliberately Developmental Organization - DDO). Создание организации, где развитие — часть работы, а не отдельный процесс.
- **Practical Meaning**: Создавать организацию, где развитие встроено в работу. Организация как тренажёр для развития людей.
- **Development Type**: `theory`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied



### 40. node_mature_parting

- **Name**: Зрелое расставание
- **Full Description**: Умение исчезнуть, оставив после себя форму. Перевод сцепки с себя на поле. Система продолжает работать без тебя.
- **Practical Meaning**: Уметь уйти, оставив после себя форму, которая продолжает работать. Перевести сцепку с себя на поле. Система работает без тебя.
- **Development Type**: `practice`
- **Examples**: 3 примеров
- **Integration Levels**: Novice, Integrated, Embodied




---

**См. также:**
- [01_NODES_STRUCTURE.md](./01_NODES_STRUCTURE.md) - Структура узлов
- [03_NODES_FULL.md](./03_NODES_FULL.md) - Полные данные узлов
