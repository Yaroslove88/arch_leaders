# Контент кейсов (Cases)

**Дата генерации:** 2026-01-10  
**Количество кейсов с контентом:** 75

---

## Описание

Этот документ содержит только **контентные данные** кейсов из `interactive-cases.json`.

## Схема данных

```typescript
interface CaseContent {
  title: string;
  context: string;
  options: Array<{
    id: string;
    text: string;
    skill_used: string;
    consequence: { immediate: string; second_order: string; systemic: string };
    sm_impact?: Record<string, number>;
    hint?: string;
    warning?: string;
    explanation?: string;
  }>;
  reflection: {
    questions: string[];
    mirror: Record<string, string>;
  };
}
```

## Поля контента

| Поле | Тип | Описание |
|------|-----|----------|
| `title` | `string` | Название кейса |
| `context` | `string` | Контекст ситуации (полное описание) |
| `options` | `Array` | Массив вариантов решения (A, B, C, D и т.д.) |
| `reflection` | `object` | Рефлексия (questions, mirror) |

## Статистика

- **Всего кейсов с контентом**: 75
- **Кейсов с рефлексией**: 42
- **Кейсов с опциями**: 75
- **Среднее количество опций на кейс**: 3.8

## Примеры

### Пример 1: case_let_it_break_1

**Title**: Мелкая ошибка  
**Node ID**: `node_containment`  
**Branch ID**: `branch_resilience`  
**Difficulty**: `basic`  
**Context**: Компания: Маркетинговое агентство, команда 12 человек. Работаете над проектами для клиентов из e-commerce.
Проект: Подготовка рекламной кампании для запуска нового продукта клиента.
Ситуация: Младший ...  
**Options**: 4 вариантов

```json
{
  "title": "Мелкая ошибка",
  "context": "Компания: Маркетинговое агентство, команда 12 человек. Работаете над проектами для клиентов из e-commerce.\nПроект: Подготовка рекламной кампании для запуска нового продукта клиента.\nСитуация: Младший маркетолог (работает 4 месяца) подготовил креативы для кампании. Ты просматриваешь материалы перед отправкой клиенту и замечаешь неточность: в одном из текстов указана неправильная цена — старая цена вместо новой. Это может привести к проблемам, если клиент не заметит до публикации, но вероятность низкая — в большинстве случаев клиент проверяет материалы перед запуском.\nКонтекст задачи: Материалы нужно отправить клиенту завтра утром. Младший маркетолог уже ушёл домой. Ты можешь быстро исправить (5 минут работы) и отправить сам, или оставить до завтра.\nИстория: За последний месяц это уже третий раз, когда младший маркетолог сдаёт материалы с мелкими недочётами. Команда в целом работает хорошо, но есть тенденция к тому, что младшие сотрудники ждут, что ты всё проверишь и исправишь.\nСистемный контекст: В команде нет чёткого процесса проверки материалов перед отправкой клиенту — проверяющие часто просто исправляют сами, вместо того чтобы указывать на проблемы.",
  "options": [
    {
      "id": "A",
      "text": "Исправить сам и молча закоммитить",
      "skill_used": "Direct Order",
      "consequence": {
        "immediate": "Результат сейчас хорош",
        "second_order": "Доверие и автономия падают",
        "systemic": "Система не учится"
      },
      "sm_impact": {
        "C": -1,
        "F": -2,
        "S": -1
      },
      "hint": "Это спасательство. Быстро и приятно — но система не учится."
    },
    {
      "id": "B",
      "text": "Указать на дефект и попросить исправить",
      "skill_used": "Context Share",
      "consequence": {
        "immediate": "Средний результат",
        "second_order": "Рост ответственности",
        "systemic": "Система учится"
      },
      "sm_impact": {
        "R": 1,
        "C": 1
      }
    },
    {
      "id": "C",
      "text": "Ничего не делать, пусть выйдет в прод (опасно)",
      "skill_used": "Avoidance",
      "consequence": {
        "immediate": "Риск для клиентов",
        "second_order": "Потеря доверия",
        "systemic": "Халатность"
      },
      "sm_impact": {
        "R": -2,
        "C": -1
      },
      "warning": "Это не Let It Break, это уход от ответственности"
    },
    {
      "id": "D",
      "text": "Оставить как есть до ревью и посмотреть, заметит ли команда",
      "skill_used": "Let It Break",
      "consequence": {
        "immediate": "Тревожно, но безопасно",
        "second_order": "Рост свободы выбора и системности",
        "systemic": "Система учится замечать проблемы"
      },
      "sm_impact": {
        "F": 2,
        "S": 2,
        "R": 1
      },
      "explanation": "Ты выдержал напряжение, дал системе возможность проявить себя"
    }
  ],
  "reflection": {
    "questions": [
      "Что ты чувствовал, выбирая решение?",
      "Удалось ли выдержать напряжение?",
      "Научилась ли система?"
    ],
    "mirror": {
      "A": "Ты снял напряжение сейчас, но система не научилась",
      "B": "Ты передал ответственность, система учится",
      "C": "Ты избежал решения, это не зрелость",
      "D": "Ты выдержал напряжение, система научилась"
    }
  }
}
```

