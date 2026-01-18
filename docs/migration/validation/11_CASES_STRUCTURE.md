# Структура кейсов (Cases)

**Дата генерации:** 2026-01-10  
**Количество кейсов:** 75

---

## Описание

Этот документ содержит только **структурные данные** кейсов из `interactive-cases.json`.

## Схема данных

```typescript
interface CaseStructure {
  id: string;
  node_id: string;
  branch_id: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  indicators: {
    trust: string;
    risk: string;
    time: string;
  };
}
```

## Поля структуры

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `string` | Уникальный идентификатор кейса |
| `node_id` | `string` | ID узла, к которому привязан кейс |
| `branch_id` | `string` | ID ветки, к которой относится кейс |
| `difficulty` | `'basic' | 'intermediate' | 'advanced'` | Уровень сложности кейса |
| `indicators` | `object` | Индикаторы (trust, risk, time) |

## Статистика

### По сложности (difficulty)

- **basic**: 25 кейсов
- **intermediate**: 27 кейсов
- **advanced**: 23 кейсов

### По веткам (branch_id)

- **branch_resilience**: 5 кейсов
- **branch_subjectivity**: 16 кейсов
- **branch_architectural_thinking**: 19 кейсов
- **branch_responsibility**: 17 кейсов
- **branch_maturity_environment**: 13 кейсов
- **branch_feedback**: 5 кейсов

### По узлам (node_id)

- **node_containment**: 4 кейсов
- **node_thinking_through_form**: 4 кейсов
- **node_scenario_thinking**: 3 кейсов
- **node_role_differentiation**: 3 кейсов
- **node_architecture_coupling**: 3 кейсов
- **node_delegation_as_coupling**: 3 кейсов
- **node_system_thinking**: 3 кейсов
- **node_responsibility_sag_diagnosis**: 3 кейсов
- **node_subjectivity_transfer**: 3 кейсов
- **node_scenario_analysis**: 3 кейсов
- **node_subject_in_system**: 3 кейсов
- **node_decision_authorship**: 3 кейсов
- **node_field_of_differences**: 3 кейсов
- **node_form_assembly**: 3 кейсов
- **node_responsibility_as_form**: 3 кейсов
- **node_upper_field_work**: 3 кейсов
- **node_shared_leadership**: 3 кейсов
- **node_institutionalization**: 3 кейсов
- **node_ddo**: 3 кейсов
- **node_grounding_point**: 1 кейсов
- **node_self_regulation**: 1 кейсов
- **node_personal_resilience**: 1 кейсов
- **node_feedback_types**: 1 кейсов
- **node_language_of_differences**: 1 кейсов
- **node_feedback_through_vulnerability**: 1 кейсов
- **node_maturity_environment**: 1 кейсов
- **node_scene_holding**: 1 кейсов
- **node_vertical_development**: 1 кейсов
- **node_leader_liberation**: 1 кейсов
- **node_psychological_ownership**: 1 кейсов
- **node_feedforward**: 1 кейсов
- **node_rede_model**: 1 кейсов
- **node_emotional_work**: 1 кейсов
- **node_cognitive_maturity**: 1 кейсов
- **node_mature_parting**: 1 кейсов

## Примеры

### Пример 1: case_let_it_break_1

```json
{
  "id": "case_let_it_break_1",
  "node_id": "node_containment",
  "branch_id": "branch_resilience",
  "difficulty": "basic",
  "indicators": {
    "trust": "medium",
    "risk": "low",
    "time": "low"
  }
}
```

### Пример 2: case_let_it_break_2

```json
{
  "id": "case_let_it_break_2",
  "node_id": "node_containment",
  "branch_id": "branch_resilience",
  "difficulty": "intermediate",
  "indicators": {
    "trust": "high",
    "risk": "medium",
    "time": "medium"
  }
}
```

### Пример 3: case_containment_conflict

```json
{
  "id": "case_containment_conflict",
  "node_id": "node_containment",
  "branch_id": "branch_subjectivity",
  "difficulty": "intermediate",
  "indicators": {
    "trust": "medium",
    "risk": "medium",
    "time": "low"
  }
}
```


## Все кейсы (структура)

### 1. case_let_it_break_1

- **Node ID**: `node_containment`
- **Branch ID**: `branch_resilience`
- **Difficulty**: `basic`
- **Indicators**: trust=`medium`, risk=`low`, time=`low`


### 2. case_let_it_break_2

- **Node ID**: `node_containment`
- **Branch ID**: `branch_resilience`
- **Difficulty**: `intermediate`
- **Indicators**: trust=`high`, risk=`medium`, time=`medium`


### 3. case_containment_conflict

