# Исправление несоответствий ID узлов в квестах

## Проблема

В квестах использовались ID узлов, которых нет в дереве способностей:
- `node_design_thinking` → не существует
- `node_organizational_culture` → не существует
- `node_grounding` → не существует (есть `node_grounding_point`)
- `node_giving_feedback` → не существует (есть `node_feedback_types`)
- `node_receiving_feedback` → не существует (есть `node_feedback_through_vulnerability`)
- И другие...

**Принцип:** Дерево способностей - источник истины. Квесты должны ссылаться только на существующие узлы.

## Решение

### 1. Создан скрипт анализа и исправления

**Файл:** `scripts/fix-quest-node-ids.ts`

**Функционал:**
- Анализирует все квесты в `data/quest-templates.json`
- Находит несоответствия между ID в квестах и узлами в дереве
- Применяет маппинг старых ID на новые
- Создает бэкап перед изменениями
- Исправляет квесты автоматически

### 2. Маппинг старых ID на новые

```typescript
const nodeMapping = {
  'node_design_thinking': 'node_thinking_through_form', // Мышление через форму
  'node_organizational_culture': 'node_maturity_environment', // Среда зрелости
  'node_grounding': 'node_grounding_point', // Точка опоры
  'node_giving_feedback': 'node_feedback_types', // Типы обратной связи
  'node_receiving_feedback': 'node_feedback_through_vulnerability', // Обратная связь через уязвимость
  'node_stress_tolerance': 'node_personal_resilience', // Личная устойчивость
  'node_recovery': 'node_recovery_skills', // Навыки восстановления
  'node_ownership': 'node_psychological_ownership', // Психологическое владение
  'node_accountability': 'node_responsibility_as_form', // Ответственность как форма
  'node_team_development': 'node_shared_leadership', // Разделенное лидерство
};
```

### 3. Обновление квестов в БД

**Файл:** `scripts/update-quest-node-ids-in-db.ts`

**Функционал:**
- Обновляет существующие квесты в БД
- Применяет маппинг к `linked_nodes` в таблице `quest`
- Обновлено 18 квестов

## Результаты

### Исправлено в шаблонах квестов:
- ✅ 19 квестов исправлено в `data/quest-templates.json`
- ✅ Создан бэкап: `data/quest-templates.json.backup`

### Исправлено в БД:
- ✅ 18 квестов обновлено в таблице `quest`
- ✅ Все `linked_nodes` теперь ссылаются на существующие узлы

### Начисление exp для админа:
- ✅ Exp начислен за квест "путь к зрелости":
  - `node_system_thinking`: 1000/200 (unlocked)
  - `node_thinking_through_form`: 400/1000 (locked)
  - `node_maturity_environment`: 400/0 (unlocked)

## Использование

### Для проверки несоответствий:
```bash
npx ts-node scripts/fix-quest-node-ids.ts
```

### Для обновления квестов в БД:
```bash
npx ts-node scripts/update-quest-node-ids-in-db.ts
```

### Для начисления exp за завершенный квест:
```bash
npx ts-node scripts/award-quest-xp-direct.ts
```

## Рекомендации

1. **При добавлении новых квестов:**
   - Всегда проверяйте, что `linked_nodes` ссылаются на существующие узлы из дерева
   - Используйте скрипт `fix-quest-node-ids.ts` для проверки

2. **При изменении дерева:**
   - Если удаляется узел, нужно обновить все квесты, которые на него ссылаются
   - Если переименовывается узел, нужно обновить маппинг в скриптах

3. **Автоматизация:**
   - Можно добавить проверку в CI/CD
   - Можно добавить валидацию при создании квестов через API

## Примечания

- Дерево способностей (`packages/shared/src/seed/initial-ability-tree.json`) - источник истины
- Все изменения должны идти от дерева к квестам, а не наоборот
- Маппинг можно расширять по мере необходимости

