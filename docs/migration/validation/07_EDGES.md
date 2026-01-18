# Связи (Edges)

**Дата генерации:** 2026-01-10  
**Версия данных:** 1.0.0  
**Количество связей:** 38

---

## Описание

Этот документ содержит данные о **связях между узлами** (edges).

## Схема данных

```typescript
interface Edge {
  source: string;  // node_id источника
  target: string;  // node_id цели
  type?: string;   // тип связи
  weight?: number; // вес связи
}
```

## Примеры

### Пример 1

```json
{
  "type": "prerequisite",
  "edge_id": "edge_grounding_self_regulation",
  "to_node": "node_self_regulation",
  "from_node": "node_grounding_point"
}
```

### Пример 2

```json
{
  "type": "prerequisite",
  "edge_id": "edge_self_regulation_role",
  "to_node": "node_role_differentiation",
  "from_node": "node_self_regulation"
}
```

### Пример 3

```json
{
  "type": "prerequisite",
  "edge_id": "edge_role_scenario",
  "to_node": "node_scenario_analysis",
  "from_node": "node_role_differentiation"
}
```


## Все связи

### 1. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_grounding_self_regulation",
  "to_node": "node_self_regulation",
  "from_node": "node_grounding_point"
}
```


### 2. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_self_regulation_role",
  "to_node": "node_role_differentiation",
  "from_node": "node_self_regulation"
}
```


### 3. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_role_scenario",
  "to_node": "node_scenario_analysis",
  "from_node": "node_role_differentiation"
}
```


### 4. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_scenario_subject",
  "to_node": "node_subject_in_system",
  "from_node": "node_scenario_analysis"
}
```


### 5. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_subject_authorship",
  "to_node": "node_decision_authorship",
  "from_node": "node_subject_in_system"
}
```


### 6. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_coupling_differences",
  "to_node": "node_field_of_differences",
  "from_node": "node_architecture_coupling"
}
```


### 7. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_coupling_system",
  "to_node": "node_system_thinking",
  "from_node": "node_architecture_coupling"
}
```


### 8. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_system_scenario",
  "to_node": "node_scenario_thinking",
  "from_node": "node_system_thinking"
}
```


### 9. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_differences_containment",
  "to_node": "node_containment",
  "from_node": "node_field_of_differences"
}
```


### 10. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_differences_system_assembly",
  "to_node": "node_form_assembly",
  "from_node": "node_field_of_differences"
}
```


### 11. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_system_assembly",
  "to_node": "node_form_assembly",
  "from_node": "node_system_thinking"
}
```


### 12. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_assembly_containment_form",
  "to_node": "node_thinking_through_form",
  "from_node": "node_form_assembly"
}
```


### 13. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_containment_form",
  "to_node": "node_thinking_through_form",
  "from_node": "node_containment"
}
```


### 14. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_resilience_weak_zones",
  "to_node": "node_weak_zone_diagnosis",
  "from_node": "node_personal_resilience"
}
```


### 15. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_resilience_recovery",
  "to_node": "node_recovery_skills",
  "from_node": "node_personal_resilience"
}
```


### 16. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_weak_recovery_emotional",
  "to_node": "node_emotional_work",
  "from_node": "node_weak_zone_diagnosis"
}
```


### 17. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_recovery_emotional",
  "to_node": "node_emotional_work",
  "from_node": "node_recovery_skills"
}
```


### 18. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_emotional_cognitive",
  "to_node": "node_cognitive_maturity",
  "from_node": "node_emotional_work"
}
```


### 19. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_cognitive_role",
  "to_node": "node_role_energy",
  "from_node": "node_cognitive_maturity"
}
```


### 20. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_responsibility_sag",
  "to_node": "node_responsibility_sag_diagnosis",
  "from_node": "node_responsibility_as_form"
}
```


### 21. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_responsibility_delegation",
  "to_node": "node_delegation_as_coupling",
  "from_node": "node_responsibility_as_form"
}
```


### 22. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_sag_upper_field",
  "to_node": "node_upper_field_work",
  "from_node": "node_responsibility_sag_diagnosis"
}
```


### 23. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_delegation_liberation",
  "to_node": "node_leader_liberation",
  "from_node": "node_delegation_as_coupling"
}
```


### 24. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_liberation_shared",
  "to_node": "node_shared_leadership",
  "from_node": "node_leader_liberation"
}
```


### 25. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_shared_ownership",
  "to_node": "node_psychological_ownership",
  "from_node": "node_shared_leadership"
}
```


### 26. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_ownership_efficacy",
  "to_node": "node_collective_efficacy",
  "from_node": "node_psychological_ownership"
}
```


### 27. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_feedback_language",
  "to_node": "node_language_of_differences",
  "from_node": "node_feedback_types"
}
```


### 28. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_feedback_vulnerability",
  "to_node": "node_feedback_through_vulnerability",
  "from_node": "node_feedback_types"
}
```


### 29. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_language_feedforward",
  "to_node": "node_feedforward",
  "from_node": "node_language_of_differences"
}
```


### 30. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_vulnerability_rede",
  "to_node": "node_rede_model",
  "from_node": "node_feedback_through_vulnerability"
}
```


### 31. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_feedforward_rede_mirror",
  "to_node": "node_mirror_holder",
  "from_node": "node_feedforward"
}
```


### 32. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_rede_mirror",
  "to_node": "node_mirror_holder",
  "from_node": "node_rede_model"
}
```


### 33. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_maturity_subjectivity",
  "to_node": "node_subjectivity_transfer",
  "from_node": "node_maturity_environment"
}
```


### 34. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_subjectivity_scene",
  "to_node": "node_scene_holding",
  "from_node": "node_subjectivity_transfer"
}
```


### 35. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_scene_institutionalization",
  "to_node": "node_institutionalization",
  "from_node": "node_scene_holding"
}
```


### 36. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_institutionalization_vertical",
  "to_node": "node_vertical_development",
  "from_node": "node_institutionalization"
}
```


### 37. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_vertical_ddo",
  "to_node": "node_ddo",
  "from_node": "node_vertical_development"
}
```


### 38. Связь undefined → undefined

```json
{
  "type": "prerequisite",
  "edge_id": "edge_ddo_parting",
  "to_node": "node_mature_parting",
  "from_node": "node_ddo"
}
```



---