### Пример 2: case_let_it_break_2

**Title**: Ошибка с риском  
**Node ID**: `node_containment`  
**Branch ID**: `branch_resilience`  
**Difficulty**: `intermediate`  
**Context**: Компания: Производственная компания, отдел продаж 20 человек, работаете с корпоративными клиентами.
Проект: Запуск нового продукта — критичен для выполнения плана продаж на квартал. Сроки жёсткие, нуж...  
**Options**: 4 вариантов

```json
{
  "title": "Ошибка с риском",
  "context": "Компания: Производственная компания, отдел продаж 20 человек, работаете с корпоративными клиентами.\nПроект: Запуск нового продукта — критичен для выполнения плана продаж на квартал. Сроки жёсткие, нужно запустить через месяц.\nСитуация: Менеджер по продажам (опыт 2 года, в компании 8 месяцев) ведёт подготовку презентации для крупного клиента. Он столкнулся с выбором: как представить ценовое предложение — (1) показать базовую цену с опциями, которые можно добавить — быстрее подготовить, но может запутать клиента; (2) показать комплексное решение с фиксированной ценой — понятнее для клиента, но требует больше времени на расчёт и согласование.\nВарианты решения: Менеджер предлагает два подхода, оба имеют свои плюсы и минусы. Он не уверен, какой выбрать.\nРиски: Если выберет неправильно — может потерять клиента или потратить лишнее время на переговоры. Если ты вмешаешься и скажешь правильное решение — презентация будет готова быстрее.\nИстория: За последние 2 месяца менеджер стал чаще спрашивать твоего мнения по подготовке предложений. Ты замечаешь, что он стал менее уверен в принятии решений самостоятельно.\nСистемный контекст: В отделе продаж растёт количество обращений к тебе за советом по подготовке предложений. Другие менеджеры тоже начинают чаще консультироваться перед важными встречами.",
  "options": [
    {
      "id": "A",
      "text": "Сказать как делать",
      "skill_used": "Direct Order",
      "consequence": {
        "immediate": "Быстро и правильно",
        "second_order": "Мидл перестаёт принимать решения",
        "systemic": "Узкое место сохраняется"
      },
      "sm_impact": {
        "F": -2,
        "S": -1,
        "R": -1
      }
    },
    {
      "id": "B",
      "text": "Обозначить рамки и критерии",
      "skill_used": "Context Share",
      "consequence": {
        "immediate": "Мидл понимает контекст",
        "second_order": "Может принять решение сам",
        "systemic": "Рост автономии"
      },
      "sm_impact": {
        "R": 1,
        "C": 1,
        "S": 1
      }
    },
    {
      "id": "C",
      "text": "Разрешить принять решение самому",
      "skill_used": "Let It Break",
      "consequence": {
        "immediate": "Риск потери 1-2 дней",
        "second_order": "Мидл учится принимать решения",
        "systemic": "Рост субъектности команды"
      },
      "sm_impact": {
        "F": 3,
        "S": 2,
        "R": 1
      },
      "explanation": "Ты выбрал развитие системы ценой 1–2 дней"
    },
    {
      "id": "D",
      "text": "Взять на себя, \"потому что важно\"",
      "skill_used": "Hero Mode",
      "consequence": {
        "immediate": "Результат гарантирован",
        "second_order": "Ты перегружен",
        "systemic": "Система не развивается"
      },
      "sm_impact": {
        "R": -2,
        "F": -1,
        "S": -1
      },
      "hint": "Сейчас проверяется твоя граница ответственности: важно ли спасать результат или выращивать систему?"
    }
  ],
  "reflection": {
    "questions": [
      "Где твоя граница ответственности?",
      "Что важнее: результат сейчас или развитие системы?",
      "Можешь ли ты выдержать риск ошибки?"
    ]
  }
}
```

