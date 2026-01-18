# Структура узлов (Nodes)

**Дата генерации:** 2026-01-10  
**Версия данных:** 1.0.0  
**Количество узлов:** 40

---

## Описание

Этот документ содержит только **структурные данные** узлов, без контента и пользовательских данных.

## Схема данных

```typescript
interface NodeStructure {
  node_id: string;
  branch_id: string;
  tier: 'basic' | 'intermediate' | 'advanced' | 'master';
  prerequisites: string[];
  unlock_conditions: {
    type: string;
    [key: string]: any;
  };
  xp_required: number;
}
```

## Поля структуры

| Поле | Тип | Описание |
|------|-----|----------|
| `node_id` | `string` | Уникальный идентификатор узла |
| `branch_id` | `string` | Идентификатор ветки, к которой относится узел |
| `tier` | `'basic' | 'intermediate' | 'advanced' | 'master'` | Уровень сложности узла |
| `prerequisites` | `string[]` | Список node_id обязательных предварительных узлов |
| `unlock_conditions` | `object` | Условия разблокировки узла |
| `xp_required` | `number` | Количество XP, необходимое для разблокировки |

## Статистика

### По уровням (tier)

- **basic**: 7 узлов
- **intermediate**: 11 узлов
- **advanced**: 16 узлов
- **master**: 6 узлов

### По веткам (branch_id)

- **branch_subjectivity**: 6 узлов
- **branch_architectural_thinking**: 7 узлов
- **branch_resilience**: 6 узлов
- **branch_responsibility**: 8 узлов
- **branch_feedback**: 6 узлов
- **branch_maturity_environment**: 7 узлов

## Примеры

### Пример 1: node_grounding_point

```json
{
  "node_id": "node_grounding_point",
  "branch_id": "branch_subjectivity",
  "tier": "basic",
  "unlock_conditions": {
    "type": "quest_count",
    "quest_type": "reflection",
    "required_quests": 3
  },
  "xp_required": 0,
  "prerequisites": []
}
```

### Пример 2: node_self_regulation

```json
{
  "node_id": "node_self_regulation",
  "branch_id": "branch_subjectivity",
  "tier": "basic",
  "unlock_conditions": {
    "type": "quest_count",
    "quest_type": "state_management",
    "required_quests": 5
  },
  "xp_required": 100,
  "prerequisites": []
}
```

### Пример 3: node_role_differentiation

```json
{
  "node_id": "node_role_differentiation",
  "branch_id": "branch_subjectivity",
  "tier": "intermediate",
  "unlock_conditions": {
    "type": "evidence_count",
    "evidence_type": "role_noticed",
    "required_evidence": 7
  },
  "xp_required": 200,
  "prerequisites": []
}
```


## Все узлы (структура)

### 1. node_grounding_point

- **Branch ID**: `branch_subjectivity`
- **Tier**: `basic`
- **Prerequisites**: нет
- **XP Required**: 0
- **Unlock Conditions**: `{"type":"quest_count","quest_type":"reflection","required_quests":3}`


### 2. node_self_regulation

- **Branch ID**: `branch_subjectivity`
- **Tier**: `basic`
- **Prerequisites**: нет
- **XP Required**: 100
- **Unlock Conditions**: `{"type":"quest_count","quest_type":"state_management","required_quests":5}`


### 3. node_role_differentiation

- **Branch ID**: `branch_subjectivity`
- **Tier**: `intermediate`
- **Prerequisites**: нет
- **XP Required**: 200
- **Unlock Conditions**: `{"type":"evidence_count","evidence_type":"role_noticed","required_evidence":7}`


### 4. node_scenario_analysis

- **Branch ID**: `branch_subjectivity`
- **Tier**: `intermediate`
- **Prerequisites**: нет
- **XP Required**: 300
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_role_differentiation"]}`


### 5. node_subject_in_system

- **Branch ID**: `branch_subjectivity`
- **Tier**: `advanced`
- **Prerequisites**: нет
- **XP Required**: 500
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_scenario_analysis"]}`


