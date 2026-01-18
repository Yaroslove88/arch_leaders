# Системная спецификация: Учебные кейсы

**Версия:** 1.2  
**Дата последнего обновления:** 13.01.2026  
**Статус:** Актуальная

> **Обновление v1.2:** Добавлена структура данных V2 (CaseCardData) и адаптер для нового компонента CaseDetailCardV2.

> **Обновление v1.1:** Добавлено требование выполнения квеста для доступа к кейсам. См. раздел [Связь с квестами](#связь-с-квестами).

---

## Оглавление

1. [Введение](#введение)
2. [Философия системы](#философия-системы)
3. [Структура данных](#структура-данных)
4. [Логика доступности кейсов](#логика-доступности-кейсов)
5. [Логика ранжирования кейсов](#логика-ранжирования-кейсов)
6. [Система прогресса](#система-прогресса)
7. [UX/UI Компоненты](#uxui-компоненты)
8. [Визуальное оформление](#визуальное-оформление)
9. [API Endpoints](#api-endpoints)
10. [Переводы и локализация](#переводы-и-локализация)
11. [Архитектура файлов](#архитектура-файлов)
12. [Связанные документы](#связанные-документы)

---

## Введение

### Назначение документа

Этот документ полностью описывает систему учебных кейсов (Interactive Cases) в приложении Leadership Architect. Документ включает:

- Полную структуру данных кейсов
- Логику определения доступности кейсов
- Алгоритмы ранжирования и сортировки
- Визуальное оформление всех состояний
- UX/UI компоненты и их поведение
- API endpoints и интеграции
- Систему прогресса и отслеживания

### Область применения

Документ описывает текущее состояние системы кейсов по состоянию на 08.01.2026 и служит единственным источником истины для:

- Разработчиков (frontend и backend)
- UX/UI дизайнеров
- Продуктовых менеджеров
- Тестировщиков

---

## Философия системы

### Роль кейсов в системе развития

**Кейсы — это подспорье для практики, а не основной способ развития.**

**На старте:** Все узлы заблокированы → все кейсы недоступны. Пользователь начинает с **квестов** и **практики в реальности**. Это важнее кейсов — дает опыт практики на простых задачах.

**Затем:** По мере разблокировки узлов открываются кейсы как подспорье. Чем сложнее и дальше, тем меньше пользователей смогут решить квесты в реальности (например, нет команды), поэтому кейсы — хорошее подспорье.

**Важно:** Кейсы тоже могут давать опыт (XP), чтобы стимулировать практику.

### Принципы системы

1. **Прогрессивное открытие** — кейсы открываются постепенно по мере развития пользователя
2. **Квесты как ключ** — для доступа к кейсам сначала нужно выполнить хотя бы один квест на узле
3. **Постепенное усложнение** — сначала basic, затем intermediate, затем advanced
4. **Привязка к узлам** — каждый кейс привязан к конкретному узлу способности
5. **Отслеживание прогресса** — система отслеживает решенные кейсы и прогресс по узлам

---

## Связь с квестами

### Квесты как ключ к кейсам

**Ключевое правило (v1.1):** Для доступа к **любым** кейсам на узле требуется **хотя бы 1 завершенный квест** на этом узле.

**Почему это важно:**
- Квесты дают практику в реальности, кейсы — закрепление теории
- Пользователь сначала пробует применять навык в жизни (через квест)
- Затем может углубить понимание через решение кейсов
- Это создает последовательный путь развития: Квест → Кейс

### Таблица доступности (обновленная)

| Условие | basic | intermediate | advanced |
|---------|-------|--------------|----------|
| Квестов на узле = 0 | ❌ Недоступен | ❌ Недоступен | ❌ Недоступен |
| Квестов >= 1, прогресс < 30% | ✅ Доступен | ❌ Недоступен | ❌ Недоступен |
| Квестов >= 1, прогресс >= 30% | ✅ Доступен | ✅ Доступен | ❌ Недоступен |
| Квестов >= 1, прогресс >= 60% | ✅ Доступен | ✅ Доступен | ✅ Доступен |

### Модальное окно при отсутствии квестов

Когда пользователь нажимает на кейс, но на узле нет завершенных квестов:

```
┌─────────────────────────────────────────┐
│ 🔒 Кейс недоступен                      │
│                                         │
│ Для доступа к кейсам сначала выполните  │
│ хотя бы один квест на узле «Имя узла».  │
│ Квесты дают практику в реальности,      │
│ а кейсы — закрепление.                  │
│                                         │
│ [📋 Перейти к квестам]  [Закрыть]       │
└─────────────────────────────────────────┘
```

### API для проверки квестов

**Endpoint:** `GET /quests/completed-by-node/:nodeId`

**Response:**
```typescript
{
  quests: Quest[],  // Завершенные квесты на узле
  count: number     // Количество завершенных квестов
}
```

**Использование в логике доступности:**
```typescript
const completedQuestsOnNode = quests.filter(
  q => q.status === 'done' && q.linked_nodes?.includes(case_.node_id)
).length;

if (completedQuestsOnNode === 0) {
  return false; // Нет завершенных квестов - кейс недоступен
}
```

---

## Структура данных

### Основная структура кейса

```typescript
interface InteractiveCase {
  // Идентификация
  id: string;                    // Уникальный ID кейса (например, "case_let_it_break_1")
  title: string;                 // Название кейса (например, "Мелкая ошибка")
  
  // Привязка к узлам
  node_id?: string;              // ID узла способности (обязательно для всех кейсов)
  branch_id?: string;            // ID ветки способностей (опционально)
  
  // Сложность
  difficulty: 'basic' | 'intermediate' | 'advanced';
  
  // Контент
  context: string;               // Полное описание ситуации с секциями
  indicators?: {                 // Индикаторы ситуации (опционально)
    trust?: 'low' | 'medium' | 'high';
    risk?: 'low' | 'medium' | 'high';
    time?: 'low' | 'medium' | 'critical';
    chaos?: 'low' | 'medium' | 'high';
    autonomy?: 'low' | 'medium' | 'high';
    speed?: 'low' | 'medium' | 'high';
    quality?: 'low' | 'medium' | 'high';
    uncertainty?: 'low' | 'medium' | 'high';
    stakes?: 'low' | 'medium' | 'high';
  };
  pattern?: {                    // Паттерн ситуации (опционально)
    trigger: string;
    behavior: string;
    result: string;
  };
  
  // Варианты действий
  options: Array<{
    id: string;                  // Буква варианта (A, B, C, D)
    text: string;                // Текст варианта (без технической информации)
    skill_used?: string;         // Используемый навык (название узла)
    consequence: {
      immediate: string;         // Немедленный эффект
      second_order: string;      // Вторичный эффект
      systemic: string;          // Системный эффект
    };
    sm_impact?: {                // Влияние на зрелость (опционально)
      C?: number;                // Связность (Connection)
      K?: number;                // Качество (Quality)
      R?: number;                // Ответственность (Responsibility)
      S?: number;                // Системность (Systemness)
      F?: number;                // Свобода (Freedom)
    };
    hint?: string;               // Подсказка (опционально)
    warning?: string;            // Предупреждение (опционально)
    explanation?: string;        // Объяснение (опционально)
  }>;
  
  // Рефлексия
  reflection: {
    questions: string[];         // Вопросы для рефлексии
    mirror?: Record<string, string>;  // Зеркало для каждого варианта (опционально)
    key_insight?: string;        // Ключевой инсайт (опционально)
  };
}
```

### Структура прогресса кейсов

```typescript
interface CaseProgress {
  solvedCases: string[];         // Массив ID решенных кейсов
  nodeProgress: Record<string, {  // Прогресс по узлам
    solved: string[];            // Массив ID решенных кейсов этого узла
    progress: number;            // Процент прогресса (0-100)
  }>;
}
```

### Источник данных

- **Файл:** `data/interactive-cases.json`
- **Структура:** JSON объект с массивом `interactive_cases`
- **Всего кейсов:** 59 (все имеют `node_id`)
- **Кейсов без node_id:** 0

### Структура данных V2 (новая, 13.01.2026)

> **Компонент:** `CaseDetailCardV2.tsx`  
> **Типы:** `CaseCardTypes.ts`  
> **Адаптер:** `case-adapter.ts`

```typescript
interface CaseCardData {
  meta: {
    case_id: string;
    node_id: string;
    branch_id: string;
    access_level: 'basic' | 'intermediate' | 'advanced' | 'executive';
    symbols?: string[];              // ["Architect", "Strategist"]
    strategic_tags?: string[];       // ["Systemic", "HR"]
    pressure_level?: 'low' | 'medium' | 'high' | 'critical';
    uncertainty?: 'low' | 'medium' | 'high';
    subjectivity_load?: 'low' | 'medium' | 'high';
    systemic_regress_risk?: 'low' | 'medium' | 'high' | 'critical';
  };
  portal: {
    header_title: string;            // "КЕЙС"
    case_name: string;               // Заголовок
    subtitle: string;                // Подзаголовок
  };
  event: {
    label: string;                   // "СВЯЗЬ", "Триггер", "Событие"
    summary: string;                 // Суть ситуации
  };
  context: {
    space_map: {
      company: string;               // IT-компания, 2 продуктовые команды
      environment: string;           // Быстрый рост, расширение
      constraints: string;           // Не чётко описаны зоны ответственности
      people: string;                // Тимлиды двух команд
      mode: string;                  // Проблемная коммуникация
    };
  };
  facts?: { strict_facts: string | string[] };
  background?: { story: string };
  dilemma: {
    question: string;                // Главный вопрос
    ambiance?: string;               // Атмосфера (курсив)
  };
  positions: Array<{
    id: string;                      // "А", "Б", "В"
    description: string;             // Текст позиции
    position_type: string;           // "Прямое взаимодействие"
    consequence: {
      immediate: string;             // СЕЙЧАС
      second_order: string;          // ПОТОМ
      systemic: string;              // СИСТЕМНО
    };
    reflection_prompt: string;       // Вопрос для рефлексии после выбора
  }>;
  reflection?: {
    questions?: string[];
    after_choice_insights?: string[];
  };
}
```

#### Адаптер InteractiveCase → CaseCardData

Файл `apps/web/src/lib/case-adapter.ts` автоматически преобразует:
- **Новый формат** (portal, event, space_map) → используется напрямую
- **Старый формат** (context string) → парсится в V2 структуру через `parseContextString()`

---

## Логика доступности кейсов

### Основные правила доступности

**Критическое правило:** Кейс доступен только если узел разблокирован или доступен.

### Статусы узлов и их значения

1. **Заблокирован (`locked`)** — Начальное состояние. Узел становится доступным при выполнении условий разблокировки (базовый прогресс или зависимости от других узлов).
2. **Доступен (`available`)** — Узел разблокирован и доступен для развития. Прогресс может быть 0%. Становится активным при прогрессе ≥30% и актуальности ≥30%.
3. **Активен (`active`)** — Вы работаете над способностью. Узел активен при прогрессе ≥30%. Становится разблокированным при прогрессе ≥70%.
4. **Разблокирован (`unlocked`)** — Способность развита на хорошем уровне (прогресс ≥70%). Становится интегрированной при прогрессе ≥100%.
5. **Интегрирован (`integrated`)** — Способность полностью интегрирована (прогресс ≥100%).

### Детальные правила доступности

#### Базовые проверки

1. **Проверка наличия node_id**
   - Если `node_id` отсутствует → кейс недоступен
   - Логируется ошибка для администратора

2. **Проверка наличия узла в дереве**
   - Если узел не найден в дереве → кейс недоступен
   - Выводится предупреждение в консоль

3. **Проверка состояния узла**
   - Если узел `locked` → все кейсы недоступны ❌
   - Это гарантирует, что на старте все кейсы недоступны

#### Уровень узла 1

**Определение уровня:** Узел уровня 1 — это узел с наименьшим `xp_required` в своей ветке (первые 50% узлов ветки).

| Состояние узла | Сложность кейса | Условие доступности |
|---------------|----------------|---------------------|
| `available` | `basic` | ✅ Доступен сразу (узел стал доступен) |
| `active`/`unlocked`/`integrated` | `basic` | ✅ Доступен сразу |
| `available` | `intermediate` | ✅ Доступен, если прогресс узла ≥30% ИЛИ решен ≥1 basic кейс |
| `active` | `intermediate` | ✅ Доступен, если прогресс узла ≥30% ИЛИ решен ≥1 кейс |
| `unlocked`/`integrated` | `intermediate` | ✅ Доступен, если решен ≥1 basic кейс |
| `active`/`unlocked`/`integrated` | `advanced` | ✅ Доступен, если прогресс узла ≥60% ИЛИ решено ≥2 кейса (≥1 intermediate) |
| `locked` | любая | ❌ Недоступен (на старте все узлы заблокированы) |
| `available` | `advanced` | ❌ Недоступен (нужен хотя бы `active` для advanced) |

#### Уровень узла 2

**Определение уровня:** Узел уровня 2 — это узел с большим `xp_required` в своей ветке (вторые 50% узлов ветки).

| Состояние узла | Состояние узлов уровня 1 | Сложность кейса | Условие доступности |
|---------------|-------------------------|----------------|---------------------|
| `active` | Все узлы уровня 1 имеют прогресс ≥70% | `basic` | ✅ Доступен сразу |
| `unlocked`/`integrated` | Все узлы уровня 1 имеют прогресс ≥70% | `basic` | ✅ Доступен сразу |
| `active` | Все узлы уровня 1 имеют прогресс ≥70% | `intermediate` | ✅ Доступен, если прогресс узла ≥30% ИЛИ решен ≥1 basic кейс |
| `unlocked`/`integrated` | Все узлы уровня 1 имеют прогресс ≥70% | `intermediate` | ✅ Доступен, если решен ≥1 basic кейс |
| `active`/`unlocked`/`integrated` | Все узлы уровня 1 имеют прогресс ≥70% | `advanced` | ✅ Доступен, если прогресс узла ≥60% ИЛИ решено ≥2 кейса (≥1 intermediate) |
| любое | Не все узлы уровня 1 имеют прогресс ≥70% | любая | ❌ Недоступен |
| `locked`/`available` | любое | любая | ❌ Недоступен (для уровня 2 нужно хотя бы `active`) |

### Алгоритм проверки доступности

**Файл:** `apps/web/src/app/experiments/page.tsx`  
**Функция:** `isCaseAvailable(case_: InteractiveCase): boolean`

```typescript
function isCaseAvailable(case_: InteractiveCase): boolean {
  // 1. Базовые проверки - кейсы должны иметь node_id
  if (!case_.node_id) {
    console.error(`Case ${case_.id} has no node_id - needs manual assignment`);
    return false;
  }
  
  if (!tree || !tree.nodes) return false;
  
  // 2. Найти узел кейса в дереве
  const node = tree.nodes.find((n: any) => n.node_id === case_.node_id);
  if (!node) {
    console.warn(`Node ${case_.node_id} not found in tree for case ${case_.id}`);
    return false;
  }
  
  // 3. Проверить состояние узла (КРИТИЧНО!)
  const nodeState = node.state;
  
  // На старте все узлы заблокированы - кейсы недоступны
  if (nodeState === 'locked') {
    return false;
  }
  
  // 4. НОВОЕ (v1.1): Проверить наличие завершенных квестов на узле
  // Для открытия ЛЮБЫХ кейсов требуется хотя бы 1 завершенный квест на узле
  const completedQuestsOnNode = quests.filter(
    q => q.status === 'done' && q.linked_nodes?.includes(case_.node_id)
  ).length;
  
  if (completedQuestsOnNode === 0) {
    return false; // Нет завершенных квестов - кейс недоступен
  }
  
  // 4. Определить уровень узла
  const { level } = getNodeLevel(case_.node_id, tree, nodeDescriptions);
  
  // 5. Для уровня 2: дополнительная проверка узлов уровня 1 в ветке
  if (level === 2) {
    // Для уровня 2 нужен хотя бы active (available недостаточно)
    if (nodeState === 'available' || nodeState === 'locked') {
      return false;
    }
    
    // Проверить узлы уровня 1 в ветке
    if (!node.branch_id) return false;
    
    const branchNodes = tree.nodes.filter((n: any) => n.branch_id === node.branch_id);
    const level1Nodes = branchNodes.filter((n: any) => {
      const nLevel = getNodeLevel(n.node_id, tree, nodeDescriptions);
      return nLevel.level === 1;
    });
    
    // Все узлы уровня 1 должны иметь прогресс ≥70%
    const allLevel1Ready = level1Nodes.every(level1Node => {
      const progress = caseProgress.nodeProgress[level1Node.node_id]?.progress || 0;
      return progress >= 70;
    });
    
    if (!allLevel1Ready) return false;
  }
  
  // 6. Проверить сложность кейса
  const nodeProgress = caseProgress.nodeProgress[case_.node_id] || { progress: 0, solved: [] };
  const solvedCount = nodeProgress.solved.length;
  
  // Найти решенные кейсы этого узла для проверки наличия intermediate
  const solvedCasesForNode = nodeProgress.solved || [];
  const hasIntermediate = solvedCasesForNode.some((caseId: string) => {
    const solvedCase = cases.find((c: InteractiveCase) => c.id === caseId);
    return solvedCase?.difficulty === 'intermediate';
  });
  
  // Basic кейсы
  if (case_.difficulty === 'basic') {
    // Basic доступен сразу при available (уровень 1) или active/unlocked/integrated
    return nodeState !== 'locked';
  }
  
  // Intermediate кейсы
  if (case_.difficulty === 'intermediate') {
    // Для уровня 1 при available: нужен прогресс ≥30% ИЛИ решен ≥1 basic кейс
    if (level === 1 && nodeState === 'available') {
      return nodeProgress.progress >= 30 || solvedCount >= 1;
    }
    
    // Для уровня 1 при active/unlocked/integrated или уровня 2: нужен прогресс ≥30% ИЛИ решен ≥1 кейс
    return nodeProgress.progress >= 30 || solvedCount >= 1;
  }
  
  // Advanced кейсы
  if (case_.difficulty === 'advanced') {
    // Advanced требует active/unlocked/integrated (не available, не locked)
    if (nodeState === 'available' || nodeState === 'locked') {
      return false;
    }
    
    // Advanced: прогресс ≥60% ИЛИ решено ≥2 кейса (включая ≥1 intermediate)
    return nodeProgress.progress >= 60 || (solvedCount >= 2 && hasIntermediate);
  }
  
  return false;
}
```

### Функция определения причины недоступности

**Файл:** `apps/web/src/app/experiments/page.tsx`  
**Функция:** `getCaseUnavailableReason(case_: InteractiveCase): { message: string; nodeId?: string }`

Возвращает объект с сообщением и ID узла для пользователя о причине недоступности кейса:

- **Нет завершенных квестов (v1.1):** "Для доступа к кейсам сначала выполните хотя бы один квест на узле «{nodeName}». Квесты дают практику в реальности, а кейсы — закрепление."
- **Узел заблокирован:** "Узел не разблокирован. Разблокируйте узел через развитие предыдущих способностей и выполнение квестов в реальности."
- **Уровень 2 требует active:** "Для кейсов уровня 2 узел должен быть активен. Развивайте способность дальше, чтобы узел стал активным."
- **Уровень 2 требует прогресс уровня 1:** "Для доступа к кейсам уровня 2 нужно пройти все узлы уровня 1 в этой ветке на ≥70%."
- **Intermediate требует прогресс:** "Сначала решите базовые кейсы узла «{nodeName}» или продолжайте выполнять квесты до 30% прогресса."
- **Advanced требует прогресс:** "Для доступа к сложному кейсу нужно решить минимум 2 кейса этого узла (включая хотя бы 1 intermediate) или развить способность до 60% прогресса."

---

## Логика ранжирования кейсов

### Приоритет сортировки

Кейсы сортируются по следующему приоритету (от высшего к низшему):

1. **Доступность и статус** → доступные → недоступные → завершённые
2. **Уровень узла** → уровень 1 → уровень 2
3. **ID узла** → алфавитный порядок
4. **Сложность** → basic → intermediate → advanced

### Детальный алгоритм ранжирования

**Файл:** `apps/web/src/app/experiments/page.tsx`  
**Функция:** `rankCases(casesToRank: InteractiveCase[]): InteractiveCase[]`

```typescript
function rankCases(casesToRank: InteractiveCase[]): InteractiveCase[] {
  const difficultyOrder = { basic: 1, intermediate: 2, advanced: 3 };
  
  return [...casesToRank].sort((a, b) => {
    const aSolved = caseProgress.solvedCases.includes(a.id);
    const bSolved = caseProgress.solvedCases.includes(b.id);
    const aAvailable = isCaseAvailable(a);
    const bAvailable = isCaseAvailable(b);
    
    // 1. Приоритет: доступные → недоступные → завершённые
    // Доступные и не решённые = приоритет 0
    // Недоступные и не решённые = приоритет 1
    // Решённые = приоритет 2
    const getPriority = (solved: boolean, available: boolean): number => {
      if (solved) return 2;
      if (!available) return 1;
      return 0;
    };
    
    const aPriority = getPriority(aSolved, aAvailable);
    const bPriority = getPriority(bSolved, bAvailable);
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // 2. По уровню узла (1 → 2)
    const aLevelInfo = getNodeLevel(a.node_id, tree || null, nodeDescriptions);
    const bLevelInfo = getNodeLevel(b.node_id, tree || null, nodeDescriptions);
    
    if (aLevelInfo.level !== bLevelInfo.level) {
      return aLevelInfo.level - bLevelInfo.level;
    }
    
    // 3. Если уровень одинаковый, сортируем по node_id для группировки по узлам
    if (a.node_id !== b.node_id) {
      return (a.node_id || '').localeCompare(b.node_id || '');
    }
    
    // 4. По сложности внутри узла (basic → intermediate → advanced)
    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
  });
}
```

### Пример ранжирования

**Порядок кейсов:**

1. Доступные кейсы уровня 1, узел A, basic
2. Доступные кейсы уровня 1, узел A, intermediate
3. Доступные кейсы уровня 1, узел A, advanced
4. Доступные кейсы уровня 1, узел B, basic
5. ...
6. Недоступные кейсы уровня 1, узел A, basic
7. ...
8. Завершённые кейсы уровня 1, узел A, basic
9. ...

---

## Система прогресса

### Отслеживание решенных кейсов

**Хранение:**
- Backend: In-memory хранилище в `CasesService` (в продакшене можно заменить на БД)
- Frontend: LocalStorage + синхронизация с API

**Структура:**
```typescript
interface CaseProgress {
  solvedCases: string[];                    // Глобальный список решенных кейсов
  nodeProgress: Record<string, {            // Прогресс по узлам
    solved: string[];                       // Решенные кейсы этого узла
    progress: number;                       // Процент прогресса (0-100)
  }>;
}
```

### Расчет прогресса по узлу

**Формула:**
```
progress = (количество_решенных_кейсов_узла / общее_количество_кейсов_узла) × 100
```

**Пример:**
- У узла `node_let_it_break` есть 3 кейса
- Решено 2 кейса
- Прогресс = (2 / 3) × 100 = 67% (округляется до целого)

### Отметка кейса как решенного

**Процесс:**
1. Пользователь выбирает вариант ответа
2. Просматривает последствия
3. Нажимает кнопку "Кейс решён"
4. Frontend отправляет запрос на `POST /cases/:id/solve`
5. Backend обновляет прогресс
6. Frontend синхронизирует с localStorage
7. UI обновляется автоматически

**API Endpoint:** `POST /cases/:id/solve`

---

## UX/UI Компоненты

### Компонент: Список кейсов

**Файл:** `apps/web/src/app/experiments/page.tsx`  
**Компонент:** `CasesSection`

**Расположение:** Страница "Эксперименты" → вкладка "Учебные кейсы"

**Структура:**
- Заголовок: "Учебные кейсы"
- Подзаголовок: "Практикуйтесь в принятии решений в безопасной среде"
- Сетка карточек кейсов (1 колонка на mobile, 2 на tablet, 3 на desktop)

**Состояния карточек:**

1. **Доступные кейсы** (не решенные)
2. **Недоступные кейсы** (не решенные)
3. **Завершённые кейсы** (решенные)

### Компонент: Карточка кейса в списке

**Структура карточки:**

```
┌─────────────────────────────────┐
│ [Название кейса]  [Бейдж: Базовый/Средний/Продвинутый/Завершен]
│ [Лейбл узла]                     │
│ Пройти кейс → / Кейс недоступен  │
└─────────────────────────────────┘
```

**Элементы:**
- **Название кейса:** Заголовок карточки
- **Бейдж сложности:** Показывает уровень сложности или статус "Завершен"
- **Лейбл узла:** Показывает название узла способности
- **Ссылка/Текст:** Для доступных — ссылка, для недоступных — текст статуса

**Интерактивность:**
- Доступные кейсы: кликабельные, ведут на страницу кейса
- Недоступные кейсы: показывают модальное окно с причиной недоступности при клике

### Компонент: Страница детального просмотра кейса

**Файл:** `apps/web/src/app/cases/[id]/page.tsx`  
**Маршрут:** `/cases/:id`

**Структура страницы:**

```
┌─────────────────────────────────┐
│ ← Назад к кейсам                 │
│                                  │
│ [Название кейса]                 │
│                                  │
│ Ситуация                         │
│ [Форматированный контекст]       │
│                                  │
│ Варианты действий                │
│ [A] Вариант 1                    │
│ [B] Вариант 2                    │
│ [C] Вариант 3                    │
│ [D] Вариант 4                    │
│                                  │
│ (После выбора)                   │
│ Последствия выбора               │
│ [Выбранный вариант]              │
│ Немедленный эффект: ...          │
│ Вторичный эффект: ...            │
│ Системный эффект: ...            │
│ Влияние на зрелость: ...         │
│ [Объяснение/Предупреждение/Подсказка]
│                                  │
│ [Кнопка "Кейс решён"]            │
└─────────────────────────────────┘
```

**Элементы:**
- **Кнопка "Назад":** Возврат к списку кейсов
- **Заголовок кейса:** Название кейса
- **Блок "Ситуация":** Форматированный контекст с секциями
- **Варианты действий:** Кнопки с буквенными индикаторами
- **Блок последствий:** Показывается после выбора варианта
- **Кнопка "Кейс решён":** Отмечает кейс как решенный

### Компонент: Форматирование контекста

**Файл:** `apps/web/src/components/CaseContextFormatter.tsx`  
**Компонент:** `CaseContextFormatter`

**Варианты:**
- `preview` — краткое превью (не используется в текущей версии)
- `full` — полное форматирование со всеми секциями

**Функции:**
- Парсинг контекста на секции (по двоеточию)
- Выделение ключевых терминов жирным шрифтом
- Выделение цифр контрастным цветом
- Структурированное отображение секций

**Выделяемые элементы:**
- Ключевые термины: Компания, Проект, Ситуация, Проблема, Инцидент, Конфликт, История, Риски, Паттерн
- Целые числа: `/\b(\d+)\b/g` (только отдельно стоящие)
- Проценты: `/(\d+%)/g`
- Слова в кавычках: `/"([^"]+)"/g`
- Важные фразы: критично, важно, срочно, необходимо, обязательно
- Временные указания: завтра, сегодня, через N дней/часов/месяцев

### Компонент: Модальное окно недоступности

**Файл:** `apps/web/src/components/CaseLockedModal.tsx`  
**Компонент:** `CaseLockedModal`

**Поведение:**
- Появляется при клике на недоступный кейс
- Автозакрытие через 4 секунды
- Закрытие при клике на фон
- Показывает причину недоступности

**Визуальное оформление:**
- Темный фон с прозрачностью (`bg-black/50`)
- Центрированное модальное окно
- Белая панель с сообщением
- Закругленные углы и тень

---

## Визуальное оформление

### Цветовая схема

#### Системные цвета (Design System)

**Основные цвета:**
- `bg-bg-main` — основной фон страницы
- `bg-bg-panel` — фон карточек и панелей
- `bg-bg-secondary` — вторичный фон (бейджи, секции)
- `bg-bg-canvas` — фон для кода и специальных элементов

**Границы:**
- `border-ui-border-soft` — мягкие границы (по умолчанию)
- `border-ui-border-strong` — более заметные границы (hover)
- `border-system-stable` — границы доступных элементов
- `border-system-focus` — границы фокуса и активных элементов

**Текст:**
- `text-ui-text-main` — основной текст
- `text-ui-text-muted` — вторичный текст (менее заметный)
- `text-ui-text-dim` — очень слабый текст (подсказки)

#### Цвета сложности кейсов

**Функция:** `getDifficultyColor(difficulty: string)`

| Сложность | Цвет фона | Цвет границы | Цвет текста |
|-----------|-----------|--------------|-------------|
| `basic` | `bg-bg-secondary` | `border-system-growth/30` | `text-system-growth` |
| `intermediate` | `bg-bg-secondary` | `border-system-warning/30` | `text-system-warning` |
| `advanced` | `bg-bg-secondary` | `border-system-critical/30` | `text-system-critical` |

**Расшифровка:**
- `system-growth` — зеленый (рост, базовый уровень)
- `system-warning` — оранжевый/желтый (предупреждение, средний уровень)
- `system-critical` — красный (критично, продвинутый уровень)

#### Цвета состояний карточек

**Доступные кейсы:**
- Граница: `border-system-stable` (4px слева)
- Фон: `bg-bg-panel` + `bg-panel-gradient`
- Hover: `hover:shadow-active`
- Текст: `text-ui-text-main`

**Недоступные кейсы:**
- Граница: `border-ui-border-soft` (4px слева)
- Фон: `bg-bg-panel` + `bg-panel-gradient`
- Opacity: `opacity-50`
- Текст: `text-ui-text-muted opacity-70`
- Курсор: `cursor-not-allowed`

**Завершённые кейсы (недоступные):**
- Граница: `border-ui-border-soft` (4px слева)
- Фон: `bg-bg-panel` + `bg-panel-gradient`
- Opacity: `opacity-70` (ярче недоступных)
- Текст: `text-ui-text-muted` (без дополнительной opacity)
- Курсор: `cursor-not-allowed`

#### Цвета последствий (страница кейса)

**Немедленный эффект:**
- Граница: `border-system-critical` (4px слева)
- Фон: `bg-gradient-to-r from-bg-secondary/60 to-bg-secondary/30`
- Заголовок: `text-system-critical`
- Иконка: точка `bg-system-critical`

**Вторичный эффект:**
- Граница: `border-system-warning` (4px слева)
- Фон: `bg-gradient-to-r from-bg-secondary/60 to-bg-secondary/30`
- Заголовок: `text-system-warning`
- Иконка: точка `bg-system-warning`

**Системный эффект:**
- Граница: `border-system-stable` (4px слева)
- Фон: `bg-gradient-to-r from-bg-secondary/60 to-bg-secondary/30`
- Заголовок: `text-system-stable`
- Иконка: точка `bg-system-stable`

**Влияние на зрелость (SM Impact):**
- Граница: `border-system-focus` (4px слева)
- Фон: `bg-gradient-to-r from-bg-secondary/70 to-bg-secondary/40`
- Заголовок: `text-system-focus`
- Бейджи:
  - Положительное значение: `bg-system-growth/10 border-system-growth/30 text-system-growth`
  - Отрицательное значение: `bg-system-critical/10 border-system-critical/30 text-system-critical`
  - Нулевое значение: `bg-ui-border-soft/10 border-ui-border-soft text-ui-text-muted`

#### Цвета дополнительных блоков

**Объяснение (`explanation`):**
- Граница: `border-system-growth` (4px слева)
- Фон: `bg-gradient-to-r from-bg-secondary/60 to-bg-secondary/30`
- Иконка: 📝

**Предупреждение (`warning`):**
- Граница: `border-system-critical` (4px слева)
- Фон: `bg-gradient-to-r from-bg-secondary/70 to-bg-secondary/40`
- Текст: `text-system-critical font-semibold`
- Иконка: ⚠️

**Подсказка (`hint`):**
- Граница: `border-system-warning` (4px слева)
- Фон: `bg-gradient-to-r from-bg-secondary/60 to-bg-secondary/30`
- Иконка: 💡

**Рефлексия:**
- Фон: `bg-bg-secondary`
- Граница: `border-ui-border-soft`
- Заголовок: `text-ui-text-main font-semibold`
- Вопросы: `text-ui-text-main`
- Ключевой инсайт: `border-system-focus`

### Типографика

#### Шрифты

Используется системная типографика Design System (Architectural Dark).

**Основной текст:**
- Размер: `text-base` (16px) или `text-sm` (14px)
- Вес: `font-normal` (400)
- Межстрочный интервал: `leading-relaxed` (1.625) или `leading-7` (1.75)

**Заголовки:**
- H1 (страница кейса): `text-3xl font-bold` (30px, 700)
- H2 (секции): `text-xl font-semibold` (20px, 600) или `text-2xl font-bold` (24px, 700)
- H3 (карточки): `text-lg font-semibold` (18px, 600)

**Бейджи и лейблы:**
- Размер: `text-xs` (12px)
- Вес: `font-semibold` (600) для важных элементов
- Padding: `px-2 py-1` или `px-3 py-1.5`

#### Выделение текста

**Жирный шрифт (`font-bold`, `font-semibold`):**
- Заголовки секций
- Ключевые термины в контексте
- Цифры в контексте
- Названия навыков

**Курсив (`italic`):**
- Слова в кавычках в контексте
- Важные фразы (опционально)

### Отступы и размеры

**Карточки кейсов:**
- Padding: `p-6` (24px)
- Border-left: `border-l-4` (4px)
- Border-radius: `rounded-lg` (8px)
- Gap между карточками: `gap-6` (24px)

**Варианты действий:**
- Padding: `p-5` (20px)
- Border: `border-2` (2px)
- Border-radius: `rounded-lg` (8px)
- Gap между вариантами: `space-y-3` (12px)
- Буквенный индикатор: `w-10 h-10` (40px)

**Секции контекста:**
- Padding-left: `pl-5` (20px)
- Padding-top/bottom: `py-4` (16px)
- Border-left: `border-l-4` (4px)
- Margin между секциями: `space-y-4` (16px)

### Эффекты и анимации

**Hover эффекты:**
- Карточки доступных кейсов: `hover:shadow-active`
- Варианты действий: `hover:border-system-focus`, `hover:from-bg-secondary`, `hover:to-bg-secondary/60`, `hover:shadow-md`
- Ссылки: `hover:text-system-focus/80`, `hover:underline`
- Переходы: `transition-all`, `transition-colors`, `transition-shadow`

**Focus эффекты:**
- Кнопки: `focus:ring-2 focus:ring-system-focus focus:ring-offset-2`
- Варианты действий: `focus:ring-2 focus:ring-system-focus focus:ring-offset-2`

**Градиенты:**
- Фон панелей: `bg-panel-gradient`
- Варианты действий: `bg-gradient-to-r from-bg-secondary/80 to-bg-secondary/40`
- Секции контекста: `bg-gradient-to-r from-bg-secondary/50 to-bg-secondary/20`

---

## API Endpoints

### Backend сервис

**Файл:** `apps/api/src/cases/cases.service.ts`  
**Модуль:** `CasesModule`  
**Контроллер:** `CasesController`

### Endpoints

#### GET /cases

**Описание:** Получить все интерактивные кейсы

**Response:**
```typescript
{
  cases: InteractiveCase[]
}
```

**Статусы:**
- 200: Успешно
- 500: Ошибка загрузки файла

#### GET /cases/:id

**Описание:** Получить конкретный кейс по ID

**Parameters:**
- `id` (string) — ID кейса

**Response:**
```typescript
InteractiveCase
```

**Статусы:**
- 200: Кейс найден
- 404: Кейс не найден

#### POST /cases/:id/solve

**Описание:** Отметить кейс как решённый

**Parameters:**
- `id` (string) — ID кейса

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Статусы:**
- 200: Кейс отмечен как решённый
- 404: Кейс не найден

**Побочные эффекты:**
- Добавляет кейс в `solvedCases`
- Обновляет прогресс узла (`nodeProgress[node_id]`)
- Пересчитывает процент прогресса узла

#### GET /cases/progress

**Описание:** Получить прогресс кейсов пользователя

**Response:**
```typescript
CaseProgress
```

**Статусы:**
- 200: Успешно

#### POST /cases/progress

**Описание:** Сохранить прогресс кейсов

**Body:**
```typescript
CaseProgress
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Статусы:**
- 200: Прогресс сохранён

#### GET /cases/by-node/:nodeId

**Описание:** Получить все кейсы для конкретного узла

**Parameters:**
- `nodeId` (string) — ID узла

**Response:**
```typescript
{
  cases: InteractiveCase[]
}
```

**Статусы:**
- 200: Успешно

#### GET /cases/by-branch/:branchId

**Описание:** Получить все кейсы для конкретной ветки

**Parameters:**
- `branchId` (string) — ID ветки

**Response:**
```typescript
{
  cases: InteractiveCase[]
}
```

**Статусы:**
- 200: Успешно

#### GET /cases/cache/clear

**Описание:** Очистить кеш кейсов (для разработки)

**Response:**
```typescript
{
  message: string;
}
```

**Статусы:**
- 200: Кеш очищен

### Frontend API функции

**Файл:** `apps/web/src/lib/api.ts`

**Функции:**
- `getCases(): Promise<{ cases: InteractiveCase[] }>`
- `getCase(id: string): Promise<InteractiveCase>`
- `markCaseAsSolved(caseId: string): Promise<{ success: boolean; message: string }>`
- `getCaseProgress(): Promise<CaseProgress>`
- `saveCaseProgress(progress: CaseProgress): Promise<{ success: boolean; message: string }>`

---

## Переводы и локализация

### Перевод названий узлов

**Файл:** `apps/web/src/lib/node-translations.ts`  
**Функция:** `getNodeName(nodeId: string, nodeDescriptions?: any): string`

**Логика:**
1. Проверка наличия `nodeDescriptions` и поиск описания узла
2. Использование поля `name` из описания узла
3. Fallback на `nodeNameMap` (статический маппинг)
4. Fallback на `nodeId` (если перевод не найден)

### Перевод навыков (skill_used)

**Файл:** `apps/web/src/app/cases/[id]/page.tsx`  
**Функция:** `translateSkill(skill?: string, nodeDescriptions?: any): string | null`

**Процесс:**
1. Проверка fallback маппинга (`skillFallbackMap`)
2. Преобразование названия навыка в `node_id` через `skillToNodeId()`
3. Получение русского названия узла через `getNodeName()`
4. Fallback на оригинальное название навыка

**Fallback маппинг навыков:**
```typescript
const skillFallbackMap: Record<string, string> = {
  'Direct Order': 'Прямое распоряжение',
  'Context Share': 'Передача контекста',
  'Avoidance': 'Избегание',
  'Hero Mode': 'Режим героя',
  'Delegation': 'Делегирование',
  // ... и другие
};
```

### Перевод сложности кейсов

**Файл:** `apps/web/src/app/experiments/page.tsx`

**Маппинг:**
- `basic` → "Базовый"
- `intermediate` → "Средний"
- `advanced` → "Продвинутый"

**Отображение:**
- В бейджах карточек кейсов
- В детальном просмотре кейса (опционально)

### Перевод статусов

**Статусы кейсов:**
- "Завершен" — для решенных кейсов
- "Кейс завершен" — для завершенных недоступных кейсов
- "Кейс недоступен" — для недоступных кейсов
- "Пройти кейс →" — для доступных нерешенных кейсов
- "Просмотреть кейс →" — для доступных решенных кейсов

**Статусы узлов:**
- Используются как есть в системе (`locked`, `available`, `active`, `unlocked`, `integrated`)
- Отображаются в других компонентах (не в кейсах напрямую)

---

## Архитектура файлов

### Frontend

**Страницы:**
- `apps/web/src/app/experiments/page.tsx` — страница списка кейсов (вкладка в "Эксперименты")
- `apps/web/src/app/cases/[id]/page.tsx` — страница детального просмотра кейса

**Компоненты:**
- `apps/web/src/components/CaseContextFormatter.tsx` — форматирование контекста кейса
- `apps/web/src/components/CaseLockedModal.tsx` — модальное окно недоступности

**Утилиты:**
- `apps/web/src/lib/api.ts` — API функции для работы с кейсами
- `apps/web/src/lib/node-translations.ts` — переводы названий узлов

**Хуки:**
- Используются стандартные React hooks (`useState`, `useEffect`, `useMemo`)
- `@tanstack/react-query` для кеширования и синхронизации данных

### Backend

**Сервисы:**
- `apps/api/src/cases/cases.service.ts` — бизнес-логика работы с кейсами
- `apps/api/src/cases/cases.controller.ts` — REST API контроллер
- `apps/api/src/cases/cases.module.ts` — модуль NestJS

**Данные:**
- `data/interactive-cases.json` — JSON файл со всеми кейсами
- Кеширование в памяти (`casesCache`)
- In-memory хранилище прогресса (в продакшене можно заменить на БД)

### Скрипты

**Утилиты:**
- `scripts/generate_ranking_report.ts` — генерация отчета о ранжировании кейсов
- `scripts/convert_cases_markdown_to_json.ts` — конвертация кейсов из Markdown в JSON

### Документация

**Документы:**
- `docs/CASE_CARD_DESIGN_SPEC.md` — спецификация дизайна карточек кейсов
- `docs/CASES_SYSTEM_SPECIFICATION.md` — этот документ (системная спецификация)
- `cases-ranking-report.md` — отчет о ранжировании кейсов (генерируется автоматически)

---

## Визуальное оформление (детально)

### Карточка кейса в списке

#### Доступный кейс (не решенный)

**Структура:**
```html
<div class="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 border-l-4 border-system-stable hover:shadow-active transition-shadow bg-panel-gradient">
  <Link href="/cases/:id" class="block">
    <div class="flex justify-between items-start mb-2">
      <h3 class="font-semibold text-lg text-ui-text-main">{title}</h3>
      <span class="text-xs px-2 py-1 rounded border bg-bg-secondary border-system-growth/30 text-system-growth">
        {difficulty_translated}
      </span>
    </div>
    {node_id && (
      <div class="mb-4">
        <span class="text-xs px-2 py-1 rounded border bg-bg-secondary border-system-stable text-system-stable">
          {node_name}
        </span>
      </div>
    )}
    <div class="text-sm text-system-focus hover:text-system-focus/80 hover:underline">
      Пройти кейс →
    </div>
  </Link>
</div>
```

**Стили:**
- Граница слева: `border-l-4 border-system-stable` (4px, цвет стабильности)
- Фон: `bg-bg-panel` + градиент `bg-panel-gradient`
- Тень: `shadow-panel` (базовая), `hover:shadow-active` (при наведении)
- Переход: `transition-shadow`
- Padding: `p-6` (24px)

#### Недоступный кейс (не решенный)

**Структура:**
```html
<div class="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 border-l-4 border-ui-border-soft opacity-50 transition-shadow bg-panel-gradient cursor-not-allowed">
  <div>
    <div class="flex justify-between items-start mb-2">
      <h3 class="font-semibold text-lg text-ui-text-muted opacity-70">{title}</h3>
      <span class="text-xs px-2 py-1 rounded border bg-bg-secondary border-system-growth/30 text-system-growth opacity-50">
        {difficulty_translated}
      </span>
    </div>
    {node_id && (
      <div class="mb-4">
        <span class="text-xs px-2 py-1 rounded border bg-bg-secondary border-system-stable text-system-stable opacity-50">
          {node_name}
        </span>
      </div>
    )}
    <div class="text-sm text-ui-text-muted opacity-70">
      Кейс недоступен
    </div>
  </div>
</div>
```

**Стили:**
- Граница слева: `border-l-4 border-ui-border-soft` (4px, мягкая граница)
- Фон: `bg-bg-panel` + градиент `bg-panel-gradient`
- Opacity: `opacity-50` (карточка), `opacity-70` (текст заголовка), `opacity-50` (бейджи)
- Курсор: `cursor-not-allowed`
- Интерактивность: клик показывает модальное окно с причиной недоступности

#### Завершённый кейс (решенный, но недоступный)

**Структура:**
```html
<div class="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 border-l-4 border-ui-border-soft opacity-70 transition-shadow bg-panel-gradient cursor-not-allowed">
  <div>
    <div class="flex justify-between items-start mb-2">
      <h3 class="font-semibold text-lg text-ui-text-muted">{title}</h3>
      <span class="text-xs px-2 py-1 rounded border bg-bg-secondary border-ui-border-soft text-ui-text-muted">
        Завершен
      </span>
    </div>
    {node_id && (
      <div class="mb-4">
        <span class="text-xs px-2 py-1 rounded border bg-bg-secondary border-system-stable text-system-stable">
          {node_name}
        </span>
      </div>
    )}
    <div class="text-sm text-ui-text-muted">
      Кейс завершен
    </div>
  </div>
</div>
```

**Стили:**
- Граница слева: `border-l-4 border-ui-border-soft` (4px, мягкая граница)
- Фон: `bg-bg-panel` + градиент `bg-panel-gradient`
- Opacity: `opacity-70` (карточка, ярче недоступных)
- Текст: без дополнительной opacity (читабельнее)
- Бейдж: `bg-bg-secondary border-ui-border-soft text-ui-text-muted` (нейтральный цвет)

#### Завершённый кейс (решенный, доступный)

**Структура:**
Аналогична доступному кейсу, но:
- Бейдж: "Завершен" с нейтральным стилем
- Ссылка: "Просмотреть кейс →" вместо "Пройти кейс →"
- Доступен для просмотра

### Страница детального просмотра кейса

#### Блок контекста (ситуация)

**Компонент:** `CaseContextFormatter`  
**Variant:** `full`

**Структура секции:**
```html
<div class="border-l-4 border-system-focus/40 pl-5 py-4 bg-gradient-to-r from-bg-secondary/50 to-bg-secondary/20 rounded-r-lg hover:from-bg-secondary/70 hover:to-bg-secondary/40 transition-all shadow-sm">
  <h3 class="font-bold text-lg text-ui-text-main mb-3 flex items-center gap-2.5">
    <span class="w-2 h-2 rounded-full bg-system-focus shadow-sm"></span>
    <span class="bg-system-focus/10 px-2 py-0.5 rounded text-system-focus">
      {section_title}
    </span>
  </h3>
  <div class="text-sm text-ui-text-main leading-relaxed pl-3.5 space-y-3">
    {formatted_paragraphs}
  </div>
</div>
```

**Выделение текста:**
- Ключевые термины: `font-extrabold text-ui-text-main`
- Цифры: `font-bold text-system-warning`
- Проценты: `font-bold text-system-warning`
- Слова в кавычках: `font-medium text-system-warning italic`
- Важные фразы: `font-bold text-system-critical`
- Временные указания: `font-semibold text-system-warning`

#### Варианты действий (до выбора)

**Структура варианта:**
```html
<button class="w-full p-5 text-left bg-gradient-to-r from-bg-secondary/80 to-bg-secondary/40 border-2 border-ui-border-soft rounded-lg hover:border-system-focus hover:from-bg-secondary hover:to-bg-secondary/60 transition-all shadow-sm hover:shadow-md focus:ring-2 focus:ring-system-focus focus:ring-offset-2 focus:ring-offset-bg-panel">
  <div class="flex items-start gap-4">
    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-system-focus/20 border-2 border-system-focus/40 flex items-center justify-center">
      <span class="text-lg font-bold text-system-focus">{option_id}</span>
    </div>
    <div class="flex-1 pt-1">
      <p class="text-base text-ui-text-main leading-relaxed font-medium">{clean_option_text}</p>
    </div>
  </div>
</button>
```

**Стили:**
- Фон: градиент `from-bg-secondary/80 to-bg-secondary/40`
- Граница: `border-2 border-ui-border-soft`, при hover `border-system-focus`
- Буквенный индикатор: круг 40x40px, фон `bg-system-focus/20`, граница `border-system-focus/40`
- Текст: только очищенный текст варианта (без технической информации)
- Hover: изменение границы, фона, тени

#### Выбранный вариант (после выбора)

**Структура:**
```html
<div class="bg-gradient-to-r from-bg-secondary/80 to-bg-secondary/40 border-l-4 border-system-focus p-5 mb-6 rounded-r-lg shadow-sm">
  <div class="flex items-start gap-3">
    <span class="text-2xl font-bold text-system-focus mt-0.5">{option_id}.</span>
    <div class="flex-1">
      <p class="font-bold text-lg text-ui-text-main mb-3">Вы выбрали:</p>
      <p class="text-base text-ui-text-main leading-relaxed mb-3">{clean_option_text}</p>
      {skill_used && (
        <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-system-focus/10 border border-system-focus/30 rounded-lg">
          <span class="text-xs font-semibold text-ui-text-muted uppercase tracking-wide">Навык:</span>
          <span class="text-sm font-bold text-system-focus">{translated_skill}</span>
        </div>
      )}
    </div>
  </div>
</div>
```

**Стили:**
- Граница слева: `border-l-4 border-system-focus`
- Фон: градиент `from-bg-secondary/80 to-bg-secondary/40`
- Бейдж навыка: `bg-system-focus/10 border-system-focus/30`

#### Блоки последствий

**Немедленный эффект:**
```html
<div class="p-5 bg-gradient-to-r from-bg-secondary/60 to-bg-secondary/30 border-l-4 border-system-critical rounded-r-lg shadow-sm">
  <h3 class="font-bold text-base text-system-critical mb-2.5 flex items-center gap-2">
    <span class="w-1.5 h-1.5 rounded-full bg-system-critical"></span>
    Немедленный эффект:
  </h3>
  <p class="text-sm text-ui-text-main leading-relaxed pl-3.5">{immediate_consequence}</p>
</div>
```

**Вторичный эффект:**
```html
<div class="p-5 bg-gradient-to-r from-bg-secondary/60 to-bg-secondary/30 border-l-4 border-system-warning rounded-r-lg shadow-sm">
  <h3 class="font-bold text-base text-system-warning mb-2.5 flex items-center gap-2">
    <span class="w-1.5 h-1.5 rounded-full bg-system-warning"></span>
    Вторичный эффект:
  </h3>
  <p class="text-sm text-ui-text-main leading-relaxed pl-3.5">{second_order_consequence}</p>
</div>
```

**Системный эффект:**
```html
<div class="p-5 bg-gradient-to-r from-bg-secondary/60 to-bg-secondary/30 border-l-4 border-system-stable rounded-r-lg shadow-sm">
  <h3 class="font-bold text-base text-system-stable mb-2.5 flex items-center gap-2">
    <span class="w-1.5 h-1.5 rounded-full bg-system-stable"></span>
    Системный эффект:
  </h3>
  <p class="text-sm text-ui-text-main leading-relaxed pl-3.5">{systemic_consequence}</p>
</div>
```

#### Блок влияния на зрелость (SM Impact)

**Структура:**
```html
<div class="p-5 bg-gradient-to-r from-bg-secondary/70 to-bg-secondary/40 border-l-4 border-system-focus rounded-r-lg shadow-sm mb-4">
  <h3 class="font-bold text-base text-system-focus mb-3 flex items-center gap-2">
    <span class="w-1.5 h-1.5 rounded-full bg-system-focus"></span>
    Влияние на зрелость:
  </h3>
  <div class="flex flex-wrap gap-3 pl-3.5">
    {sm_impact_entries.map(([key, value]) => (
      <div class={`px-3 py-1.5 rounded-lg border font-semibold text-sm ${
        value > 0
          ? 'bg-system-growth/10 border-system-growth/30 text-system-growth'
          : value < 0
          ? 'bg-system-critical/10 border-system-critical/30 text-system-critical'
          : 'bg-ui-border-soft/10 border-ui-border-soft text-ui-text-muted'
      }`}>
        <span class="font-bold">{key}:</span> {value > 0 ? '+' : ''}{value} ({label})
      </div>
    ))}
  </div>
</div>
```

**Маппинг SM Impact:**
- `S` → "Системность"
- `R` → "Ответственность"
- `C` → "Связность"
- `F` → "Свобода"
- `K` → "Качество"

#### Дополнительные блоки

**Объяснение:**
```html
<div class="p-5 bg-gradient-to-r from-bg-secondary/60 to-bg-secondary/30 border-l-4 border-system-growth rounded-r-lg shadow-sm mb-4">
  <div class="flex items-start gap-2.5">
    <span class="text-lg">📝</span>
    <p class="text-sm text-ui-text-main leading-relaxed font-medium">{explanation}</p>
  </div>
</div>
```

**Предупреждение:**
```html
<div class="p-5 bg-gradient-to-r from-bg-secondary/70 to-bg-secondary/40 border-l-4 border-system-critical rounded-r-lg shadow-sm mb-4">
  <div class="flex items-start gap-2.5">
    <span class="text-lg">⚠️</span>
    <p class="text-sm text-system-critical leading-relaxed font-semibold">{warning}</p>
  </div>
</div>
```

**Подсказка:**
```html
<div class="p-5 bg-gradient-to-r from-bg-secondary/60 to-bg-secondary/30 border-l-4 border-system-warning rounded-r-lg shadow-sm mb-4">
  <div class="flex items-start gap-2.5">
    <span class="text-lg">💡</span>
    <p class="text-sm text-ui-text-main leading-relaxed">{hint}</p>
  </div>
</div>
```

#### Блок рефлексии

**Структура:**
```html
<div class="mt-6 p-4 bg-bg-secondary border border-ui-border-soft rounded-lg">
  <h3 class="font-semibold mb-3 text-ui-text-main">Вопросы для рефлексии:</h3>
  <ul class="space-y-2">
    {questions.map((question, idx) => (
      <li class="text-sm text-ui-text-main">• {question}</li>
    ))}
  </ul>
  {mirror && selectedOption && (
    <div class="mt-4 p-3 bg-bg-panel rounded border border-ui-border-soft">
      <p class="text-sm font-semibold mb-1 text-ui-text-main">Зеркало:</p>
      <p class="text-sm text-ui-text-muted">{mirror[selectedOption]}</p>
    </div>
  )}
  {key_insight && (
    <div class="mt-4 p-3 bg-bg-panel border border-system-focus rounded">
      <p class="text-sm font-semibold mb-1 text-ui-text-main">Ключевой инсайт:</p>
      <p class="text-sm text-ui-text-muted">{key_insight}</p>
    </div>
  )}
</div>
```

#### Кнопка "Кейс решён"

**Не решенный:**
```html
<button class="px-6 py-3 bg-system-growth text-ui-text-main rounded hover:bg-system-growth/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-system-growth focus:ring-offset-2 focus:ring-offset-bg-panel">
  Кейс решён
</button>
```

**Решенный:**
```html
<div class="flex items-center gap-2 text-system-growth">
  <span class="text-lg">✓</span>
  <span class="text-sm font-medium">Кейс решён</span>
</div>
```

---

## Связанные документы

### Основная документация

1. **`docs/CASE_CARD_DESIGN_SPEC.md`** — Спецификация дизайна карточек кейсов
   - Описание визуального оформления
   - Требования к дизайну
   - Статус исправлений

2. **`cases-ranking-report.md`** — Отчет о ранжировании кейсов
   - Генерируется автоматически скриптом `scripts/generate_ranking_report.ts`
   - Показывает позицию каждого кейса в ранжированном списке
   - Объясняет факторы, повлиявшие на позицию

3. **`00_кейсы.md`** — Описание кейсов
   - Общее описание системы кейсов
   - Список кейсов по узлам

### Связанные системы

1. **Система узлов способностей**
   - Определяет доступность кейсов
   - Используется для расчета прогресса
   - Файл: `data/semantic-tree.json`

2. **Система прогресса пользователя**
   - Отслеживает решенные кейсы
   - Связана с системой узлов
   - Хранится в `CaseProgress`

3. **Система квестов**
   - Квесты — основной способ развития на старте
   - Кейсы открываются после разблокировки узлов через квесты

---

## Технические детали реализации

### Определение уровня узла

**Файл:** `apps/web/src/app/experiments/page.tsx`  
**Функция:** `getNodeLevel(nodeId: string, tree: SemanticTree | null, nodeDescriptions?: any)`

**Логика:**
1. Найти узел в дереве по `node_id`
2. Если у узла нет `branch_id` → уровень 1
3. Получить все узлы ветки
4. Отсортировать узлы ветки по `xp_required` (по возрастанию)
5. Определить позицию узла в отсортированном списке
6. Первые 50% узлов → уровень 1, остальные → уровень 2

**Формула:**
```typescript
const threshold = Math.ceil(sortedNodes.length / 2);
const level = nodeIndex < threshold ? 1 : 2;
```

### Очистка текста вариантов действий

**Файл:** `apps/web/src/app/cases/[id]/page.tsx`  
**Функция:** `cleanOptionText(text: string): string`

**Процесс:**
1. Берется только первая часть до двойного переноса строки
2. Удаляется всё после "Навык:"
3. Удаляется всё после "Последствия:"
4. Удаляются начальные и конечные пробелы

**Цель:** Показывать пользователю только чистый текст варианта без технической информации.

### Преобразование навыка в node_id

**Файл:** `apps/web/src/app/cases/[id]/page.tsx`  
**Функция:** `skillToNodeId(skill: string): string`

**Процесс:**
1. Приведение к нижнему регистру
2. Замена " & " на "_and_"
3. Замена "+" на "_and_"
4. Замена пробелов на подчеркивания
5. Удаление всех не-буквенно-цифровых символов кроме подчеркиваний
6. Добавление префикса `node_` если его нет

**Примеры:**
- "Difference Field" → "node_difference_field"
- "Let It Break" → "node_let_it_break"
- "Delegation as Coupling" → "node_delegation_as_coupling"

### Форматирование контекста

**Файл:** `apps/web/src/components/CaseContextFormatter.tsx`  
**Функция:** `formatTextWithAccents(text: string): React.ReactNode`

**Паттерны выделения:**
1. Ключевые термины — жирным (`font-extrabold text-ui-text-main`)
2. Целые числа — `/\b(\d+)\b/g` с цветом `text-system-warning`
3. Проценты — `/(\d+%)/g` с цветом `text-system-warning`
4. Слова в кавычках — `/"([^"]+)"/g` с цветом `text-system-warning italic`
5. Важные фразы — `/\b(критично|важно|срочно|...)\b/gi` с цветом `text-system-critical`
6. Временные указания — с цветом `text-system-warning`

**Логика:**
- Собираются все совпадения с позициями
- Совпадения сортируются по позиции
- Убираются перекрывающиеся совпадения (оставляется первое)
- Текст строится с вставкой выделенных фрагментов

---

## Статистика системы

### Общие данные

- **Всего кейсов:** 59
- **Кейсов с node_id:** 59 (100%)
- **Кейсов без node_id:** 0
- **Кейсов с options:** 59 (все имеют варианты действий)

### Распределение по сложности

- **Basic:** ~20 кейсов (примерно 34%)
- **Intermediate:** ~20 кейсов (примерно 34%)
- **Advanced:** ~19 кейсов (примерно 32%)

### Распределение по узлам

**Топ узлов по количеству кейсов:**
- Большинство узлов имеют по 3 кейса (basic, intermediate, advanced)
- Некоторые узлы имеют по 2 кейса
- Один узел (`node_rule_creation`) имеет 1 кейс

### Распределение по веткам

Кейсы распределены по следующим веткам:
- `branch_resilience` — Устойчивость
- `branch_architecture_thinking` — Архитектурное мышление
- `branch_subjectivity` — Субъектность
- `branch_maturity_environment` — Среда зрелости
- И другие

---

## Известные ограничения и TODO

### Текущие ограничения

1. **Краткое описание кейса отсутствует**
   - В карточках используется начало контекста
   - Нужно добавить поле `summary` в структуру данных
   - Требует подготовки кратких описаний для всех 59 кейсов

2. **Хранение прогресса в памяти**
   - Backend хранит прогресс в памяти (`CasesService`)
   - В продакшене нужно перенести в БД
   - Frontend использует localStorage как кеш

3. **Автозакрытие модального окна**
   - Модальное окно недоступности закрывается автоматически через 4 секунды
   - Пользователь может не успеть прочитать длинное сообщение

### Планы на будущее

1. **Опыт (XP) за кейсы**
   - Реализовать начисление XP за решение кейсов
   - Рекомендуемые значения:
     - Basic: 20-30 XP
     - Intermediate: 40-60 XP
     - Advanced: 80-120 XP

2. **Улучшение форматирования контекста**
   - Добавить поддержку Markdown в контексте
   - Улучшить парсинг секций
   - Добавить поддержку изображений (опционально)

3. **Аналитика кейсов**
   - Отслеживание популярных вариантов ответов
   - Статистика по узлам (какие кейсы решаются чаще)
   - A/B тестирование вариантов ответов

---

## Чеклист для разработчиков

### При добавлении нового кейса

- [ ] Кейс имеет уникальный `id` в формате `case_{node_id}_{number}`
- [ ] Кейс имеет `node_id` (обязательно)
- [ ] Кейс имеет `difficulty` (basic/intermediate/advanced)
- [ ] Кейс имеет `context` с секциями (разделение по двоеточию)
- [ ] Кейс имеет минимум 2 варианта действий в `options`
- [ ] Каждый вариант имеет `id` (A, B, C, D...)
- [ ] Каждый вариант имеет очищенный текст (без технической информации)
- [ ] Каждый вариант имеет `consequence` (immediate, second_order, systemic)
- [ ] Узел существует в `semantic-tree.json`
- [ ] Узел имеет русское название в `node-translations.ts`

### При изменении логики доступности

- [ ] Проверить все три уровня сложности (basic, intermediate, advanced)
- [ ] Проверить оба уровня узлов (1 и 2)
- [ ] Проверить все состояния узлов (locked, available, active, unlocked, integrated)
- [ ] Обновить функцию `getCaseUnavailableReason` для новых сообщений
- [ ] Протестировать на примере реальных кейсов

### При изменении стилей

- [ ] Проверить все три состояния карточек (доступные, недоступные, завершённые)
- [ ] Проверить на темной теме (Architectural Dark)
- [ ] Проверить на разных размерах экрана (mobile, tablet, desktop)
- [ ] Убедиться, что текст читаем (достаточный контраст)
- [ ] Проверить hover и focus эффекты

---

## Примеры использования

### Проверка доступности кейса

```typescript
const isAvailable = isCaseAvailable(case_);
if (isAvailable) {
  // Кейс доступен, можно показать ссылку
  return <Link href={`/cases/${case_.id}`}>Пройти кейс</Link>;
} else {
  // Кейс недоступен, показать причину
  const reason = getCaseUnavailableReason(case_);
  return <LockedCaseMessage reason={reason} />;
}
```

### Отметка кейса как решенного

```typescript
async function handleMarkAsSolved(caseId: string) {
  try {
    await markCaseAsSolved(caseId);
    const progress = await getCaseProgress();
    setCaseProgress(progress);
    localStorage.setItem('caseProgress', JSON.stringify(progress));
    toast.showToast('Кейс отмечен как решённый', 'success');
  } catch (error) {
    toast.showToast('Ошибка при сохранении прогресса', 'error');
  }
}
```

### Фильтрация доступных кейсов

```typescript
const availableCases = cases.filter(case_ => isCaseAvailable(case_));
const unavailableCases = cases.filter(case_ => !isCaseAvailable(case_));
const solvedCases = cases.filter(case_ => 
  caseProgress.solvedCases.includes(case_.id)
);
```

---

## Версионирование

**Версия 1.1** (09.01.2026)
- **НОВОЕ:** Требование выполнения квеста для доступа к кейсам
- **НОВОЕ:** Раздел "Связь с квестами" с новой таблицей доступности
- **НОВОЕ:** API endpoint `/quests/completed-by-node/:nodeId`
- **НОВОЕ:** API endpoint `/cases/:id/availability` с требованиями
- **НОВОЕ:** Улучшенное модальное окно с кнопкой перехода к квестам
- **ОБНОВЛЕНО:** Функция `getCaseUnavailableReason` возвращает объект с nodeId
- **СВЯЗАНО:** Новый документ `DEVELOPMENT_SYSTEM.md` описывает общую систему развития

**Версия 1.0** (08.01.2026)
- Полная спецификация системы кейсов
- Логика доступности с учетом состояния узлов
- Логика ранжирования (доступные → недоступные → завершённые)
- Визуальное оформление всех состояний
- API endpoints и интеграции
- Система прогресса и отслеживания

---

**Документ подготовлен:** 09.01.2026  
**Автор:** Система документации Leadership Architect  
**Статус:** Актуальная версия