- **Node ID**: `node_containment`
- **Branch ID**: `branch_subjectivity`
- **Difficulty**: `intermediate`
- **Indicators**: trust=`medium`, risk=`medium`, time=`low`


### 4. case_crisis_real

- **Node ID**: `node_containment`
- **Branch ID**: `branch_subjectivity`
- **Difficulty**: `advanced`
- **Indicators**: trust=`high`, risk=`high`, time=`critical`


### 5. case_rule_creation_bugs

- **Node ID**: `node_thinking_through_form`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `intermediate`
- **Indicators**: 


### 6. case_decision_uncertainty

- **Node ID**: `node_scenario_thinking`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `advanced`
- **Indicators**: , time=`medium`


### 7. case_role_differentiation_1

- **Node ID**: `node_role_differentiation`
- **Branch ID**: `branch_subjectivity`
- **Difficulty**: `intermediate`
- **Indicators**: trust=`medium`, risk=`medium`, time=`low`


### 8. case_architecture_coupling_1

- **Node ID**: `node_architecture_coupling`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `basic`
- **Indicators**: trust=`low`, risk=`medium`, time=`medium`


### 9. case_delegation_coupling_1

- **Node ID**: `node_delegation_as_coupling`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `intermediate`
- **Indicators**: trust=`high`, risk=`medium`, time=`medium`


### 10. case_system_thinking_1

- **Node ID**: `node_system_thinking`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `intermediate`
- **Indicators**: , risk=`medium`, time=`medium`


### 11. case_responsibility_sag_1

- **Node ID**: `node_responsibility_sag_diagnosis`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `intermediate`
- **Indicators**: , risk=`high`, time=`medium`


### 12. case_subjectivity_transfer_1

- **Node ID**: `node_subjectivity_transfer`
- **Branch ID**: `branch_maturity_environment`
- **Difficulty**: `intermediate`
- **Indicators**: trust=`medium`, risk=`low`


### 13. case_role_differentiation_2

- **Node ID**: `node_role_differentiation`
- **Branch ID**: `branch_subjectivity`
- **Difficulty**: `basic`
- **Indicators**: trust=`medium`, risk=`low`, time=`low`


### 14. case_role_differentiation_3

- **Node ID**: `node_role_differentiation`
- **Branch ID**: `branch_subjectivity`
- **Difficulty**: `advanced`
- **Indicators**: trust=`high`, risk=`high`, time=`critical`


### 15. case_architecture_coupling_2

- **Node ID**: `node_architecture_coupling`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `intermediate`
- **Indicators**: trust=`low`, risk=`high`, time=`medium`


### 16. case_architecture_coupling_3

- **Node ID**: `node_architecture_coupling`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `advanced`
- **Indicators**: trust=`low`, risk=`high`, time=`critical`


### 17. case_delegation_coupling_2

- **Node ID**: `node_delegation_as_coupling`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `basic`
- **Indicators**: trust=`medium`, risk=`low`, time=`low`


### 18. case_delegation_coupling_3

- **Node ID**: `node_delegation_as_coupling`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `advanced`
- **Indicators**: trust=`high`, risk=`high`, time=`critical`


### 19. case_system_thinking_2

- **Node ID**: `node_system_thinking`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `basic`
- **Indicators**: , risk=`low`, time=`low`


### 20. case_system_thinking_3

- **Node ID**: `node_system_thinking`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `advanced`
- **Indicators**: , risk=`high`, time=`medium`


### 21. case_responsibility_sag_2

- **Node ID**: `node_responsibility_sag_diagnosis`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `basic`
- **Indicators**: , risk=`medium`, time=`low`


### 22. case_responsibility_sag_3

- **Node ID**: `node_responsibility_sag_diagnosis`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `advanced`
- **Indicators**: , risk=`high`, time=`critical`


### 23. case_subjectivity_transfer_2

- **Node ID**: `node_subjectivity_transfer`
- **Branch ID**: `branch_maturity_environment`
- **Difficulty**: `basic`
- **Indicators**: trust=`medium`, risk=`low`


### 24. case_subjectivity_transfer_3

- **Node ID**: `node_subjectivity_transfer`
- **Branch ID**: `branch_maturity_environment`
- **Difficulty**: `advanced`
- **Indicators**: trust=`high`, risk=`medium`


### 25. case_scenario_thinking_2

- **Node ID**: `node_scenario_thinking`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `basic`
- **Indicators**: , time=`low`


### 26. case_scenario_thinking_3

- **Node ID**: `node_scenario_thinking`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `intermediate`
- **Indicators**: , time=`critical`


### 27. case_scenario_breakdown_1

- **Node ID**: `node_scenario_analysis`
- **Branch ID**: `branch_subjectivity`
- **Difficulty**: `basic`
- **Indicators**: не указаны