### Пример 3: case_containment_conflict

**Title**: Социальный конфликт  
**Node ID**: `node_containment`  
**Branch ID**: `branch_subjectivity`  
**Difficulty**: `intermediate`  
**Context**: Компания: Консалтинговая компания, команда 35 человек, работаете в проектных командах по 4–6 человек.
Ситуация: Два сильных сотрудника — руководитель проектов (Алексей, 5 лет опыта, в компании 2 года)...  
**Options**: 4 вариантов

```json
{
  "title": "Социальный конфликт",
  "context": "Компания: Консалтинговая компания, команда 35 человек, работаете в проектных командах по 4–6 человек.\nСитуация: Два сильных сотрудника — руководитель проектов (Алексей, 5 лет опыта, в компании 2 года) и руководитель отдела аналитики (Мария, 4 года опыта, в компании 1.5 года) — спорят о приоритетах в текущем проекте.\nСуть конфликта: Алексей настаивает на улучшении внутренних процессов — нужно обновить систему отчётности, иначе будут проблемы при масштабировании. Мария требует срочно подготовить анализ для крупного клиента — без него может уйти контракт на $50k/месяц. Оба правы по-своему, но ресурсы ограничены — команда из 4 человек не может делать и то, и другое одновременно.\nДинамика конфликта: Конфликт длится уже 3 дня. Команда наблюдает, ждёт твоего решения. В общем чате появилось напряжение — сотрудники не знают, за что браться. Ежедневные планерки стали формальными, продуктивность падает.\nИстория отношений: Алексей и Мария раньше хорошо работали вместе, но последние 2 месяца их мнения стали расходиться чаще. Ты замечаешь, что они перестали договариваться напрямую, каждый приходит к тебе отдельно с жалобами.\nСистемный контекст: В компании нет чёткого процесса приоритизации между внутренними улучшениями и клиентскими задачами. Такие конфликты повторяются раз в 2–3 месяца.",
  "options": [
    {
      "id": "A",
      "text": "Разрулить самому",
      "skill_used": "Direct Order",
      "consequence": {
        "immediate": "Конфликт заткнётся",
        "second_order": "Конфликт останется под поверхностью",
        "systemic": "Команда ждёт твоих решений"
      },
      "sm_impact": {
        "F": -1,
        "S": -1
      }
    },
    {
      "id": "B",
      "text": "Назначить медиатора",
      "skill_used": "Delegation",
      "consequence": {
        "immediate": "Процесс запущен",
        "second_order": "Рост навыков команды",
        "systemic": "Создаётся практика разрешения конфликтов"
      },
      "sm_impact": {
        "R": 1,
        "S": 1
      }
    },
    {
      "id": "C",
      "text": "ДатЬ им договориться, но поставить границы",
      "skill_used": "Let It Break + Containment",
      "consequence": {
        "immediate": "Краткосрочно неприятно",
        "second_order": "Растёт доверие и автономия",
        "systemic": "Команда учится разрешать конфликты"
      },
      "sm_impact": {
        "F": 2,
        "S": 2,
        "C": 1
      },
      "explanation": "Let It Break здесь = рамка + время + границы ущерба. Не \"пусть сами\"."
    },
    {
      "id": "D",
      "text": "Игнорировать (опасно)",
      "skill_used": "Avoidance",
      "consequence": {
        "immediate": "Конфликт может обостриться",
        "second_order": "Потеря доверия команды",
        "systemic": "Токсичная среда"
      },
      "sm_impact": {
        "R": -2,
        "C": -1
      },
      "warning": "Это не контейнирование, это уход"
    }
  ],
  "reflection": {
    "questions": [
      "Удалось ли удержать напряжение конфликта?",
      "Создал ли ты пространство для диалога?",
      "Что изменилось в команде?"
    ]
  }
}
```


