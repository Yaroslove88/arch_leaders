# Сводка интеграции контента в игру

## ✅ Выполненные изменения

### 1. Backend API

#### Новые модули:

**CasesModule** (`apps/api/src/cases/`)
- `CasesController` - API endpoints для интерактивных кейсов
- `CasesService` - Загрузка и обработка кейсов из JSON

**Endpoints:**
- `GET /cases` - Получить все кейсы
- `GET /cases/:id` - Получить кейс по ID
- `GET /cases/by-node/:nodeId` - Получить кейсы для узла
- `GET /cases/by-branch/:branchId` - Получить кейсы для ветки

**NodesModule** (`apps/api/src/nodes/`)
- `NodesController` - API endpoints для описаний узлов
- `NodesService` - Загрузка описаний узлов из JSON

**Endpoints:**
- `GET /nodes/descriptions` - Получить все описания
- `GET /nodes/descriptions/:nodeId` - Получить описание узла

#### Обновления:

- `app.module.ts` - Добавлены CasesModule и NodesModule

### 2. Frontend Web

#### Новые страницы:

**`/cases`** - Список интерактивных кейсов
- Фильтрация по веткам
- Отображение индикаторов и сложности
- Ссылки на детальные страницы кейсов

**`/cases/[id]`** - Детальная страница кейса
- Отображение контекста и индикаторов
- Интерактивный выбор вариантов действий
- Показ последствий (immediate, second-order, systemic)
- Влияние на SM домены
- Вопросы для рефлексии

#### Обновленные страницы:

**`/tree`** - Дерево способностей
- Клик по узлу открывает модальное окно с описанием
- Показ полного описания, практического значения, примеров
- Уровни интеграции (Novice/Integrated/Embodied)

**`/layout`** - Навигация
- Добавлена ссылка "Кейсы" в главное меню

#### Обновления API клиента:

**`lib/api.ts`**
- Добавлены типы `InteractiveCase` и `NodeDescription`
- Функции для работы с кейсами:
  - `getCases()`
  - `getCase(id)`
  - `getCasesByNode(nodeId)`
  - `getCasesByBranch(branchId)`
- Функции для работы с описаниями:
  - `getNodeDescriptions()`
  - `getNodeDescription(nodeId)`

### 3. Данные

#### Файлы данных:

- `data/interactive-cases.json` - 6 интерактивных кейсов
- `data/node-descriptions.json` - Описания всех 40 узлов
- `packages/shared/src/seed/initial-ability-tree.json` - Расширенное дерево (40 узлов)

## 🎯 Как использовать

### Для пользователя:

1. **Просмотр дерева способностей:**
   - Перейти на `/tree`
   - Кликнуть на узел для просмотра детального описания
   - Увидеть уровни интеграции и примеры применения

2. **Прохождение кейсов:**
   - Перейти на `/cases`
   - Выбрать кейс по интересующей ветке
   - Пройти кейс, выбирая варианты действий
   - Изучить последствия выбора и вопросы для рефлексии

### Для разработчика:

1. **Добавление новых кейсов:**
   - Добавить кейс в `data/interactive-cases.json`
   - Формат соответствует структуре `InteractiveCase`

2. **Добавление описаний узлов:**
   - Добавить описание в `data/node-descriptions.json`
   - Ключ должен соответствовать `node_id` из дерева

3. **Обновление дерева:**
   - Обновить `packages/shared/src/seed/initial-ability-tree.json`
   - Система автоматически загрузит новое дерево

## 📝 Структура данных

### InteractiveCase:
```typescript
{
  id: string;
  title: string;
  node_id?: string;
  branch_id?: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  context: string;
  indicators?: Record<string, string>;
  pattern?: { trigger, behavior, result };
  options: Array<{
    id: string;
    text: string;
    skill_used?: string;
    consequence: { immediate, second_order, systemic };
    sm_impact?: Record<string, number>;
    hint?: string;
    warning?: string;
    explanation?: string;
  }>;
  reflection: {
    questions: string[];
    mirror?: Record<string, string>;
    key_insight?: string;
  };
}
```

### NodeDescription:
```typescript
{
  name: string;
  full_description: string;
  practical_meaning: string;
  examples: string[];
  integration_levels: {
    Novice: string;
    Integrated: string;
    Embodied: string;
  };
  related_quests?: string[];
}
```

## 🚀 Следующие шаги

1. Добавить больше интерактивных кейсов (10-15 кейсов)
2. Связать кейсы с квестами
3. Добавить систему оценки выбора в кейсах
4. Создать рекомендации кейсов на основе прогресса пользователя
5. Добавить визуализацию дерева способностей (canvas/graph)

