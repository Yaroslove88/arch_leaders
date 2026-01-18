# Структура веток (Branches)

**Дата генерации:** 2026-01-10  
**Версия данных:** 1.0.0  
**Количество веток:** 6

---

## Описание

Этот документ содержит только **структурные данные** веток, без контента.

## Схема данных

```typescript
interface BranchStructure {
  branch_id: string;
  color: string;
  icon: string;
}
```

## Поля структуры

| Поле | Тип | Описание |
|------|-----|----------|
| `branch_id` | `string` | Уникальный идентификатор ветки |
| `color` | `string` | Цвет ветки (HEX) |
| `icon` | `string` | Иконка ветки |

## Примеры

### Пример 1: branch_subjectivity

```json
{
  "branch_id": "branch_subjectivity",
  "color": "#4A90E2",
  "icon": "anchor"
}
```

### Пример 2: branch_architectural_thinking

```json
{
  "branch_id": "branch_architectural_thinking",
  "color": "#50C878",
  "icon": "blueprint"
}
```

### Пример 3: branch_resilience

```json
{
  "branch_id": "branch_resilience",
  "color": "#FF6B6B",
  "icon": "shield"
}
```


## Все ветки (структура)

### 1. branch_subjectivity

- **Color**: `#4A90E2`
- **Icon**: `anchor`


### 2. branch_architectural_thinking

- **Color**: `#50C878`
- **Icon**: `blueprint`


### 3. branch_resilience

- **Color**: `#FF6B6B`
- **Icon**: `shield`


### 4. branch_responsibility

- **Color**: `#FFA500`
- **Icon**: `scale`


### 5. branch_feedback

- **Color**: `#9B59B6`
- **Icon**: `loop`


### 6. branch_maturity_environment

- **Color**: `#1ABC9C`
- **Icon**: `tree`



---

**См. также:**
- [05_BRANCHES_CONTENT.md](./05_BRANCHES_CONTENT.md) - Контент веток
- [06_BRANCHES_FULL.md](./06_BRANCHES_FULL.md) - Полные данные веток