## Все кейсы (контент)

### 1. case_let_it_break_1

- **Title**: Мелкая ошибка
- **Node ID**: `node_containment`  
- **Branch ID**: `branch_resilience`  
- **Difficulty**: `basic`
- **Context**: 1170 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов
- **Reflection Mirror**: 4 вариантов



### 2. case_let_it_break_2

- **Title**: Ошибка с риском
- **Node ID**: `node_containment`  
- **Branch ID**: `branch_resilience`  
- **Difficulty**: `intermediate`
- **Context**: 1305 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 3. case_containment_conflict

- **Title**: Социальный конфликт
- **Node ID**: `node_containment`  
- **Branch ID**: `branch_subjectivity`  
- **Difficulty**: `intermediate`
- **Context**: 1294 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 4. case_crisis_real

- **Title**: Настоящий кризис
- **Node ID**: `node_containment`  
- **Branch ID**: `branch_subjectivity`  
- **Difficulty**: `advanced`
- **Context**: 1395 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 5. case_rule_creation_bugs

- **Title**: Повторяющиеся баги на релизе
- **Node ID**: `node_thinking_through_form`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `intermediate`
- **Context**: 1445 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 6. case_decision_uncertainty

- **Title**: Принятие решения в неопределённости
- **Node ID**: `node_scenario_thinking`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `advanced`
- **Context**: 1915 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 7. case_role_differentiation_1

- **Title**: Выбор позиции в конфликте
- **Node ID**: `node_role_differentiation`  
- **Branch ID**: `branch_subjectivity`  
- **Difficulty**: `intermediate`
- **Context**: 1218 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов
- **Reflection Mirror**: 4 вариантов



### 8. case_architecture_coupling_1

- **Title**: Связь между командами
- **Node ID**: `node_architecture_coupling`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `basic`
- **Context**: 1211 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 9. case_delegation_coupling_1

- **Title**: Делегирование важной задачи
- **Node ID**: `node_delegation_as_coupling`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `intermediate`
- **Context**: 1159 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 10. case_system_thinking_1

- **Title**: Второй порядок эффектов
- **Node ID**: `node_system_thinking`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `intermediate`
- **Context**: 1029 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 11. case_responsibility_sag_1

- **Title**: Провисание ответственности
- **Node ID**: `node_responsibility_sag_diagnosis`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `intermediate`
- **Context**: 1389 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 12. case_subjectivity_transfer_1

- **Title**: Передача автономии
- **Node ID**: `node_subjectivity_transfer`  
- **Branch ID**: `branch_maturity_environment`  
- **Difficulty**: `intermediate`
- **Context**: 1060 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 13. case_role_differentiation_2

- **Title**: Заметить свою роль
- **Node ID**: `node_role_differentiation`  
- **Branch ID**: `branch_subjectivity`  
- **Difficulty**: `basic`
- **Context**: 915 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов
- **Reflection Mirror**: 4 вариантов



