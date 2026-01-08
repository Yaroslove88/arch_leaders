# Руководство по использованию контента игры

## 📁 Структура контента

### Файлы с контентом:

1. **`docs/GAME_CONTENT.md`** - Основной документ с полным описанием:
   - User Flow
   - Каталог квестов
   - Ветки квестов
   - Описания узлов
   - Кейсы и ситуации

2. **`QUESTS_STRUCTURED_CONTENT.md`** - Контентная база квестов:
   - Полное структурированное описание всех 33 квестов
   - Без теоретической части (теория в `QUESTS_THEORIES_MAPPING.md`)
   - Источник истины для структуры и содержания квестов

3. **`QUESTS_THEORIES_MAPPING.md`** - Контентная база теоретических блоков:
   - Полный маппинг всех квестов с их теоретическими блоками
   - Источник истины для `theory_and_examples`

4. **`data/quest-templates.json`** - JSON-версия данных квестов:
   - Синхронизируется с `QUESTS_STRUCTURED_CONTENT.md` и `QUESTS_THEORIES_MAPPING.md`
   - Используется для синхронизации с базой данных
   - Готовые к использованию шаблоны для генерации квестов

3. **`data/node-descriptions.json`** - Описания узлов дерева способностей:
   - Полные описания каждой способности
   - Практическое значение
   - Примеры применения
   - Уровни интеграции

4. **`data/practice-cases.json`** - Практические кейсы:
   - Реальные ситуации для практики
   - Пошаговые инструкции
   - Вопросы для рефлексии
   - Ожидаемые результаты

5. **`docs/USER_FLOW_DETAILED.md`** - Детальный User Flow:
   - Пошаговые сценарии взаимодействия
   - Описание всех экранов
   - Действия пользователя
   - Что происходит в системе

---

## 🚀 Как использовать контент

### 1. Интеграция в базу данных

#### Шаблоны квестов (`quest-templates.json`)

Можно использовать для:
- Seed данных при инициализации БД
- Генерации квестов на основе анализа
- Рекомендаций квестов пользователю

**Пример использования:**
```typescript
// Загрузка шаблонов
import questTemplates from './data/quest-templates.json';

// Создание квеста из шаблона
const template = questTemplates.quest_templates.find(t => t.id === 'micro_containment_1');
const quest = await questsService.create({
  title: template.title,
  description: template.description,
  type: template.type,
  steps_json: template.steps,
  criteria_json: template.criteria,
  reward_json: template.reward,
  linked_nodes: template.linked_nodes,
  tags: template.tags,
});
```

#### Описания узлов (`node-descriptions.json`)

Можно использовать для:
- Отображения информации об узлах в UI
- Генерации рекомендаций
- Связывания квестов с узлами

**Пример использования:**
```typescript
// Загрузка описаний
import nodeDescriptions from './data/node-descriptions.json';

// Получение описания узла
const nodeId = 'node_containment';
const description = nodeDescriptions.node_descriptions[nodeId];

// Отображение в UI
<AbilityNodeCard
  name={description.name}
  description={description.full_description}
  practicalMeaning={description.practical_meaning}
  examples={description.examples}
  integrationLevels={description.integration_levels}
/>
```

#### Практические кейсы (`practice-cases.json`)

Можно использовать для:
- Дополнения квестов практическими заданиями
- Создания библиотеки кейсов
- Рекомендаций на основе прогресса

**Пример использования:**
```typescript
// Загрузка кейсов
import practiceCases from './data/practice-cases.json';

// Получение кейсов для узла
const nodeId = 'node_containment';
const cases = practiceCases.practice_cases.filter(c => c.node_id === nodeId);

// Добавление к квесту
quest.practice_cases = cases;
```

---

### 2. Интеграция в API

#### Endpoint для получения шаблонов квестов

