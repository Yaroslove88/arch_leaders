# Сводка данных для валидации

**Дата генерации:** 2026-01-10  
**Версия данных:** 1.0.0  
**Tree Revision:** 6  
**Seed Version:** unknown

---

## Общая информация

Этот документ содержит общую информацию о всех данных дерева способностей, извлеченных для валидации.

## Статистика

### Узлы (Nodes)

- **Всего узлов**: 40
- **Узлов с контентом**: 40
- **Узлов без контента**: 0

**По уровням (tier):**
- **basic**: 7 узлов
- **intermediate**: 11 узлов
- **advanced**: 16 узлов
- **master**: 6 узлов

**По веткам (branch_id):**
- **branch_subjectivity**: 6 узлов
- **branch_architectural_thinking**: 7 узлов
- **branch_resilience**: 6 узлов
- **branch_responsibility**: 8 узлов
- **branch_feedback**: 6 узлов
- **branch_maturity_environment**: 7 узлов

### Ветки (Branches)

- **Всего веток**: 6

| Branch ID | Узлов | Узлов с контентом |
|-----------|-------|-------------------|
| `branch_subjectivity` | 6 | 6 |
| `branch_architectural_thinking` | 7 | 7 |
| `branch_resilience` | 6 | 6 |
| `branch_responsibility` | 8 | 8 |
| `branch_feedback` | 6 | 6 |
| `branch_maturity_environment` | 7 | 7 |

### Связи (Edges)

- **Всего связей**: 38

Связи найдены в данных.

### Квесты (Quests)

- **Всего квестов**: 32
- **Шаблонов квестов**: 33

**По типу (type):**
- **micro**: 19 квестов
- **weekly**: 4 квестов
- **story**: 4 квестов
- **in-person**: 5 квестов

**По источнику (source):**
- **base_template**: 32 квестов

### Кейсы (Cases)

- **Всего кейсов**: 75

**По сложности (difficulty):**
- **basic**: 25 кейсов
- **intermediate**: 27 кейсов
- **advanced**: 23 кейсов

**По веткам (branch_id):**
- **branch_resilience**: 5 кейсов
- **branch_subjectivity**: 16 кейсов
- **branch_architectural_thinking**: 19 кейсов
- **branch_responsibility**: 17 кейсов
- **branch_maturity_environment**: 13 кейсов
- **branch_feedback**: 5 кейсов

## Структура документов

Данные разделены на отдельные документы для удобной валидации:

1. **[00_SUMMARY.md](./00_SUMMARY.md)** - Этот файл (общая сводка)
2. **[01_NODES_STRUCTURE.md](./01_NODES_STRUCTURE.md)** - Структура узлов (только структурные поля)
3. **[02_NODES_CONTENT.md](./02_NODES_CONTENT.md)** - Контент узлов (только контентные поля из node-descriptions.json)
4. **[03_NODES_FULL.md](./03_NODES_FULL.md)** - Полные данные узлов (структура + контент)
5. **[04_BRANCHES_STRUCTURE.md](./04_BRANCHES_STRUCTURE.md)** - Структура веток (только структурные поля)
6. **[05_BRANCHES_CONTENT.md](./05_BRANCHES_CONTENT.md)** - Контент веток (только контентные поля)
7. **[06_BRANCHES_FULL.md](./06_BRANCHES_FULL.md)** - Полные данные веток (структура + контент + связанные узлы)
8. **[07_EDGES.md](./07_EDGES.md)** - Связи между узлами (если есть)
9. **[08_QUESTS_STRUCTURE.md](./08_QUESTS_STRUCTURE.md)** - Структура квестов (только структурные поля из БД)
10. **[09_QUESTS_CONTENT.md](./09_QUESTS_CONTENT.md)** - Контент квестов (только контентные поля из quest-templates.json)
11. **[10_QUESTS_FULL.md](./10_QUESTS_FULL.md)** - Полные данные квестов (структура + контент)
12. **[11_CASES_STRUCTURE.md](./11_CASES_STRUCTURE.md)** - Структура кейсов (только структурные поля из interactive-cases.json)
13. **[12_CASES_CONTENT.md](./12_CASES_CONTENT.md)** - Контент кейсов (только контентные поля из interactive-cases.json)
14. **[13_CASES_FULL.md](./13_CASES_FULL.md)** - Полные данные кейсов (структура + контент, все варианты опций)

## Принципы разделения данных

### Структура
- **Определение**: Неизменяемая база, определяющая топологию дерева
- **Поля**: node_id, branch_id, tier, prerequisites, unlock_conditions, xp_required
- **Источник**: initial-ability-tree.json → TreeSemantic.data (БД)

### Контент
- **Определение**: Переводимые, изменяемые текстовые данные
- **Поля**: name, description, full_description, practical_meaning, examples, integration_levels, reflection_prompts
- **Источник**: node-descriptions.json

### Пользовательские данные
- **Определение**: Уникальные для каждого пользователя данные
- **Поля**: state, xp_current, progress, relevance
- **Источник**: UserAbilityState (БД)
- **Примечание**: Не включаются в документы валидации (не являются частью базовых данных)

## Использование

Эти документы предназначены для:
- ✅ Валидации структуры данных
- ✅ Проверки полноты контента
- ✅ Выявления дублирования данных
- ✅ Проверки согласованности между структурой и контентом
- ✅ Анализа покрытия узлов контентом

---

**См. также:**
- [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) - Руководство по миграции
- [ARCHITECTURE_RULES.md](../../audit/ARCHITECTURE_RULES.md) - Правила архитектуры