### 14. case_role_differentiation_3

- **Title**: Выбор роли в сложной ситуации
- **Node ID**: `node_role_differentiation`  
- **Branch ID**: `branch_subjectivity`  
- **Difficulty**: `advanced`
- **Context**: 1055 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 4 вопросов



### 15. case_architecture_coupling_2

- **Title**: Создание связи между отделами
- **Node ID**: `node_architecture_coupling`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `intermediate`
- **Context**: 1256 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 16. case_architecture_coupling_3

- **Title**: Сложная сцепка в кризисе
- **Node ID**: `node_architecture_coupling`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `advanced`
- **Context**: 1312 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 17. case_delegation_coupling_2

- **Title**: Первая передача ответственности
- **Node ID**: `node_delegation_as_coupling`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `basic`
- **Context**: 928 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 18. case_delegation_coupling_3

- **Title**: Делегирование в кризисе
- **Node ID**: `node_delegation_as_coupling`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `advanced`
- **Context**: 1206 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 4 вопросов



### 19. case_system_thinking_2

- **Title**: Простая системная связь
- **Node ID**: `node_system_thinking`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `basic`
- **Context**: 1211 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 20. case_system_thinking_3

- **Title**: Третий порядок эффектов
- **Node ID**: `node_system_thinking`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `advanced`
- **Context**: 1875 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 21. case_responsibility_sag_2

- **Title**: Первое провисание
- **Node ID**: `node_responsibility_sag_diagnosis`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `basic`
- **Context**: 1204 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 22. case_responsibility_sag_3

- **Title**: Сложное провисание в системе
- **Node ID**: `node_responsibility_sag_diagnosis`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `advanced`
- **Context**: 1346 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 23. case_subjectivity_transfer_2

- **Title**: Базовые условия автономии
- **Node ID**: `node_subjectivity_transfer`  
- **Branch ID**: `branch_maturity_environment`  
- **Difficulty**: `basic`
- **Context**: 153 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 24. case_subjectivity_transfer_3

- **Title**: Передача субъектности команде
- **Node ID**: `node_subjectivity_transfer`  
- **Branch ID**: `branch_maturity_environment`  
- **Difficulty**: `advanced`
- **Context**: 945 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 25. case_scenario_thinking_2

- **Title**: Работа со сценариями
- **Node ID**: `node_scenario_thinking`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `basic`
- **Context**: 1674 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 26. case_scenario_thinking_3

- **Title**: Множественные сценарии в кризисе
- **Node ID**: `node_scenario_thinking`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `intermediate`
- **Context**: 1436 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection Questions**: 3 вопросов



### 27. case_scenario_breakdown_1

- **Title**: Разбор повторяющегося паттерна
- **Node ID**: `node_scenario_analysis`  
- **Branch ID**: `branch_subjectivity`  
- **Difficulty**: `basic`
- **Context**: 1226 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 28. case_scenario_breakdown_2

- **Title**: Разбор паттерна в конфликте
- **Node ID**: `node_scenario_analysis`  
- **Branch ID**: `branch_subjectivity`  
- **Difficulty**: `intermediate`
- **Context**: 1305 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 29. case_scenario_breakdown_3

- **Title**: Разбор системного паттерна
- **Node ID**: `node_scenario_analysis`  
- **Branch ID**: `branch_subjectivity`  
- **Difficulty**: `advanced`
- **Context**: 1243 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 30. case_subject_in_system_1

- **Title**: Субъект в простой системе
- **Node ID**: `node_subject_in_system`  
- **Branch ID**: `branch_subjectivity`  
- **Difficulty**: `basic`
- **Context**: 931 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 31. case_subject_in_system_2