```typescript
// apps/api/src/quests/quests.controller.ts
@Get('templates')
async getQuestTemplates(
  @Query('node_id') nodeId?: string,
  @Query('type') type?: string,
) {
  return this.questsService.getQuestTemplates(nodeId, type);
}
```

#### Endpoint для получения описаний узлов

```typescript
// apps/api/src/tree/tree.controller.ts
@Get('nodes/:nodeId/description')
async getNodeDescription(@Param('nodeId') nodeId: string) {
  return this.treeService.getNodeDescription(nodeId);
}
```

#### Endpoint для получения кейсов

```typescript
// apps/api/src/quests/quests.controller.ts
@Get('cases')
async getPracticeCases(
  @Query('node_id') nodeId?: string,
  @Query('difficulty') difficulty?: string,
) {
  return this.questsService.getPracticeCases(nodeId, difficulty);
}
```

---

### 3. Интеграция в Frontend

#### Компонент для отображения описания узла

```tsx
// apps/web/src/components/AbilityNodeDescription.tsx
import nodeDescriptions from '../../../data/node-descriptions.json';

export function AbilityNodeDescription({ nodeId }: { nodeId: string }) {
  const description = nodeDescriptions.node_descriptions[nodeId];
  
  return (
    <div>
      <h2>{description.name}</h2>
      <p>{description.full_description}</p>
      <h3>Практическое значение</h3>
      <p>{description.practical_meaning}</p>
      <h3>Примеры применения</h3>
      <ul>
        {description.examples.map((example, i) => (
          <li key={i}>{example}</li>
        ))}
      </ul>
      <h3>Уровни интеграции</h3>
      <ul>
        {Object.entries(description.integration_levels).map(([level, text]) => (
          <li key={level}>
            <strong>{level}:</strong> {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### Компонент для отображения квеста с шаблоном

```tsx
// apps/web/src/components/QuestCard.tsx
import questTemplates from '../../../data/quest-templates.json';

