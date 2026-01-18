# ✅ Фаза 3 завершена: Дерево способностей

## Что создано

### 1. Seed данные ✅
- `packages/shared/src/seed/initial-ability-tree.json` - начальное дерево способностей
- 6 веток LEADER:
  1. **Субъектность** (Subjectivity) - внутренняя устойчивость
  2. **Архитектурное мышление** (Architectural Thinking) - системное видение
  3. **Устойчивость** (Resilience) - выдерживание давления
  4. **Ответственность** (Responsibility) - принятие ответственности
  5. **Обратная связь** (Feedback) - дача и принятие обратной связи
  6. **Среда зрелости** (Maturity Environment) - создание условий для развития

- 12 базовых узлов способностей
- Связи между узлами (edges)
- Условия разблокировки (unlock_conditions)

### 2. Tree Service ✅
- `src/tree/tree.service.ts` - управление деревом способностей
- `src/tree/tree.controller.ts` - REST API endpoints
- `src/tree/tree.module.ts` - модуль

**Функции:**
- `getSemantic()` - получение семантического дерева
- `getLayout()` - получение layout дерева
- `applyChange()` - применение изменений с ChangeLog
- `undoChange()` - откат изменений
- `updateNodeProgress()` - обновление прогресса узла (XP)

### 3. ChangeLog система ✅
- Интегрирована в Tree Service
- Каждое изменение фиксируется с:
  - `change_id` - уникальный ID
  - `rationale` - обоснование
  - `actor` - кто инициировал (analyzer, user, system)
  - `ops_json` - операции изменения
  - `inverse_ops_json` - обратные операции для undo
  - `links_json` - связи с другими сущностями

## API Endpoints

### Tree
```
GET    /tree/semantic      - получить семантическое дерево
GET    /tree/layout        - получить layout дерева
POST   /tree/change        - применить изменение
POST   /tree/undo/:changeId - откатить изменение
PATCH  /tree/node/:nodeId  - обновить узел (XP, состояние)
```

## Структура дерева

### Ветки (Branches)
```json
{
  "branch_id": "branch_subjectivity",
  "name": "Субъектность",
  "description": "Внутренняя устойчивость и способность удерживать позицию",
  "color": "#4A90E2",
  "icon": "anchor"
}
```

### Узлы (Nodes)
```json
{
  "node_id": "node_containment",
  "name": "Контейнирование",
  "description": "Удержание напряжения без гашения",
  "branch_id": "branch_subjectivity",
  "tier": "basic",
  "state": "locked",
  "unlock_conditions": { "type": "manual" },
  "integration_level": "Novice",
  "xp_required": 0,
  "xp_current": 0
}
```

### Состояния узлов
- `locked` - заблокирован
- `available` - доступен для разблокировки
- `active` - активен (в процессе)
- `unlocked` - разблокирован
- `integrated` - интегрирован

### Уровни интеграции
- `Novice` - новичок
- `Integrated` - интегрирован
- `Embodied` - воплощен

## Примеры использования

### 1. Получить дерево
```bash
curl http://localhost:3001/tree/semantic
```

### 2. Применить изменение
```bash
curl -X POST http://localhost:3001/tree/change \
  -H "Content-Type: application/json" \
  -d '{
    "ops": [{
      "op": "node.update",
      "node_id": "node_containment",
      "patch": { "state": "available" }
    }],
    "rationale": "Разблокировка после первого квеста",
    "actor": "system"
  }'
```

### 3. Обновить прогресс узла
```bash
curl -X PATCH http://localhost:3001/tree/node/node_containment \
  -H "Content-Type: application/json" \
  -d '{
    "xpDelta": 50
  }'
```

### 4. Откатить изменение
```bash
curl -X POST http://localhost:3001/tree/undo/{changeId}
```

## Структура проекта

```
apps/api/src/
└── tree/
    ├── tree.service.ts    ✅
    ├── tree.controller.ts ✅
    └── tree.module.ts      ✅

packages/shared/src/seed/
└── initial-ability-tree.json ✅
```

## Проверка

✅ **TypeScript:** `pnpm typecheck` - проходит без ошибок
✅ **Seed данные:** JSON валиден, 6 веток определены
✅ **Tree Service:** все методы реализованы
✅ **ChangeLog:** интегрирован, undo работает

## Следующие шаги

**Фаза 4:** Квесты и Evidence
- Quests Module
- Quest Generation из анализа
- Evidence System
- Связь с узлами дерева

**Фаза 6:** Frontend
- Tree Visualization (React Flow)
- Отображение дерева способностей
- Взаимодействие с узлами

---

**Фаза 3 завершена!** ✅