### 28. case_scenario_breakdown_2

- **Node ID**: `node_scenario_analysis`
- **Branch ID**: `branch_subjectivity`
- **Difficulty**: `intermediate`
- **Indicators**: не указаны


### 29. case_scenario_breakdown_3

- **Node ID**: `node_scenario_analysis`
- **Branch ID**: `branch_subjectivity`
- **Difficulty**: `advanced`
- **Indicators**: не указаны


### 30. case_subject_in_system_1

- **Node ID**: `node_subject_in_system`
- **Branch ID**: `branch_subjectivity`
- **Difficulty**: `basic`
- **Indicators**: не указаны


### 31. case_subject_in_system_2

- **Node ID**: `node_subject_in_system`
- **Branch ID**: `branch_subjectivity`
- **Difficulty**: `intermediate`
- **Indicators**: не указаны


### 32. case_subject_in_system_3

- **Node ID**: `node_subject_in_system`
- **Branch ID**: `branch_subjectivity`
- **Difficulty**: `advanced`
- **Indicators**: не указаны


### 33. case_decision_authorship_1

- **Node ID**: `node_decision_authorship`
- **Branch ID**: `branch_subjectivity`
- **Difficulty**: `basic`
- **Indicators**: не указаны


### 34. case_decision_authorship_2

- **Node ID**: `node_decision_authorship`
- **Branch ID**: `branch_subjectivity`
- **Difficulty**: `intermediate`
- **Indicators**: не указаны


### 35. case_decision_authorship_3

- **Node ID**: `node_decision_authorship`
- **Branch ID**: `branch_subjectivity`
- **Difficulty**: `advanced`
- **Indicators**: не указаны


### 36. case_difference_field_1

- **Node ID**: `node_field_of_differences`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `basic`
- **Indicators**: не указаны


### 37. case_difference_field_2

- **Node ID**: `node_field_of_differences`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `intermediate`
- **Indicators**: не указаны


### 38. case_difference_field_3

- **Node ID**: `node_field_of_differences`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `advanced`
- **Indicators**: не указаны


### 39. case_form_assembly_1

- **Node ID**: `node_form_assembly`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `basic`
- **Indicators**: не указаны


### 40. case_form_assembly_2

- **Node ID**: `node_form_assembly`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `intermediate`
- **Indicators**: не указаны


### 41. case_form_assembly_3

- **Node ID**: `node_form_assembly`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `advanced`
- **Indicators**: не указаны


### 42. case_thinking_through_form_1

- **Node ID**: `node_thinking_through_form`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `basic`
- **Indicators**: не указаны


### 43. case_thinking_through_form_2

- **Node ID**: `node_thinking_through_form`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `intermediate`
- **Indicators**: не указаны


### 44. case_thinking_through_form_3

- **Node ID**: `node_thinking_through_form`
- **Branch ID**: `branch_architectural_thinking`
- **Difficulty**: `advanced`
- **Indicators**: не указаны


### 45. case_responsibility_as_form_1

- **Node ID**: `node_responsibility_as_form`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `basic`
- **Indicators**: не указаны


### 46. case_responsibility_as_form_2

- **Node ID**: `node_responsibility_as_form`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `intermediate`
- **Indicators**: не указаны


### 47. case_responsibility_as_form_3

- **Node ID**: `node_responsibility_as_form`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `advanced`
- **Indicators**: не указаны


### 48. case_upper_field_work_1

- **Node ID**: `node_upper_field_work`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `basic`
- **Indicators**: не указаны


### 49. case_upper_field_work_2

- **Node ID**: `node_upper_field_work`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `intermediate`
- **Indicators**: не указаны


### 50. case_upper_field_work_3

- **Node ID**: `node_upper_field_work`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `advanced`
- **Indicators**: не указаны


### 51. case_distributed_leadership_1

- **Node ID**: `node_shared_leadership`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `basic`
- **Indicators**: не указаны


### 52. case_distributed_leadership_2

- **Node ID**: `node_shared_leadership`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `intermediate`
- **Indicators**: не указаны


### 53. case_distributed_leadership_3

- **Node ID**: `node_shared_leadership`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `advanced`
- **Indicators**: не указаны


### 54. case_institutionalization_1

- **Node ID**: `node_institutionalization`
- **Branch ID**: `branch_maturity_environment`
- **Difficulty**: `basic`
- **Indicators**: не указаны


### 55. case_institutionalization_2

- **Node ID**: `node_institutionalization`
- **Branch ID**: `branch_maturity_environment`
- **Difficulty**: `intermediate`
- **Indicators**: не указаны


### 56. case_institutionalization_3

- **Node ID**: `node_institutionalization`
- **Branch ID**: `branch_maturity_environment`
- **Difficulty**: `advanced`
- **Indicators**: не указаны