### 6. node_decision_authorship

- **Branch ID**: `branch_subjectivity`
- **Tier**: `master`
- **Prerequisites**: нет
- **XP Required**: 1000
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_subject_in_system"]}`


### 7. node_architecture_coupling

- **Branch ID**: `branch_architectural_thinking`
- **Tier**: `basic`
- **Prerequisites**: нет
- **XP Required**: 0
- **Unlock Conditions**: `{"type":"quest_completion","quest_title":"Создал связь между X и Y"}`


### 8. node_field_of_differences

- **Branch ID**: `branch_architectural_thinking`
- **Tier**: `intermediate`
- **Prerequisites**: нет
- **XP Required**: 200
- **Unlock Conditions**: `{"type":"evidence_count","evidence_type":"conflict_contained","required_evidence":3}`


### 9. node_system_thinking

- **Branch ID**: `branch_architectural_thinking`
- **Tier**: `intermediate`
- **Prerequisites**: нет
- **XP Required**: 200
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_architecture_coupling"]}`


### 10. node_scenario_thinking

- **Branch ID**: `branch_architectural_thinking`
- **Tier**: `advanced`
- **Prerequisites**: нет
- **XP Required**: 500
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_system_thinking"]}`


### 11. node_form_assembly

- **Branch ID**: `branch_architectural_thinking`
- **Tier**: `advanced`
- **Prerequisites**: нет
- **XP Required**: 500
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_field_of_differences","node_system_thinking"]}`


### 12. node_containment

- **Branch ID**: `branch_architectural_thinking`
- **Tier**: `advanced`
- **Prerequisites**: нет
- **XP Required**: 500
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_field_of_differences"]}`


### 13. node_thinking_through_form

- **Branch ID**: `branch_architectural_thinking`
- **Tier**: `master`
- **Prerequisites**: нет
- **XP Required**: 1000
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_form_assembly","node_containment"]}`


### 14. node_personal_resilience

- **Branch ID**: `branch_resilience`
- **Tier**: `basic`
- **Prerequisites**: нет
- **XP Required**: 0
- **Unlock Conditions**: `{"type":"manual"}`


### 15. node_weak_zone_diagnosis

- **Branch ID**: `branch_resilience`
- **Tier**: `intermediate`
- **Prerequisites**: нет
- **XP Required**: 200
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_personal_resilience"]}`


### 16. node_recovery_skills

- **Branch ID**: `branch_resilience`
- **Tier**: `intermediate`
- **Prerequisites**: нет
- **XP Required**: 200
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_personal_resilience"]}`


### 17. node_emotional_work

- **Branch ID**: `branch_resilience`
- **Tier**: `advanced`
- **Prerequisites**: нет
- **XP Required**: 500
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_weak_zone_diagnosis","node_recovery_skills"]}`


### 18. node_cognitive_maturity

- **Branch ID**: `branch_resilience`
- **Tier**: `advanced`
- **Prerequisites**: нет
- **XP Required**: 500
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_emotional_work"]}`


### 19. node_role_energy

- **Branch ID**: `branch_resilience`
- **Tier**: `master`
- **Prerequisites**: нет
- **XP Required**: 1000
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_cognitive_maturity"]}`


### 20. node_responsibility_as_form

- **Branch ID**: `branch_responsibility`
- **Tier**: `basic`
- **Prerequisites**: нет
- **XP Required**: 0
- **Unlock Conditions**: `{"type":"manual"}`


### 21. node_responsibility_sag_diagnosis

- **Branch ID**: `branch_responsibility`
- **Tier**: `intermediate`
- **Prerequisites**: нет
- **XP Required**: 200
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_responsibility_as_form"]}`


### 22. node_delegation_as_coupling

- **Branch ID**: `branch_responsibility`
- **Tier**: `intermediate`
- **Prerequisites**: нет
- **XP Required**: 200
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_responsibility_as_form"]}`


### 23. node_upper_field_work