- **Title**: Субъект в сложной системе
- **Node ID**: `node_subject_in_system`  
- **Branch ID**: `branch_subjectivity`  
- **Difficulty**: `intermediate`
- **Context**: 1173 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 32. case_subject_in_system_3

- **Title**: Субъект в системной трансформации
- **Node ID**: `node_subject_in_system`  
- **Branch ID**: `branch_subjectivity`  
- **Difficulty**: `advanced`
- **Context**: 1545 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 33. case_decision_authorship_1

- **Title**: Авторство простого решения
- **Node ID**: `node_decision_authorship`  
- **Branch ID**: `branch_subjectivity`  
- **Difficulty**: `basic`
- **Context**: 923 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 34. case_decision_authorship_2

- **Title**: Авторство решения в кризисе
- **Node ID**: `node_decision_authorship`  
- **Branch ID**: `branch_subjectivity`  
- **Difficulty**: `intermediate`
- **Context**: 1033 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 35. case_decision_authorship_3

- **Title**: Авторство стратегического решения
- **Node ID**: `node_decision_authorship`  
- **Branch ID**: `branch_subjectivity`  
- **Difficulty**: `advanced`
- **Context**: 1195 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 36. case_difference_field_1

- **Title**: Конфликт подходов
- **Node ID**: `node_field_of_differences`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `basic`
- **Context**: 1232 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 37. case_difference_field_2

- **Title**: Конфликт логик в проекте
- **Node ID**: `node_field_of_differences`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `intermediate`
- **Context**: 1325 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 38. case_difference_field_3

- **Title**: Конфликт культур в организации
- **Node ID**: `node_field_of_differences`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `advanced`
- **Context**: 1147 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 39. case_form_assembly_1

- **Title**: Простая сборка форм
- **Node ID**: `node_form_assembly`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `basic`
- **Context**: 1032 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 40. case_form_assembly_2

- **Title**: Сборка форм в проекте
- **Node ID**: `node_form_assembly`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `intermediate`
- **Context**: 1255 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 41. case_form_assembly_3

- **Title**: Сборка форм в организации
- **Node ID**: `node_form_assembly`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `advanced`
- **Context**: 1163 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 42. case_thinking_through_form_1

- **Title**: Проектирование простой структуры
- **Node ID**: `node_thinking_through_form`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `basic`
- **Context**: 1030 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 43. case_thinking_through_form_2

- **Title**: Проектирование структуры в проекте
- **Node ID**: `node_thinking_through_form`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `intermediate`
- **Context**: 1187 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 44. case_thinking_through_form_3

- **Title**: Проектирование организационной структуры
- **Node ID**: `node_thinking_through_form`  
- **Branch ID**: `branch_architectural_thinking`  
- **Difficulty**: `advanced`
- **Context**: 1127 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 45. case_responsibility_as_form_1

- **Title**: Ответственность за простую задачу
- **Node ID**: `node_responsibility_as_form`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `basic`
- **Context**: 1065 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 46. case_responsibility_as_form_2

- **Title**: Ответственность в проекте
- **Node ID**: `node_responsibility_as_form`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `intermediate`
- **Context**: 1212 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 47. case_responsibility_as_form_3

- **Title**: Ответственность в организации
- **Node ID**: `node_responsibility_as_form`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `advanced`
- **Context**: 1296 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 48. case_upper_field_work_1

- **Title**: Работа с верхним полем — простой случай
- **Node ID**: `node_upper_field_work`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `basic`
- **Context**: 885 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 49. case_upper_field_work_2

- **Title**: Работа с верхним полем — стратегический случай
- **Node ID**: `node_upper_field_work`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `intermediate`
- **Context**: 981 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 50. case_upper_field_work_3

- **Title**: Работа с верхним полем — системный случай
- **Node ID**: `node_upper_field_work`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `advanced`
- **Context**: 1091 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 51. case_distributed_leadership_1

- **Title**: Первый шаг к распределённому лидерству
- **Node ID**: `node_shared_leadership`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `basic`
- **Context**: 999 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 52. case_distributed_leadership_2