### 57. case_organization_as_trainer_1

- **Node ID**: `node_ddo`
- **Branch ID**: `branch_maturity_environment`
- **Difficulty**: `basic`
- **Indicators**: не указаны


### 58. case_organization_as_trainer_2

- **Node ID**: `node_ddo`
- **Branch ID**: `branch_maturity_environment`
- **Difficulty**: `intermediate`
- **Indicators**: не указаны


### 59. case_organization_as_trainer_3

- **Node ID**: `node_ddo`
- **Branch ID**: `branch_maturity_environment`
- **Difficulty**: `advanced`
- **Indicators**: не указаны


### 60. case_grounding_point_1

- **Node ID**: `node_grounding_point`
- **Branch ID**: `branch_subjectivity`
- **Difficulty**: `basic`
- **Indicators**: trust=`high`, risk=`medium`, time=`low`


### 61. case_self_regulation_1

- **Node ID**: `node_self_regulation`
- **Branch ID**: `branch_subjectivity`
- **Difficulty**: `basic`
- **Indicators**: trust=`medium`, risk=`medium`, time=`low`


### 62. case_personal_resilience_1

- **Node ID**: `node_personal_resilience`
- **Branch ID**: `branch_resilience`
- **Difficulty**: `basic`
- **Indicators**: trust=`high`, risk=`low`, time=`medium`


### 63. case_feedback_types_1

- **Node ID**: `node_feedback_types`
- **Branch ID**: `branch_feedback`
- **Difficulty**: `basic`
- **Indicators**: trust=`medium`, risk=`low`, time=`low`


### 64. case_language_of_differences_1

- **Node ID**: `node_language_of_differences`
- **Branch ID**: `branch_feedback`
- **Difficulty**: `basic`
- **Indicators**: trust=`medium`, risk=`low`, time=`low`


### 65. case_feedback_through_vulnerability_1

- **Node ID**: `node_feedback_through_vulnerability`
- **Branch ID**: `branch_feedback`
- **Difficulty**: `intermediate`
- **Indicators**: trust=`high`, risk=`medium`, time=`low`


### 66. case_maturity_environment_1

- **Node ID**: `node_maturity_environment`
- **Branch ID**: `branch_maturity_environment`
- **Difficulty**: `basic`
- **Indicators**: trust=`high`, risk=`low`, time=`high`


### 67. case_scene_holding_1

- **Node ID**: `node_scene_holding`
- **Branch ID**: `branch_maturity_environment`
- **Difficulty**: `intermediate`
- **Indicators**: trust=`high`, risk=`low`, time=`low`


### 68. case_vertical_development_1

- **Node ID**: `node_vertical_development`
- **Branch ID**: `branch_maturity_environment`
- **Difficulty**: `advanced`
- **Indicators**: trust=`high`, risk=`medium`, time=`high`


### 69. case_leader_liberation_1

- **Node ID**: `node_leader_liberation`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `intermediate`
- **Indicators**: trust=`high`, risk=`medium`, time=`medium`


### 70. case_psychological_ownership_1

- **Node ID**: `node_psychological_ownership`
- **Branch ID**: `branch_responsibility`
- **Difficulty**: `intermediate`
- **Indicators**: trust=`high`, risk=`low`, time=`high`


### 71. case_feedforward_1

- **Node ID**: `node_feedforward`
- **Branch ID**: `branch_feedback`
- **Difficulty**: `intermediate`
- **Indicators**: trust=`high`, risk=`low`, time=`medium`


### 72. case_rede_model_1

- **Node ID**: `node_rede_model`
- **Branch ID**: `branch_feedback`
- **Difficulty**: `advanced`
- **Indicators**: trust=`high`, risk=`medium`, time=`medium`


### 73. case_emotional_work_1

- **Node ID**: `node_emotional_work`
- **Branch ID**: `branch_resilience`
- **Difficulty**: `intermediate`
- **Indicators**: trust=`high`, risk=`medium`, time=`medium`


### 74. case_cognitive_maturity_1

- **Node ID**: `node_cognitive_maturity`
- **Branch ID**: `branch_resilience`
- **Difficulty**: `advanced`
- **Indicators**: trust=`high`, risk=`high`, time=`low`


### 75. case_mature_parting_1

- **Node ID**: `node_mature_parting`
- **Branch ID**: `branch_maturity_environment`
- **Difficulty**: `advanced`
- **Indicators**: trust=`high`, risk=`high`, time=`high`



---

**См. также:**
- [12_CASES_CONTENT.md](./12_CASES_CONTENT.md) - Контент кейсов
- [13_CASES_FULL.md](./13_CASES_FULL.md) - Полные данные кейсов