- **Branch ID**: `branch_responsibility`
- **Tier**: `advanced`
- **Prerequisites**: нет
- **XP Required**: 500
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_responsibility_sag_diagnosis"]}`


### 24. node_leader_liberation

- **Branch ID**: `branch_responsibility`
- **Tier**: `advanced`
- **Prerequisites**: нет
- **XP Required**: 500
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_delegation_as_coupling"]}`


### 25. node_shared_leadership

- **Branch ID**: `branch_responsibility`
- **Tier**: `advanced`
- **Prerequisites**: нет
- **XP Required**: 500
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_leader_liberation"]}`


### 26. node_psychological_ownership

- **Branch ID**: `branch_responsibility`
- **Tier**: `advanced`
- **Prerequisites**: нет
- **XP Required**: 500
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_shared_leadership"]}`


### 27. node_collective_efficacy

- **Branch ID**: `branch_responsibility`
- **Tier**: `master`
- **Prerequisites**: нет
- **XP Required**: 1000
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_psychological_ownership"]}`


### 28. node_feedback_types

- **Branch ID**: `branch_feedback`
- **Tier**: `basic`
- **Prerequisites**: нет
- **XP Required**: 0
- **Unlock Conditions**: `{"type":"manual"}`


### 29. node_language_of_differences

- **Branch ID**: `branch_feedback`
- **Tier**: `intermediate`
- **Prerequisites**: нет
- **XP Required**: 200
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_feedback_types"]}`


### 30. node_feedback_through_vulnerability

- **Branch ID**: `branch_feedback`
- **Tier**: `intermediate`
- **Prerequisites**: нет
- **XP Required**: 200
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_feedback_types"]}`


### 31. node_feedforward

- **Branch ID**: `branch_feedback`
- **Tier**: `advanced`
- **Prerequisites**: нет
- **XP Required**: 500
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_language_of_differences"]}`


### 32. node_rede_model

- **Branch ID**: `branch_feedback`
- **Tier**: `advanced`
- **Prerequisites**: нет
- **XP Required**: 500
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_feedback_through_vulnerability"]}`


### 33. node_mirror_holder

- **Branch ID**: `branch_feedback`
- **Tier**: `master`
- **Prerequisites**: нет
- **XP Required**: 1000
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_feedforward","node_rede_model"]}`


### 34. node_maturity_environment

- **Branch ID**: `branch_maturity_environment`
- **Tier**: `basic`
- **Prerequisites**: нет
- **XP Required**: 0
- **Unlock Conditions**: `{"type":"manual"}`


### 35. node_subjectivity_transfer

- **Branch ID**: `branch_maturity_environment`
- **Tier**: `intermediate`
- **Prerequisites**: нет
- **XP Required**: 200
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_maturity_environment"]}`


### 36. node_scene_holding

- **Branch ID**: `branch_maturity_environment`
- **Tier**: `advanced`
- **Prerequisites**: нет
- **XP Required**: 500
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_subjectivity_transfer"]}`


### 37. node_institutionalization

- **Branch ID**: `branch_maturity_environment`
- **Tier**: `advanced`
- **Prerequisites**: нет
- **XP Required**: 500
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_scene_holding"]}`


### 38. node_vertical_development

- **Branch ID**: `branch_maturity_environment`
- **Tier**: `advanced`
- **Prerequisites**: нет
- **XP Required**: 500
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_institutionalization"]}`


### 39. node_ddo

- **Branch ID**: `branch_maturity_environment`
- **Tier**: `advanced`
- **Prerequisites**: нет
- **XP Required**: 500
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_vertical_development"]}`


### 40. node_mature_parting

- **Branch ID**: `branch_maturity_environment`
- **Tier**: `master`
- **Prerequisites**: нет
- **XP Required**: 1000
- **Unlock Conditions**: `{"type":"prerequisite","required_nodes":["node_ddo"]}`



---

**См. также:**
- [02_NODES_CONTENT.md](./02_NODES_CONTENT.md) - Контент узлов
- [03_NODES_FULL.md](./03_NODES_FULL.md) - Полные данные узлов