- **Title**: Распределённое лидерство в проекте
- **Node ID**: `node_shared_leadership`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `intermediate`
- **Context**: 1114 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 53. case_distributed_leadership_3

- **Title**: Распределённое лидерство в организации
- **Node ID**: `node_shared_leadership`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `advanced`
- **Context**: 1107 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 54. case_institutionalization_1

- **Title**: Первая институционализация
- **Node ID**: `node_institutionalization`  
- **Branch ID**: `branch_maturity_environment`  
- **Difficulty**: `basic`
- **Context**: 1003 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 55. case_institutionalization_2

- **Title**: Институционализация процессов
- **Node ID**: `node_institutionalization`  
- **Branch ID**: `branch_maturity_environment`  
- **Difficulty**: `intermediate`
- **Context**: 1031 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 56. case_institutionalization_3

- **Title**: Институционализация культуры
- **Node ID**: `node_institutionalization`  
- **Branch ID**: `branch_maturity_environment`  
- **Difficulty**: `advanced`
- **Context**: 1140 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 57. case_organization_as_trainer_1

- **Title**: Первый шаг к организации как тренажёру
- **Node ID**: `node_ddo`  
- **Branch ID**: `branch_maturity_environment`  
- **Difficulty**: `basic`
- **Context**: 1042 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 58. case_organization_as_trainer_2

- **Title**: Организация как тренажёр для навыков
- **Node ID**: `node_ddo`  
- **Branch ID**: `branch_maturity_environment`  
- **Difficulty**: `intermediate`
- **Context**: 1064 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 59. case_organization_as_trainer_3

- **Title**: Организация как тренажёр для лидерства
- **Node ID**: `node_ddo`  
- **Branch ID**: `branch_maturity_environment`  
- **Difficulty**: `advanced`
- **Context**: 1048 символов
- **Options**: 4 вариантов (A, B, C, D)
- **Reflection**: не указана


### 60. case_grounding_point_1

- **Title**: Потеря устойчивости на совещании
- **Node ID**: `node_grounding_point`  
- **Branch ID**: `branch_subjectivity`  
- **Difficulty**: `basic`
- **Context**: 484 символов
- **Options**: 3 вариантов (A, B, C)
- **Reflection Questions**: 3 вопросов



### 61. case_self_regulation_1

- **Title**: Эмоциональный всплеск в конфликте
- **Node ID**: `node_self_regulation`  
- **Branch ID**: `branch_subjectivity`  
- **Difficulty**: `basic`
- **Context**: 301 символов
- **Options**: 3 вариантов (A, B, C)
- **Reflection Questions**: 3 вопросов



### 62. case_personal_resilience_1

- **Title**: Выгорание после сложного проекта
- **Node ID**: `node_personal_resilience`  
- **Branch ID**: `branch_resilience`  
- **Difficulty**: `basic`
- **Context**: 299 символов
- **Options**: 3 вариантов (A, B, C)
- **Reflection Questions**: 3 вопросов



### 63. case_feedback_types_1

- **Title**: Первый опыт обратной связи
- **Node ID**: `node_feedback_types`  
- **Branch ID**: `branch_feedback`  
- **Difficulty**: `basic`
- **Context**: 284 символов
- **Options**: 3 вариантов (A, B, C)
- **Reflection Questions**: 3 вопросов



### 64. case_language_of_differences_1

- **Title**: Разговор о проблемах в работе
- **Node ID**: `node_language_of_differences`  
- **Branch ID**: `branch_feedback`  
- **Difficulty**: `basic`
- **Context**: 277 символов
- **Options**: 3 вариантов (A, B, C)
- **Reflection Questions**: 3 вопросов



### 65. case_feedback_through_vulnerability_1