export function QuestCard({ quest }: { quest: Quest }) {
  const template = questTemplates.quest_templates.find(
    t => t.id === quest.template_id
  );
  
  return (
    <div>
      <h3>{quest.title}</h3>
      <p>{quest.description}</p>
      <div>
        <h4>Шаги выполнения:</h4>
        {template?.steps.map((step, i) => (
          <div key={i}>
            <input type="checkbox" checked={step.completed} />
            <span>{step.title}</span>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Компонент для отображения практических кейсов

```tsx
// apps/web/src/components/PracticeCaseCard.tsx
import practiceCases from '../../../data/practice-cases.json';

export function PracticeCaseCard({ nodeId }: { nodeId: string }) {
  const cases = practiceCases.practice_cases.filter(
    c => c.node_id === nodeId
  );
  
  return (
    <div>
      <h3>Практические кейсы</h3>
      {cases.map(case_ => (
        <div key={case_.id}>
          <h4>{case_.title}</h4>
          <p>{case_.description}</p>
          <h5>Вызов:</h5>
          <p>{case_.challenge}</p>
          <h5>Шаги практики:</h5>
          <ol>
            {case_.practice_steps.map((step, i) => (
              <li key={i}>
                <strong>{step.title}:</strong> {step.description}
              </li>
            ))}
          </ol>
          <h5>Вопросы для рефлексии:</h5>
          <ul>
            {case_.reflection_questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

---

### 4. Генерация квестов на основе анализа

Используйте шаблоны для генерации квестов:

```typescript
// apps/api/src/quests/quest-generation.service.ts
import questTemplates from '../../../data/quest-templates.json';

async generateQuestsFromSession(sessionId: string): Promise<number> {
  const session = await this.getSession(sessionId);
  const abilitySignals = session.ability_signals_json as AbilitySignal[];
  
  let generatedCount = 0;
  
  for (const signal of abilitySignals) {
    // Найти шаблоны для этого узла
    const templates = questTemplates.quest_templates.filter(
      t => t.linked_nodes.includes(signal.node_id)
    );
    
    // Выбрать подходящий шаблон
    const template = this.selectTemplate(templates, signal);
    
    if (template) {
      // Создать квест из шаблона
      const quest = await this.createQuestFromTemplate(template, sessionId);
      generatedCount++;
    }
  }
  
  return generatedCount;
}

private selectTemplate(
  templates: QuestTemplate[],
  signal: AbilitySignal
): QuestTemplate | null {
  // Логика выбора шаблона на основе сигнала
  // Например, для сильного сигнала - story квест
  // Для слабого - micro квест
  if (signal.strength === 'strong') {
    return templates.find(t => t.type === 'story') || templates[0];
  }
  return templates.find(t => t.type === 'micro') || templates[0];
}
```

---

### 5. Рекомендации квестов

Используйте контент для рекомендаций:

```typescript
// apps/api/src/quests/quests.service.ts
async getRecommendedQuests(userId: string): Promise<Quest[]> {
  // Получить прогресс пользователя
  const progress = await this.getUserProgress(userId);
  
  // Найти узлы, которые нужно развивать
  const nodesToDevelop = this.findNodesToDevelop(progress);
  
  // Найти шаблоны для этих узлов
  const templates = questTemplates.quest_templates.filter(
    t => nodesToDevelop.some(nodeId => t.linked_nodes.includes(nodeId))
  );
  
  // Отфильтровать по сложности и типу
  const recommended = templates.filter(t => 
    this.isAppropriateForUser(t, progress)
  );
  
  // Вернуть рекомендации
  return recommended.map(t => this.createQuestFromTemplate(t));
}
```

---

## 📊 Структура данных

### Quest Template
```typescript
interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  type: 'micro' | 'weekly' | 'story' | 'in-person';
  steps: Array<{
    order: number;
    title: string;
    description: string;
  }>;
  criteria: {
    type: 'evidence' | 'count' | 'custom';
    target?: number;
    description: string;
  };
  reward: {
    xp: number;
    skill_xp: number;
    skill_node: string;
  };
  linked_nodes: string[];
  tags: string[];
  estimated_duration_days: number;
}
```

### Node Description
```typescript
interface NodeDescription {
  name: string;
  full_description: string;
  practical_meaning: string;
  examples: string[];
  integration_levels: {
    Novice: string;
    Integrated: string;
    Embodied: string;
  };
  related_quests: string[];
}
```

### Practice Case
```typescript
interface PracticeCase {
  id: string;
  title: string;
  node_id: string;
  branch_id: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  description: string;
  challenge: string;
  practice_steps: Array<{
    order: number;
    title: string;
    description: string;
  }>;
  reflection_questions: string[];
  expected_outcomes: string[];
  related_quests: string[];
}
```

---

## 🎯 Следующие шаги

1. **Интегрировать в API:**
   - Создать endpoints для получения контента
   - Интегрировать в генерацию квестов
   - Добавить рекомендации

2. **Интегрировать в Frontend:**
   - Создать компоненты для отображения контента
   - Добавить на страницы узлов, квестов, dashboard
   - Создать страницы для просмотра кейсов

3. **Расширить контент:**
   - Добавить больше шаблонов квестов
   - Добавить больше практических кейсов
   - Создать контент для других узлов

4. **Персонализация:**
   - Адаптировать контент под уровень пользователя
   - Создать динамические рекомендации
   - Добавить прогрессивное раскрытие контента

---

## 📝 Примечания

- Все файлы в формате JSON для легкой интеграции
- Контент структурирован для программного использования
- Можно легко расширять и добавлять новый контент
- Контент связан с узлами дерева способностей
- Можно использовать для генерации, рекомендаций, отображения

---

## 🔗 Связанные документы

- `GAME_CONTENT.md` - Полное описание контента
- `USER_FLOW_DETAILED.md` - Детальный User Flow
- `PROJECT_STATUS.md` - Статус проекта
- `API_DOCUMENTATION.md` - Документация API

