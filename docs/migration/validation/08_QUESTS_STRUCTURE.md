# Структура квестов (Quests)

**Дата генерации:** 2026-01-10  
**Количество квестов:** 32

---

## Описание

Этот документ содержит только **структурные данные** квестов из БД, без контента и пользовательских данных.

## Схема данных

```typescript
interface QuestStructure {
  id: string;
  type: string;
  source: string | null;
  branch: string | null;
  linked_nodes: string[];
  tags: string[];
  created_at: Date;
  updated_at: Date;
}
```

## Поля структуры

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `string` | Уникальный идентификатор квеста |
| `type` | `string` | Тип квеста (micro, weekly, story, in-person) |
| `source` | `string | null` | Источник квеста (base_template, auto_generated, user_generated) |
| `branch` | `string | null` | Ветка способностей, к которой относится квест |
| `linked_nodes` | `string[]` | Список node_id связанных узлов |
| `tags` | `string[]` | Теги квеста |
| `created_at` | `Date` | Дата создания |
| `updated_at` | `Date` | Дата обновления |

## Статистика

### По типу (type)

- **micro**: 19 квестов
- **weekly**: 4 квестов
- **story**: 4 квестов
- **in-person**: 5 квестов

### По источнику (source)

- **base_template**: 32 квестов

## Примеры

### Пример 1: ea855c82-c7f4-47c2-bb11-727f7d0d4bfc

```json
{
  "id": "ea855c82-c7f4-47c2-bb11-727f7d0d4bfc",
  "type": "micro",
  "source": "base_template",
  "branch": null,
  "linked_nodes": [
    "node_grounding_point"
  ],
  "tags": [
    "micro"
  ],
  "created_at": "2026-01-07T15:34:26.163Z",
  "updated_at": "2026-01-08T22:15:21.536Z"
}
```

### Пример 2: 912eee58-6145-48f5-92de-261a13c8088e

```json
{
  "id": "912eee58-6145-48f5-92de-261a13c8088e",
  "type": "micro",
  "source": "base_template",
  "branch": null,
  "linked_nodes": [
    "node_scenario_thinking"
  ],
  "tags": [
    "micro"
  ],
  "created_at": "2026-01-07T15:34:26.210Z",
  "updated_at": "2026-01-07T20:51:41.494Z"
}
```

### Пример 3: a3f355f5-7abd-4880-a485-2a0e41443068

```json
{
  "id": "a3f355f5-7abd-4880-a485-2a0e41443068",
  "type": "micro",
  "source": "base_template",
  "branch": null,
  "linked_nodes": [
    "node_responsibility_as_form"
  ],
  "tags": [
    "micro"
  ],
  "created_at": "2026-01-07T15:34:26.187Z",
  "updated_at": "2026-01-09T11:23:17.925Z"
}
```


## Все квесты (структура)

### 1. ea855c82-c7f4-47c2-bb11-727f7d0d4bfc

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_grounding_point`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-08


### 2. 912eee58-6145-48f5-92de-261a13c8088e

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_scenario_thinking`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-07


### 3. a3f355f5-7abd-4880-a485-2a0e41443068

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_responsibility_as_form`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-09


### 4. 0493cf1d-3ff1-4d22-9110-a5246f2dccad

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_recovery_skills`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-08


### 5. 0c689eb1-720a-4747-a18e-c9711826dd2e

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_shared_leadership`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-08


### 6. 7038e90e-63cc-482f-954d-5d092a61611f

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_self_regulation`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-07


### 7. de9190dc-2976-4189-ad8e-5d3a774b63df

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_form_assembly`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-07


### 8. d8befe83-10cb-4e2a-987b-60ddf2c82ed9

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_psychological_ownership`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-08


### 9. bea9ed8d-41e9-4a4c-b166-2910db701d4b

- **Type**: `weekly`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_containment`, `node_grounding_point`
- **Tags**: weekly
- **Created**: 2026-01-07
- **Updated**: 2026-01-09


### 10. c4c5ded2-89bb-4b5e-a0df-ca022ea7b3c8

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_subjectivity_transfer`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-07


### 11. 52725299-9d27-464c-9ee6-66f2f8504a65