- **Title**: Приём критики от подчинённого
- **Node ID**: `node_feedback_through_vulnerability`  
- **Branch ID**: `branch_feedback`  
- **Difficulty**: `intermediate`
- **Context**: 310 символов
- **Options**: 3 вариантов (A, B, C)
- **Reflection Questions**: 3 вопросов



### 66. case_maturity_environment_1

- **Title**: Создание пространства для роста
- **Node ID**: `node_maturity_environment`  
- **Branch ID**: `branch_maturity_environment`  
- **Difficulty**: `basic`
- **Context**: 266 символов
- **Options**: 3 вариантов (A, B, C)
- **Reflection Questions**: 3 вопросов



### 67. case_scene_holding_1

- **Title**: Удержание сцены для проявления
- **Node ID**: `node_scene_holding`  
- **Branch ID**: `branch_maturity_environment`  
- **Difficulty**: `intermediate`
- **Context**: 339 символов
- **Options**: 3 вариантов (A, B, C)
- **Reflection Questions**: 3 вопросов



### 68. case_vertical_development_1

- **Title**: Развитие лидера на следующий уровень
- **Node ID**: `node_vertical_development`  
- **Branch ID**: `branch_maturity_environment`  
- **Difficulty**: `advanced`
- **Context**: 355 символов
- **Options**: 3 вариантов (A, B, C)
- **Reflection Questions**: 3 вопросов



### 69. case_leader_liberation_1

- **Title**: Освобождение лидера от микроменеджмента
- **Node ID**: `node_leader_liberation`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `intermediate`
- **Context**: 289 символов
- **Options**: 3 вариантов (A, B, C)
- **Reflection Questions**: 3 вопросов



### 70. case_psychological_ownership_1

- **Title**: Создание чувства владения
- **Node ID**: `node_psychological_ownership`  
- **Branch ID**: `branch_responsibility`  
- **Difficulty**: `intermediate`
- **Context**: 334 символов
- **Options**: 3 вариантов (A, B, C)
- **Reflection Questions**: 3 вопросов



### 71. case_feedforward_1

- **Title**: Фокус на будущем, а не на прошлом
- **Node ID**: `node_feedforward`  
- **Branch ID**: `branch_feedback`  
- **Difficulty**: `intermediate`
- **Context**: 306 символов
- **Options**: 3 вариантов (A, B, C)
- **Reflection Questions**: 3 вопросов



### 72. case_rede_model_1

- **Title**: Применение модели REDE
- **Node ID**: `node_rede_model`  
- **Branch ID**: `branch_feedback`  
- **Difficulty**: `advanced`
- **Context**: 259 символов
- **Options**: 3 вариантов (A, B, C)
- **Reflection Questions**: 3 вопросов



### 73. case_emotional_work_1

- **Title**: Работа с эмоциями в команде
- **Node ID**: `node_emotional_work`  
- **Branch ID**: `branch_resilience`  
- **Difficulty**: `intermediate`
- **Context**: 311 символов
- **Options**: 3 вариантов (A, B, C)
- **Reflection Questions**: 3 вопросов



### 74. case_cognitive_maturity_1

- **Title**: Медленное мышление в кризисе
- **Node ID**: `node_cognitive_maturity`  
- **Branch ID**: `branch_resilience`  
- **Difficulty**: `advanced`
- **Context**: 330 символов
- **Options**: 3 вариантов (A, B, C)
- **Reflection Questions**: 3 вопросов



### 75. case_mature_parting_1

- **Title**: Зрелое расставание с ролью
- **Node ID**: `node_mature_parting`  
- **Branch ID**: `branch_maturity_environment`  
- **Difficulty**: `advanced`
- **Context**: 322 символов
- **Options**: 3 вариантов (A, B, C)
- **Reflection Questions**: 3 вопросов




---

**См. также:**
- [11_CASES_STRUCTURE.md](./11_CASES_STRUCTURE.md) - Структура кейсов
- [13_CASES_FULL.md](./13_CASES_FULL.md) - Полные данные кейсов
