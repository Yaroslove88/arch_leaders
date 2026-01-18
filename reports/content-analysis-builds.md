# Анализ стилей лидерства

*Дата анализа: 09.01.2026, 19:05:19*

## Сводная статистика

- **Всего стилей:** 4
- ✅ **С полным контентом:** 4
- ⚠️ **С предупреждениями:** 0
- ❌ **С ошибками:** 0

## Детальный анализ

### ✅ build_crisis_solver - Кризисный решатель

#### 📋 Содержание полей

```json
{
  "build": {
    "build_id": "build_crisis_solver",
    "name": "Кризисный решатель",
    "icon": "⚔️",
    "fantasy": "Я — тот, кто держит систему, когда всё рушится",
    "description": "Эффективен в турбулентности, быстро действует, держит давление",
    "entry_conditions": {
      "required_nodes": [
        "node_containment",
        "node_personal_resilience",
        "node_emotional_work"
      ],
      "optional_nodes": [
        "node_cognitive_maturity"
      ],
      "behavioral_patterns": {
        "crisis_decisions_percentage": 60,
        "personal_decisions_percentage": 50
      },
      "min_required_count": 3
    },
    "bonuses": {
      "crisis_skills_cost_reduction": 30,
      "timer_penalty_reduction": 0.5,
      "access_to_stabilization_cards": true
    },
    "hidden_costs": {
      "system_dependency_growth": true,
      "architectural_skills_cost_increase": 25,
      "sm_domains_stagnation": [
        "S",
        "F"
      ]
    },
    "exit_conditions": {
      "architectural_decisions_count": 2,
      "delegated_risky_decisions_count": 1,
      "conscious_refusal_from_crisis_ult": true
    },
    "color": "#FF6B6B"
  }
}
```

---

### ✅ build_architect - Архитектор системы

#### 📋 Содержание полей

```json
{
  "build": {
    "build_id": "build_architect",
    "name": "Архитектор системы",
    "icon": "🧱",
    "fantasy": "Я создаю условия, а не решения",
    "description": "Качает систему, снижает хаос, терпелив к росту",
    "entry_conditions": {
      "required_nodes": [
        "node_thinking_through_form",
        "node_form_assembly",
        "node_system_thinking"
      ],
      "optional_nodes": [
        "node_scenario_thinking",
        "node_institutionalization"
      ],
      "behavioral_patterns": {
        "architectural_decisions_count": 1,
        "crisis_not_solved_manually": 1
      },
      "min_required_count": 2
    },
    "bonuses": {
      "architectural_skills_cost_reduction": 25,
      "repeating_scenes_reduction": 0.3,
      "systemic_consequences_visible": true
    },
    "hidden_costs": {
      "crises_more_painful": true,
      "system_errors_visible_immediately": true,
      "requires_high_r_domain": true
    },
    "exit_conditions": {
      "manual_crisis_intervention": true,
      "frequent_override_decisions": 3,
      "ignore_people_conflicts": true
    },
    "color": "#50C878"
  }
}
```

---

### ✅ build_developing_leader - Развивающий лидер

#### 📋 Содержание полей

```json
{
  "build": {
    "build_id": "build_developing_leader",
    "name": "Развивающий лидер",
    "icon": "🌱",
    "fantasy": "Я выращиваю субъектность других",
    "description": "Выращивает субъектность других, снижает свою нагрузку, строит автономию",
    "entry_conditions": {
      "required_nodes": [
        "node_delegation_as_coupling",
        "node_subjectivity_transfer",
        "node_scene_holding"
      ],
      "optional_nodes": [
        "node_maturity_environment",
        "node_vertical_development"
      ],
      "behavioral_patterns": {
        "autonomous_team_decisions_count": 1,
        "held_interventions_count": 1
      },
      "min_required_count": 2
    },
    "bonuses": {
      "delegation_gives_xp": true,
      "team_errors_no_penalty": true,
      "system_trust_growth": 0.2
    },
    "hidden_costs": {
      "short_term_efficiency_drops": true,
      "crises_more_dangerous": true,
      "requires_high_c_and_r": true
    },
    "exit_conditions": {
      "direct_management": true,
      "frequent_corrections": 3,
      "intolerance_to_errors": true
    },
    "color": "#1ABC9C"
  }
}
```

---

### ✅ build_strategist - Стратег

#### 📋 Содержание полей

```json
{
  "build": {
    "build_id": "build_strategist",
    "name": "Стратег",
    "icon": "🧭",
    "fantasy": "Я влияю на направление, а не на шаги",
    "description": "Мыслит на уровне направлений, мало решений, но высокоимпактных, работает с неопределённостью",
    "entry_conditions": {
      "required_nodes": [
        "node_scenario_thinking",
        "node_decision_authorship",
        "node_upper_field_work"
      ],
      "optional_nodes": [
        "node_system_thinking",
        "node_cognitive_maturity"
      ],
      "behavioral_patterns": {
        "conscious_scene_skip": 1,
        "priority_change": 1
      },
      "min_required_count": 2
    },
    "bonuses": {
      "can_cancel_scenes": true,
      "xp_for_hypotheses": true,
      "access_to_game_change": true
    },
    "hidden_costs": {
      "risk_of_detachment_from_reality": true,
      "crises_more_expensive": true,
      "c_domain_drops_if_abused": true
    },
    "exit_conditions": {
      "return_to_operational_decisions": true,
      "series_of_concrete_interventions": 3
    },
    "color": "#9B59B6"
  }
}
```

---

