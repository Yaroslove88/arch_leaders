---
name: gap-close
description: Закрытие гэпа из GAP_ANALYSIS_REPORT
---

# /gap-close — Закрытие гэпа

Помоги закрыть конкретный гэп из `docs/audit/GAP_ANALYSIS_REPORT.md`.

## GAP Reference

Проект имеет 47 гэпов:
- **15 HIGH** — критичные
- **22 MEDIUM** — важные
- **10 LOW** — желательные

## Входные данные

Укажи:
1. **GAP ID** (например, P1, S2, M4)
2. **Дополнительный контекст** (если есть)

## Процесс

1. Найти гэп в GAP_ANALYSIS_REPORT.md
2. Проверить связанные аудиты (CJM_USER_AUDIT, CJM_ADMIN_AUDIT)
3. Определить scope и dependencies
4. Создать план реализации
5. Реализовать
6. Обновить документацию

## Output

```markdown
## GAP Closure: [ID]

### Gap Details
- **Область**: [area]
- **Описание**: [description]
- **Impact**: [HIGH | MEDIUM | LOW]
- **Effort**: [estimate]

### Implementation Plan

#### Tasks
1. [ ] [task 1]
2. [ ] [task 2]

#### Files to Modify
- `path/to/file.ts`

### Code Changes
[implementation]

### Verification
- [ ] [criterion 1]
- [ ] [criterion 2]

### Documentation Update
После закрытия обновить GAP_ANALYSIS_REPORT.md:
| ID | Status |
|----|--------|
| [ID] | ✅ DONE (date, #PR) |
```

## Quick Reference: HIGH Priority Gaps

| ID | Область | Гэп |
|----|---------|-----|
| P1 | Профиль | Нет страницы `/profile` |
| P2 | Профиль | Нет UI для смены пароля |
| S2 | Безопасность | Нет logout в админке |
| SUB1-2 | Подписки | Нет API/UI для подписок |
| M4 | Навигация | `router.back()` риск |
| A1 | Accessibility | Нет `<main>` |

## Пример использования

```
/gap-close P1

Закрыть гэп P1: Нет страницы профиля `/profile`
```