- **Type**: `weekly`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_system_thinking`, `node_thinking_through_form`
- **Tags**: weekly
- **Created**: 2026-01-07
- **Updated**: 2026-01-08


### 12. 6b2f658f-a229-4256-9402-cd4a14894316

- **Type**: `story`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_containment`, `node_grounding_point`, `node_decision_authorship`
- **Tags**: story
- **Created**: 2026-01-07
- **Updated**: 2026-01-08


### 13. 8cfc68d8-84f7-4e9c-8111-cff50cb408df

- **Type**: `story`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_system_thinking`, `node_thinking_through_form`, `node_maturity_environment`
- **Tags**: story
- **Created**: 2026-01-07
- **Updated**: 2026-01-08


### 14. dacfd6e3-55dd-4d96-82b0-7342f157b756

- **Type**: `weekly`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_personal_resilience`, `node_recovery_skills`
- **Tags**: weekly
- **Created**: 2026-01-07
- **Updated**: 2026-01-08


### 15. ee3a9296-dd8c-4921-9e3d-e71679fb5a45

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_scene_holding`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-07


### 16. 8ba775d3-3a04-40ac-88d2-897b4771d761

- **Type**: `in-person`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: нет
- **Tags**: in-person
- **Created**: 2026-01-07
- **Updated**: 2026-01-07


### 17. d75c769f-d76e-496f-baed-786cf697cd4e

- **Type**: `in-person`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: нет
- **Tags**: in-person
- **Created**: 2026-01-07
- **Updated**: 2026-01-07


### 18. 256bb376-dd45-48db-8e66-438ec5014c0c

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_personal_resilience`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-09


### 19. 7dda7d6d-9a79-40d1-aea5-693fd0531e53

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_feedback_types`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-08


### 20. e1445cf9-46a6-4b99-aa8d-86591cc4c869

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_upper_field_work`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-07


### 21. ce2e77d1-2327-4e2d-b31c-860141e2c998

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_feedback_through_vulnerability`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-08


### 22. d04b69e8-a538-4b8e-8896-a196a27c23b6

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_role_differentiation`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-07


### 23. 4d8bd726-6d54-4f8e-930b-d04aca4a4ac5

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_field_of_differences`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-07


### 24. f608e0c2-b23f-433a-a38e-a7d5345c388b

- **Type**: `in-person`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_scenario_thinking`
- **Tags**: in-person
- **Created**: 2026-01-07
- **Updated**: 2026-01-07


### 25. 078b9849-c3ba-41ce-90a2-31c1cf309535

- **Type**: `weekly`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_psychological_ownership`, `node_responsibility_as_form`
- **Tags**: weekly
- **Created**: 2026-01-07
- **Updated**: 2026-01-08


### 26. f19469e1-8361-4bbf-b7f1-0c3ebeb8c6dd

- **Type**: `story`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_feedback_types`, `node_feedback_through_vulnerability`, `node_shared_leadership`
- **Tags**: story
- **Created**: 2026-01-07
- **Updated**: 2026-01-08


### 27. 5efe6447-e832-4ff9-84f9-2bdea0c49dcf

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_containment`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-07


### 28. 2b2f82a0-18b4-4064-a621-393446ca033f

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_delegation_as_coupling`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-07


### 29. 78dfc921-1aa0-4377-89b5-c497b0785f43

- **Type**: `micro`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_system_thinking`
- **Tags**: micro
- **Created**: 2026-01-07
- **Updated**: 2026-01-07


### 30. 27b9656e-cf88-4ee9-8829-5a0e0df268ad

- **Type**: `in-person`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_personal_resilience`, `node_recovery_skills`
- **Tags**: in-person
- **Created**: 2026-01-07
- **Updated**: 2026-01-08


### 31. e641102c-1e51-4133-aebe-2913b2c92e0e

- **Type**: `in-person`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_feedback_types`, `node_feedback_through_vulnerability`
- **Tags**: in-person
- **Created**: 2026-01-07
- **Updated**: 2026-01-09


### 32. 932ff980-5c76-43ae-bbbe-f117adc66337

- **Type**: `story`
- **Source**: `base_template`
- **Branch**: нет
- **Linked Nodes**: `node_system_thinking`, `node_thinking_through_form`, `node_shared_leadership`
- **Tags**: story
- **Created**: 2026-01-07
- **Updated**: 2026-01-08



---

**См. также:**
- [09_QUESTS_CONTENT.md](./09_QUESTS_CONTENT.md) - Контент квестов
- [10_QUESTS_FULL.md](./10_QUESTS_FULL.md) - Полные данные квестов
