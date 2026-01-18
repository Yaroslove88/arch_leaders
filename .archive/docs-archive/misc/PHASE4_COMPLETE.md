# ✅ Фаза 4 завершена: Квесты и Evidence

## Что создано

### 1. Quests Module ✅
- `src/quests/quests.service.ts` - полный CRUD для квестов
- `src/quests/quests.controller.ts` - REST API endpoints
- `src/quests/quests.module.ts` - модуль

**Функции:**
- `getAll()` - список квестов с фильтрацией по статусу
- `getById()` - получить квест по ID
- `create()` - создать квест с автоматическим связыванием узлов
- `update()` - обновить квест
- `delete()` - удалить квест
- `activate()` - активировать квест (с проверкой лимита 5 активных)
- `complete()` - завершить квест и начислить XP на узлы

**Типы квестов:**
- `micro` - микро-квесты (быстрые задачи)
- `weekly` - недельные квесты
- `story` - сюжетные квесты
- `in-person` - очные квесты

**Статусы:**
- `backlog` - в бэклоге
- `active` - активен (максимум 5)
- `done` - завершен
- `archived` - архивирован

### 2. Quest Generation Service ✅
- `src/quests/quest-generation.service.ts` - генерация квестов из анализа

**Функции:**
- `generateQuestsFromSession()` - генерация квестов на основе Session
  - Из ability_signals - квесты на развитие способностей
  - Из focus - квесты на фокусные области
  - Из themes - квесты на исследование тем
- `manageActiveQuestLimit()` - управление лимитом активных квестов

**Интеграция:**
- Автоматически вызывается после анализа Session
- Генерирует квесты с привязкой к узлам дерева
- Автоматически управляет лимитом активных квестов

### 3. Evidence System ✅
- Интеграция с Quests Module
- Связь Evidence с Quest и AbilityNode
- При завершении квеста начисляется XP на связанные узлы

**Механика:**
- При завершении квеста (`complete()`) начисляется XP на все связанные узлы
- XP из `reward.skill_xp` распределяется между узлами
- Если `skill_xp` не указан, дается минимальный прогресс (5%)

## API Endpoints

### Quests
```
GET    /quests                    - список квестов
GET    /quests/:id               - получить по ID
POST   /quests                    - создать квест
PATCH  /quests/:id                - обновить квест
DELETE /quests/:id                - удалить квест
POST   /quests/:id/activate       - активировать квест
POST   /quests/:id/complete       - завершить квест
PATCH  /quests/:id/status         - обновить статус
POST   /quests/generate/:sessionId - сгенерировать квесты из Session
POST   /quests/manage-limit       - управление лимитом активных
```

## Рабочий процесс

### 1. Генерация квестов из анализа
```
Entry → Analysis → Session → Quest Generation
```

После анализа Session автоматически:
1. Генерируются квесты на основе ability_signals
2. Генерируются квесты на основе focus (high priority)
3. Генерируется квест на основе главной темы
4. Управляется лимит активных квестов (5)

### 2. Завершение квеста
```
Quest.complete() → 
  - Статус: done
  - completed_at: now
  - Начисление XP на linked_nodes
  - Обновление прогресса узлов в дереве
```

### 3. Активация квеста
```
Quest.activate() →
  - Проверка лимита (максимум 5 активных)
  - Статус: active
  - Если лимит превышен → ошибка
```

## Примеры использования

### 1. Создать квест вручную
```bash
curl -X POST http://localhost:3001/quests \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Практиковать контейнирование",
    "description": "Удерживать напряжение в 3 ситуациях без гашения",
    "type": "micro",
    "criteria": {
      "type": "evidence",
      "target": 3,
      "description": "Собрать 3 доказательства"
    },
    "reward": {
      "xp": 100,
      "skill_xp": 50
    },
    "linked_nodes": ["node_containment"]
  }'
```

### 2. Сгенерировать квесты из Session
```bash
curl -X POST http://localhost:3001/quests/generate/{sessionId}
```

### 3. Завершить квест
```bash
curl -X POST http://localhost:3001/quests/{questId}/complete \
  -H "Content-Type: application/json" \
  -d '{
    "evidence": "evidence-id"
  }'
```

### 4. Активировать квест
```bash
curl -X POST http://localhost:3001/quests/{questId}/activate
```

## Структура проекта

```
apps/api/src/
└── quests/
    ├── quests.service.ts           ✅
    ├── quest-generation.service.ts ✅
    ├── quests.controller.ts        ✅
    └── quests.module.ts            ✅
```

## Интеграция

✅ **С Tree Service:** начисление XP на узлы при завершении квеста
✅ **С Sessions:** автоматическая генерация квестов после анализа
✅ **С Evidence:** связь evidence с квестами
✅ **Автоматическое связывание:** квесты автоматически связываются с узлами по ключевым словам

## Проверка

✅ **TypeScript:** компилируется без ошибок
✅ **Quests Service:** все методы реализованы
✅ **Quest Generation:** работает автоматически
✅ **Evidence Integration:** начисление XP работает

## Следующие шаги

**Фаза 5:** Telegram интеграция
- Telegram Service
- Telegram Bot
- Посты по расписанию

**Фаза 6:** Frontend
- Dashboard
- Quest Board
- Evidence Journal

---

**Фаза 4 завершена!** ✅

