# Система квестов - Полное описание

**Версия:** 1.0.0  
**Дата создания:** 2025-01-15  
**Статус:** Актуальная документация

---

## Оглавление

1. [Обзор системы](#обзор-системы)
2. [Архитектура](#архитектура)
3. [Типы квестов](#типы-квестов)
4. [Статусы квестов](#статусы-квестов)
5. [Структура данных](#структура-данных)
6. [Логика работы](#логика-работы)
7. [Генерация квестов](#генерация-квестов)
8. [Система наград](#система-наград)
9. [UI/UX компоненты](#uiux-компоненты)
10. [Дизайн-система](#дизайн-система)
11. [API endpoints](#api-endpoints)
12. [Интеграции](#интеграции)

---

## Обзор системы

Система квестов — это RPG-механика для развития лидерских способностей через практические задания. Квесты генерируются автоматически на основе анализа реальных ситуаций пользователя или создаются вручную.

### Основные принципы

- **Практико-ориентированность**: Квесты связаны с реальными ситуациями из жизни пользователя
- **Прогрессивное развитие**: От простых микро-квестов к сложным story-квестам
- **Автоматическая генерация**: Квесты создаются на основе анализа записей (entries) и сессий (sessions)
- **Связь со способностями**: Каждый квест развивает конкретные узлы дерева способностей
- **Ограничение нагрузки**: Максимум 5 активных квестов одновременно

---

## Архитектура

### Backend компоненты

```
apps/api/src/quests/
├── quests.service.ts          # Основной сервис управления квестами
├── quest-engine.service.ts    # Детерминированная логика генерации
├── quest-generation.service.ts # Генерация квестов из сессий
├── quests.controller.ts       # REST API endpoints
├── quests.module.ts           # NestJS модуль
├── quest.repository.ts        # Репозиторий для работы с БД
└── quest-engine.types.ts      # TypeScript типы
```

### Frontend компоненты

```
apps/web/src/
├── app/quests/
│   ├── page.tsx              # Список квестов
│   └── [id]/page.tsx         # Детальная страница квеста
├── components/
│   └── QuestTheory.tsx       # Компонент отображения теории
└── hooks/
    └── useQuests.ts          # React Query хуки
```

### База данных

**Модель Quest (Prisma):**

```prisma
model Quest {
  id            String   @id @default(uuid())
  userId        String
  title         String
  description   String   @db.Text
  type          String   // micro, weekly, story, in-person
  status        String   @default("backlog") // backlog, active, done, archived
  branch        String?
  steps_json    Json     @default("[]")
  criteria_json Json
  reward_json   Json?
  linked_nodes  String[] // Ability Node IDs
  evidence_links_json Json @default("[]")
  due_hint      String?
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  activated_at  DateTime?
  completed_at  DateTime?
  source        String?
  tags          String[]
  session_id    String?
}
```

---

## Типы квестов

### 1. Micro (Микро-квесты)

**Назначение:** Быстрые практические задания для развития конкретных способностей

**Характеристики:**
- **Критерий:** `evidence` (собрать доказательства)
- **Цель:** 3 доказательства применения способности
- **Базовая награда:** 100 XP, 50 skill_xp
- **Максимум квестов:** 10 из ability signals
- **Сложность:** basic
- **Источник:** Ability signals из анализа сессий

**Пример:**
```
Заголовок: "Развить: Контейнирование"
Описание: "Практиковать способность 'контейнирование' в реальных ситуациях."
Критерии: Собрать 3 доказательства применения
```

### 2. Weekly (Недельные квесты)

**Назначение:** Фокус на развитии области в течение недели

**Характеристики:**
- **Критерий:** `count` (выполнить действия)
- **Цель:** 5 действий, связанных с областью
- **Базовая награда:** 200 XP, 100 skill_xp
- **Максимум квестов:** 3 из focus points
- **Сложность:** intermediate
- **Источник:** High priority focus points из анализа

**Пример:**
```
Заголовок: "Фокус: Управление конфликтами"
Описание: "Сосредоточиться на развитии области 'управление конфликтами' в течение недели."
Критерии: Выполнить 5 действий, связанных с областью
```

### 3. Story (Сюжетные квесты)

**Назначение:** Глубокое исследование темы через рефлексию

**Характеристики:**
- **Критерий:** `custom` (создать записи-рефлексии)
- **Цель:** Создать 3 записи-рефлексии на тему
- **Базовая награда:** 300 XP
- **Максимум квестов:** 1 из главной темы
- **Сложность:** advanced
- **Источник:** Главная тема из анализа сессии

**Пример:**
```
Заголовок: "Исследовать тему: Эмоциональный интеллект"
Описание: "Глубже изучить тему 'эмоциональный интеллект' через рефлексию и практику."
Критерии: Создать 3 записи-рефлексии на тему
```

### 4. In-person (Живые квесты)

**Назначение:** Практические задания для очных взаимодействий

**Характеристики:**
- **Критерий:** `custom` (специфичные для типа)
- **Базовая награда:** 500 XP, 250 skill_xp
- **Сложность:** advanced
- **Источник:** Ручное создание или специальные триггеры

---

## Статусы квестов

### Backlog (Отложен)

**Описание:** Квест создан, но не активирован

**Переходы:**
- → `active` (через активацию пользователем или автоматически)

**UI индикатор:**
- Цвет: `system-warning` (желтый)
- Иконка: 🟡
- Текст: "Отложен"

### Active (Активный)

**Описание:** Квест в процессе выполнения

**Ограничения:**
- Максимум 5 активных квестов одновременно
- При превышении лимита старые квесты переводятся в `backlog`

**Переходы:**
- → `done` (при завершении)
- → `backlog` (при превышении лимита)
- → `archived` (вручную)

**UI индикатор:**
- Цвет: `system-growth` (зеленый)
- Иконка: 🟢
- Текст: "Активный"

### Done (Завершен)

**Описание:** Квест успешно выполнен

**Действия при завершении:**
1. Обновление статуса на `done`
2. Установка `completed_at`
3. Начисление опыта на связанные узлы через систему опыта
4. Применение модификаторов опыта (prerequisites, state, difficulty)

**UI индикатор:**
- Цвет: `ui-text-muted` (серый)
- Иконка: ⚪
- Текст: "Завершён"

### Archived (Архивирован)

**Описание:** Квест архивирован (не отображается в основных списках)

**UI индикатор:**
- Цвет: `ui-text-muted` (темно-серый)
- Иконка: ⚫
- Текст: "Архивирован"

---

## Структура данных

### Quest (Полная структура)

```typescript
interface Quest {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: 'micro' | 'weekly' | 'story' | 'in-person';
  status: 'active' | 'backlog' | 'done' | 'archived';
  steps: QuestStep[];
  criteria: QuestCriteria;
  reward?: QuestReward;
  linked_nodes: string[]; // Ability Node IDs
  evidence_links: any[];
  due_hint?: string;
  source?: string;
  tags: string[];
  session_id?: string;
  created_at: string;
  updated_at: string;
  activated_at?: string;
  completed_at?: string;
}
```

### QuestStep (Шаги выполнения)

```typescript
interface QuestStep {
  id: string;
  description: string;
  completed?: boolean;
  status?: 'pending' | 'in_progress' | 'completed';
  title?: string; // Опциональный заголовок шага
  text?: string; // Альтернативное поле для текста
}
```

**Хранение:** `steps_json` (JSON массив)

**Правила обработки:**
- Шаги должны содержать только конкретные действия
- Фильтруются дубликаты контента (описание, критерии, награда)
- Минимальная длина шага: 3 символа
- Поддерживаются как строки, так и объекты

### QuestCriteria (Критерии успеха)

```typescript
interface QuestCriteria {
  type: 'count' | 'evidence' | 'streak' | 'custom';
  target?: number; // Целевое количество (для count, evidence)
  description: string; // Текстовое описание критерия
  items?: string[]; // Список проверяемых условий
  theory_and_examples?: string; // Markdown текст с теорией и примерами
}
```

**Хранение:** `criteria_json` (JSON объект)

**Типы критериев:**

1. **count**: Выполнить N действий
2. **evidence**: Собрать N доказательств
3. **streak**: Поддерживать серию (не используется в текущей версии)
4. **custom**: Специфичные критерии (для story, in-person)

### QuestReward (Награда)

```typescript
interface QuestReward {
  xp?: number; // Общий опыт
  skill_xp?: number; // Опыт по способностям
  artifact?: string; // Артефакт (не используется в текущей версии)
  nodes?: Record<string, number>; // Опыт по конкретным узлам (legacy)
}
```

**Хранение:** `reward_json` (JSON объект или null)

**Расчет награды:**

Базовая награда зависит от типа квеста:
- `micro`: 100 XP, 50 skill_xp
- `weekly`: 200 XP, 100 skill_xp
- `story`: 300 XP
- `in-person`: 500 XP, 250 skill_xp

Модификаторы:
- **Уровень узла:** basic (1.0x), mid (1.2x), advanced (1.5x), master (2.0x)
- **Prerequisites:** Если не выполнены, награда уменьшается на 50%

---

## Логика работы

### Создание квеста

**Ручное создание:**

```typescript
POST /quests
{
  title: string;
  description: string;
  type: 'micro' | 'weekly' | 'story' | 'in-person';
  criteria: QuestCriteria;
  reward?: QuestReward;
  linked_nodes?: string[];
  tags?: string[];
}
```

**Автоматическая генерация:**

1. Анализ сессии завершается (`Session.status = 'succeeded'`)
2. `QuestOrchestrationService.handleSessionAnalyzed()` вызывается
3. `QuestGenerationService.getSessionAnalysisResult()` извлекает данные
4. `QuestEngine.generateQuests()` создает структуру квестов
5. `QuestGenerationService.generateQuests()` добавляет теорию через LLM
6. `QuestRepository.createMany()` сохраняет квесты в БД со статусом `backlog`

### Активация квеста

**Процесс:**

1. Проверка лимита активных квестов (максимум 5)
2. Если лимит превышен, старые квесты переводятся в `backlog`
3. Обновление статуса на `active`
4. Установка `activated_at`

**API:**

```typescript
POST /quests/:id/activate
```

**Ограничения:**
- Нельзя активировать, если уже 5 активных квестов
- Исключение: если квест уже активен

### Завершение квеста

**Процесс:**

1. Проверка выполнения критериев (опционально, на клиенте)
2. Обновление статуса на `done`
3. Установка `completed_at`
4. Начисление опыта через `AbilityStateService.applyQuestExperience()`

**Начисление опыта:**

```typescript
// Определение сложности квеста
const questDifficultyMap = {
  micro: 'basic',
  weekly: 'intermediate',
  story: 'advanced',
  'in-person': 'advanced',
};

// Для каждого связанного узла
await abilityStateService.applyQuestExperience(
  userId,
  nodeId,
  skillXpPerNode,
  questDifficulty
);
```

**API:**

```typescript
POST /quests/:id/complete
Body: { evidence?: string }
```

### Управление лимитом активных квестов

**Автоматическое управление:**

1. При генерации новых квестов проверяется количество активных
2. Если активных > 5, старые квесты (по `created_at`) переводятся в `backlog`
3. Логика в `QuestOrchestrationService.manageActiveQuestLimit()`

**Ручное управление:**

```typescript
POST /quests/manage-limit
```

---

## Генерация квестов

### QuestEngine (Детерминированная логика)

**Принципы:**
- Одинаковые входные данные = одинаковый результат
- Не зависит от времени выполнения
- Не делает запросов к БД или LLM (чистая функция)
- Определяет структуру квестов, критерии, награды

**Правила генерации:**

```typescript
const questRules = {
  ability_micro: {
    type: 'micro',
    criteriaType: 'evidence',
    target: 3,
    xp: 100,
    skillXp: 50,
    maxQuests: 10,
  },
  focus_weekly: {
    type: 'weekly',
    criteriaType: 'count',
    target: 5,
    xp: 200,
    skillXp: 100,
    maxQuests: 3,
  },
  theme_story: {
    type: 'story',
    criteriaType: 'custom',
    xp: 300,
    maxQuests: 1,
  },
};
```

**Входные данные:**

```typescript
interface QuestGenerationInput {
  userId: string;
  sessionId?: string;
  abilitySignals: AbilitySignal[]; // { node_id, signal }
  themes: string[];
  patterns: string[];
  focus: FocusPoint[]; // { area, priority }
  nodeInfos?: Map<string, NodeInfo>;
}
```

**Процесс генерации:**

1. **Из ability signals** → Micro квесты (до 10)
2. **Из focus (high priority)** → Weekly квесты (до 3)
3. **Из главной темы** → Story квест (1)

### QuestGenerationService (Генерация с LLM)

**Дополнительные функции:**

1. Загрузка информации об узлах из дерева способностей
2. Генерация теории через `LLMService.generateQuestTheory()`
3. Добавление теории в `criteria.theory_and_examples`

**Теория квеста:**

- Markdown формат
- Содержит: объяснение концепции, примеры, практические советы
- НЕ содержит: шаги выполнения, критерии успеха
- Генерируется через LLM на основе описания узла способности

### Автоматическое связывание с узлами

**Логика в `QuestsService.autoLinkNodes()`:**

```typescript
const keywords: Record<string, string[]> = {
  node_containment: ['контейнирование', 'удержание', 'напряжение'],
  node_grounding: ['заземление', 'реальность', 'факты'],
  node_system_thinking: ['система', 'системное мышление', 'целое'],
  // ... и т.д.
};
```

**Процесс:**
1. Анализ текста квеста (title + description)
2. Поиск ключевых слов
3. Связывание с соответствующими узлами

---

## Система наград

### Базовая награда по типам

| Тип | XP | Skill XP |
|-----|----|----------|
| micro | 100 | 50 |
| weekly | 200 | 100 |
| story | 300 | - |
| in-person | 500 | 250 |

### Модификаторы награды

**1. Уровень узла (levelMultiplier):**

```typescript
const levelMultiplier = {
  basic: 1.0,
  mid: 1.2,
  advanced: 1.5,
  master: 2.0,
};
```

**2. Предварительные условия (prerequisiteMultiplier):**

- Если prerequisites не выполнены: `multiplier *= 0.5`
- Если выполнены: `multiplier *= 1.0`

**3. Соответствие сложности (difficultyMatchMultiplier):**

- Квест `basic` + узел `basic`: 1.0x
- Квест `intermediate` + узел `mid`: 1.0x
- Квест `advanced` + узел `advanced`: 1.0x
- Несоответствие: 0.5x

### Применение опыта

**Через систему опыта (AbilityStateService):**

```typescript
await abilityStateService.applyQuestExperience(
  userId,
  nodeId,
  skillXpPerNode,
  questDifficulty
);
```

**Внутренняя логика:**

1. Расчет базового опыта: `skillXpPerNode`
2. Применение модификаторов:
   - `prerequisiteMultiplier` (0.1x - 1.0x)
   - `stateMultiplier` (0x для locked, 0.5x для available, 1.0x для active/unlocked/integrated)
   - `levelMultiplier` (1.0x - 2.0x)
   - `difficultyMatchMultiplier` (0.5x - 1.0x)
   - `progressDecelerationMultiplier` (уменьшение при высоком прогрессе)
3. Обновление `internal_progress` и `progress`
4. Обновление `last_activity_date`
5. Проверка и выдача достижений

---

## UI/UX компоненты

### Страница списка квестов (`/quests`)

**Компонент:** `apps/web/src/app/quests/page.tsx`

**Функциональность:**

1. **Фильтры:**
   - По статусу: Все / Активные / Отложенные / Завершенные
   - По типу: Все / Micro / Weekly / Story / In-person

2. **Отображение квестов:**
   - Сетка карточек (1 колонка на мобильных, 2 на планшетах, 3 на десктопах)
   - Каждая карточка содержит:
     - Заголовок
     - Тип и статус (бейджи)
     - Описание (обрезанное до 2 строк)
     - Прогресс выполнения шагов (для активных)
     - Связанные способности (первые 3)
     - Награда
     - Действия (Активировать / Завершить / Подробнее)

3. **Состояния:**
   - Загрузка
   - Ошибка
   - Пустой список

**Стили карточки:**

```tsx
className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 border-l-4 border-system-focus bg-panel-gradient"
```

### Страница детального просмотра (`/quests/[id]`)

**Компонент:** `apps/web/src/app/quests/[id]/page.tsx`

**Структура отображения (согласно QUEST_CONTENT_STRUCTURE.md):**

1. **Заголовок и метаданные:**
   - Название квеста
   - Статус (бейдж)
   - Тип (бейдж)
   - Награда (XP)
   - Кнопка активации (если backlog)

2. **Описание:**
   - Краткое описание цели (1-3 предложения)
   - БЕЗ информации о шагах, критериях, теории

3. **Теория и примеры:**
   - Компонент `QuestTheory`
   - Кнопка показать/скрыть
   - Markdown форматирование
   - Теоретическое объяснение концепции

4. **Шаги выполнения:**
   - Список конкретных действий
   - Индикаторы выполнения (чекбоксы)
   - Статусы: pending / in_progress / completed

5. **Критерии успеха:**
   - Список проверяемых условий
   - Иконки чекбоксов

6. **Награда:**
   - XP
   - Skill XP по способностям

7. **Связанные способности:**
   - Список узлов с переводами названий

8. **Почему появился этот квест:**
   - Связь с сессией (если есть)
   - Источник создания

9. **Доказательства:**
   - Список прикрепленных доказательств
   - Кнопка добавления нового

10. **Действия:**
    - Завершить квест (для активных)

### Компонент QuestTheory

**Компонент:** `apps/web/src/components/QuestTheory.tsx`

**Функциональность:**

1. Парсинг Markdown:
   - Заголовки (#, ##, ###)
   - Списки (маркированные и нумерованные)
   - Жирный текст (**text**)
   - Курсив (*text*)
   - Параграфы

2. Фильтрация дубликатов:
   - Удаление частей, повторяющих шаги
   - Удаление частей, повторяющих критерии

3. Fallback:
   - Если теории нет, показывается объяснение важности теории

**Пример использования:**

```tsx
<QuestTheory 
  theory={quest.criteria?.theory_and_examples}
  steps={quest.steps}
/>
```

### Компонент QuestCard (в Experiments)

**Компонент:** `apps/web/src/app/experiments/page.tsx` (внутренний компонент)

**Дополнительные функции:**

1. Отображение гипотезы квеста
2. Индикатор сложности (кружочки по уровню узлов)
3. Фильтрация по типу и лейблам
4. Сортировка по сложности

---

## Дизайн-система

### Цветовая палитра

**Основные цвета (Architectural Dark):**

```css
/* Фон */
--bg-main: #0E1116
--bg-panel: #151920
--bg-secondary: #1A1F28
--bg-canvas: #0B0F14
--bg-hover: #1F252E

/* Текст */
--ui-text-main: #E6E9EF
--ui-text-muted: #8B95A6

/* Границы */
--ui-border-soft: rgba(255, 255, 255, 0.1)
--ui-border-strong: rgba(255, 255, 255, 0.2)

/* Системные цвета */
--system-focus: #3A6F8F (синий - фокус, акцент)
--system-growth: #8BC48B (зеленый - рост, успех)
--system-warning: #F5A623 (желтый - предупреждение)
--system-critical: #E74C3C (красный - ошибка)
--system-stable: #6C7A89 (серый - стабильность)
```

**Применение к статусам квестов:**

- `active`: `system-growth` (зеленый)
- `backlog`: `system-warning` (желтый)
- `done`: `ui-text-muted` (серый)
- `archived`: `ui-text-muted` (темно-серый)

**Применение к типам квестов:**

- Все типы: `system-focus` (синий)

### Типографика

**Шрифты:**

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
             'Droid Sans', 'Helvetica Neue', sans-serif;
```

**Размеры:**

- Заголовки: `text-3xl` (h1), `text-2xl` (h2), `text-xl` (h3)
- Основной текст: `text-base` (16px)
- Вторичный текст: `text-sm` (14px)
- Мелкий текст: `text-xs` (12px)

**Настройки:**

- `font-weight`: 600 для заголовков, 400 для текста, 500 для среднего
- `letter-spacing`: -0.02em для заголовков
- `line-height`: 1.2 для заголовков, 1.5-1.75 для текста

### Компоненты интерфейса

**Кнопки:**

```tsx
// Основная кнопка
className="px-4 py-2 bg-system-focus text-ui-text-main rounded hover:bg-system-focus/80 transition-colors"

// Вторичная кнопка
className="px-4 py-2 bg-bg-secondary border border-ui-border-soft text-ui-text-main rounded hover:bg-bg-hover transition-colors"

// Кнопка успеха
className="px-4 py-2 bg-system-growth text-ui-text-main rounded hover:bg-system-growth/80 transition-colors"
```

**Бейджи:**

```tsx
// Статус активный
className="px-2 py-1 bg-bg-panel border border-system-growth/30 text-system-growth rounded text-xs"

// Статус отложен
className="px-2 py-1 bg-bg-panel border border-system-warning/30 text-system-warning rounded text-xs"

// Тип квеста
className="px-2 py-1 bg-bg-secondary border border-system-focus text-system-focus rounded text-xs"
```

**Карточки:**

```tsx
className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 border-l-4 border-system-focus bg-panel-gradient"
```

**Прогресс-бар:**

```tsx
<div className="w-full bg-bg-canvas rounded-full h-2 border border-ui-border-soft">
  <div 
    className="bg-system-growth h-2 rounded-full transition-all"
    style={{ width: `${progressPercent}%` }}
  />
</div>
```

### Иконки и эмодзи

**Статусы:**

- `active`: 🟢 (зеленый круг)
- `done`: ⚪ (белый круг)
- `backlog`: 🟡 (желтый круг)
- `archived`: ⚫ (черный круг)

**Типы:**

- Отображаются текстом: "Micro", "Weekly", "Story", "In-person"

### Анимации и переходы

```css
/* Базовые переходы */
transition-property: color, background-color, border-color, opacity, box-shadow, transform;
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
transition-duration: 150ms;
```

**Специальные анимации:**

- Пульсация для in-progress шагов: `animate-pulse`
- Плавное изменение ширины прогресс-бара: `transition-all`

### Адаптивность

**Breakpoints (Tailwind):**

- `md:` 768px (планшеты)
- `lg:` 1024px (десктопы)

**Сетка квестов:**

- Мобильные: 1 колонка
- Планшеты: 2 колонки (`md:grid-cols-2`)
- Десктопы: 3 колонки (`lg:grid-cols-3`)

---

## API endpoints

### Получение квестов

```typescript
GET /quests?status=active
Authorization: Bearer <token>

Response: {
  quests: Quest[],
  count: number,
  status: string
}
```

### Получение квеста по ID

```typescript
GET /quests/:id

Response: Quest
```

### Создание квеста

```typescript
POST /quests
Authorization: Bearer <token>
Content-Type: application/json

Body: {
  title: string,
  description: string,
  type: 'micro' | 'weekly' | 'story' | 'in-person',
  criteria: QuestCriteria,
  reward?: QuestReward,
  linked_nodes?: string[],
  tags?: string[]
}

Response: Quest
```

### Обновление квеста

```typescript
PATCH /quests/:id
Content-Type: application/json

Body: Partial<CreateQuestDto>

Response: Quest
```

### Активация квеста

```typescript
POST /quests/:id/activate
Authorization: Bearer <token>

Response: Quest

Errors:
- 400: Maximum 5 active quests allowed
- 404: Quest not found
```

### Завершение квеста

```typescript
POST /quests/:id/complete
Authorization: Bearer <token>
Content-Type: application/json

Body: {
  evidence?: string
}

Response: Quest

Actions:
- Обновление статуса на 'done'
- Установка completed_at
- Начисление опыта на linked_nodes
```

### Обновление статуса

```typescript
PATCH /quests/:id/status
Content-Type: application/json

Body: {
  status: 'active' | 'backlog' | 'done' | 'archived'
}

Response: Quest
```

### Генерация квестов из сессии

```typescript
POST /quests/generate/:sessionId

Response: {
  generated: number,
  message: string
}
```

### Обновление теории квеста

```typescript
POST /quests/:id/theory
Content-Type: application/json

Body: {
  theory: string
}

Response: Quest
```

### Массовое обновление теорий

```typescript
POST /quests/update-theories-from-mapping
Content-Type: application/json

Body: {
  mapping: Array<{
    title?: string,
    linkedNodes?: string[],
    theory: string
  }>
}

Response: {
  updated: number,
  notFound: string[]
}
```

### Синхронизация из шаблонов

```typescript
POST /quests/sync-from-templates
Content-Type: application/json

Body: {
  templates: Array<{
    id: string,
    description?: string,
    steps?: Array<any>,
    criteria?: any
  }>
}

Response: {
  updated: number,
  notFound: string[],
  errors: Array<{ id: string, error: string }>
}
```

---

## Интеграции

### С системой способностей (Ability System)

**Связь через `linked_nodes`:**

- Каждый квест связан с одним или несколькими узлами дерева способностей
- При завершении квеста опыт начисляется на связанные узлы
- Используется система опыта с модификаторами

**API интеграция:**

```typescript
// В QuestsService.complete()
await abilityStateService.applyQuestExperience(
  userId,
  nodeId,
  skillXpPerNode,
  questDifficulty
);
```

### С системой сессий (Session System)

**Генерация квестов:**

- Квесты генерируются автоматически при завершении анализа сессии
- `QuestOrchestrationService.handleSessionAnalyzed()` вызывается из sync service
- Квесты сохраняются со ссылкой на сессию (`session_id`)

**Отображение связи:**

- На странице квеста показывается ссылка на связанную сессию
- На странице сессии можно увидеть сгенерированные квесты

### С системой доказательств (Evidence System)

**Прикрепление доказательств:**

- Доказательства могут быть привязаны к квесту через `quest_id`
- На странице квеста отображается список доказательств
- Можно создать новое доказательство прямо из квеста

**API:**

```typescript
GET /evidence?quest_id=<quest_id>
POST /evidence
Body: {
  quest_id: string,
  text: string,
  type: string,
  ...
}
```

### С системой записей (Entry System)

**Косвенная связь:**

- Записи → Сессии → Квесты
- Квесты могут требовать создания новых записей (story квесты)

---

## Лейблы и терминология

### Русские лейблы

**Статусы:**
- `active` → "Активный"
- `backlog` → "Отложен"
- `done` → "Завершён"
- `archived` → "Архивирован"

**Типы:**
- `micro` → "Micro"
- `weekly` → "Weekly"
- `story` → "Story"
- `in-person` → "In-person"

**UI элементы:**
- "Квесты" (заголовок страницы)
- "Нет квестов" (пустое состояние)
- "Загрузка..." (состояние загрузки)
- "Активировать" (кнопка)
- "Завершить" (кнопка)
- "Подробнее →" (ссылка)
- "Прогресс:" (метка прогресс-бара)
- "Связанные способности:" (заголовок секции)
- "Награда:" (заголовок секции)
- "Доказательства" (заголовок секции)
- "Добавить доказательство" (кнопка)
- "Теория" (заголовок секции)
- "Показать" / "Скрыть" (кнопка теории)
- "Шаги выполнения" (заголовок секции)
- "Критерии успеха" (заголовок секции)
- "Почему появился этот квест" (заголовок секции)

**Источники:**
- `session_analysis` → "Анализ ситуации"
- `base_template` → "Базовый шаблон"
- `manual` → "Создан вручную"
- `auto-generated` → "Автоматически сгенерирован"

### Английские термины (в коде)

- `quest` - квест
- `step` - шаг
- `criteria` - критерии
- `reward` - награда
- `evidence` - доказательство
- `ability` - способность
- `node` - узел
- `session` - сессия
- `entry` - запись

---

## Ограничения и правила

### Лимиты

1. **Активные квесты:** Максимум 5 одновременно
2. **Генерация micro:** Максимум 10 из ability signals
3. **Генерация weekly:** Максимум 3 из focus points
4. **Генерация story:** Максимум 1 из главной темы

### Валидация

**При создании:**

- `title`: обязательное, минимум 1 символ
- `description`: обязательное, минимум 1 символ
- `type`: должен быть одним из: 'micro', 'weekly', 'story', 'in-person'
- `criteria`: обязательное, должно соответствовать схеме

**При активации:**

- Проверка лимита активных квестов
- Если лимит превышен, выбрасывается ошибка 400

### Правила обработки данных

**Шаги:**

- Фильтруются пустые шаги (< 3 символов)
- Удаляются дубликаты контента (описание, критерии, награда)
- Поддерживаются строки и объекты

**Критерии:**

- `items` фильтруются (минимум 3 символа)
- `theory_and_examples` может быть очень длинным (до 50000 символов)

**Теория:**

- Markdown формат
- Парсится на клиенте
- Фильтруются дубликаты шагов и критериев

---

## Будущие улучшения

### Планируемые функции

1. **Система артефактов:**
   - Награды-артефакты за выполнение квестов
   - Коллекция артефактов пользователя

2. **Streak квесты:**
   - Поддержка критерия `streak`
   - Отслеживание серий выполнения

3. **Уведомления:**
   - Напоминания о квестах
   - Уведомления о новых квестах

4. **Социальные функции:**
   - Публикация выполненных квестов
   - Сравнение прогресса

5. **Расширенная аналитика:**
   - Статистика выполнения квестов
   - Влияние квестов на развитие способностей

---

## Заключение

Система квестов представляет собой комплексную RPG-механику для развития лидерских способностей. Она интегрирована с анализом реальных ситуаций пользователя, автоматически генерирует персонализированные задания и начисляет опыт через продвинутую систему модификаторов.

**Ключевые особенности:**

- Автоматическая генерация на основе анализа
- Связь с реальными ситуациями
- Прогрессивная система развития
- Гибкая система наград с модификаторами
- Современный UI с темной темой
- Полная интеграция с системой способностей

---

**Последнее обновление:** 2025-01-15  
**Версия документа:** 1.0.0
