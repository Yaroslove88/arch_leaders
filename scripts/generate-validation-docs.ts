#!/usr/bin/env ts-node

/**
 * Скрипт для генерации MD-документов для валидации данных
 * 
 * Извлекает структуру и данные по каждой сущности (Nodes, Branches, Edges, Quests, Cases)
 * и генерирует отдельные MD-файлы для валидации в будущем.
 * 
 * Выходные файлы:
 * - docs/migration/validation/00_SUMMARY.md
 * - docs/migration/validation/01_NODES_STRUCTURE.md
 * - docs/migration/validation/02_NODES_CONTENT.md
 * - docs/migration/validation/03_NODES_FULL.md
 * - docs/migration/validation/04_BRANCHES_STRUCTURE.md
 * - docs/migration/validation/05_BRANCHES_CONTENT.md
 * - docs/migration/validation/06_BRANCHES_FULL.md
 * - docs/migration/validation/07_EDGES.md (если есть)
 * - docs/migration/validation/08_QUESTS_STRUCTURE.md
 * - docs/migration/validation/09_QUESTS_CONTENT.md
 * - docs/migration/validation/10_QUESTS_FULL.md
 * - docs/migration/validation/11_CASES_STRUCTURE.md
 * - docs/migration/validation/12_CASES_CONTENT.md
 * - docs/migration/validation/13_CASES_FULL.md
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface AbilityNode {
  node_id: string;
  name?: string;
  description?: string;
  branch_id: string;
  tier: 'basic' | 'intermediate' | 'advanced' | 'master';
  state?: string;
  unlock_conditions?: any;
  integration_level?: string;
  development_type?: string;
  xp_required?: number;
  xp_current?: number;
  prerequisites?: string[];
  [key: string]: any;
}

interface AbilityBranch {
  branch_id: string;
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  [key: string]: any;
}

interface SemanticTree {
  tree_id: string;
  semantic_version?: string;
  seed_version?: number;
  tree_revision?: number;
  branches: AbilityBranch[];
  nodes: AbilityNode[];
  edges?: any[];
}

interface NodeDescription {
  name: string;
  full_description?: string;
  practical_meaning?: string;
  examples?: string[];
  integration_levels?: {
    Novice?: string;
    Integrated?: string;
    Embodied?: string;
  };
  development_type?: string;
  situation_guidance?: string;
  reflection_prompts?: string[];
  [key: string]: any;
}

interface NodeDescriptionsData {
  node_descriptions: Record<string, NodeDescription>;
}

interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  type: string;
  steps?: Array<{
    order: number;
    title: string | null;
    description: string;
  }>;
  criteria?: {
    type: string;
    items?: string[];
    theory_and_examples?: string;
  };
  reward?: {
    xp?: number;
    skill_xp?: number;
    nodes?: Record<string, any>;
  };
  linked_nodes?: string[];
  tags?: string[];
  estimated_duration_days?: number;
  [key: string]: any;
}

interface QuestTemplatesData {
  quest_templates: QuestTemplate[];
}

interface QuestFromDB {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: string;
  status: string;
  branch: string | null;
  steps_json: any;
  criteria_json: any;
  reward_json: any;
  linked_nodes: string[];
  evidence_links_json: any;
  tags: string[];
  created_at: Date;
  updated_at: Date;
  activated_at: Date | null;
  completed_at: Date | null;
  source: string | null;
  [key: string]: any;
}

interface InteractiveCase {
  id: string;
  title: string;
  node_id?: string;
  branch_id?: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  context: string;
  indicators?: {
    trust?: 'low' | 'medium' | 'high';
    risk?: 'low' | 'medium' | 'high';
    time?: 'low' | 'medium' | 'critical';
    chaos?: 'low' | 'medium' | 'high';
    autonomy?: 'low' | 'medium' | 'high';
    speed?: 'low' | 'medium' | 'high';
    quality?: 'low' | 'medium' | 'high';
    uncertainty?: 'low' | 'medium' | 'high';
    stakes?: 'low' | 'medium' | 'high';
    [key: string]: any;
  };
  pattern?: {
    trigger: string;
    behavior: string;
    result: string;
  };
  options: Array<{
    id: string;
    text: string;
    skill_used?: string;
    consequence: {
      immediate: string;
      second_order: string;
      systemic: string;
    };
    sm_impact?: Record<string, number>;
    hint?: string;
    warning?: string;
    explanation?: string;
    [key: string]: any;
  }>;
  reflection?: {
    questions: string[];
    mirror?: Record<string, string>;
    key_insight?: string;
  };
  [key: string]: any;
}

interface CasesData {
  interactive_cases: InteractiveCase[];
}

/**
 * Загружает данные дерева из БД
 */
async function loadTreeData(): Promise<SemanticTree | null> {
  try {
    const treeRecord = await prisma.treeSemantic.findUnique({
      where: { id: 'tree_main' },
    });

    if (!treeRecord || !treeRecord.data) {
      console.log('❌ TreeSemantic.data не найдено в БД.');
      return null;
    }

    return treeRecord.data as unknown as SemanticTree;
  } catch (error: any) {
    console.error('❌ Ошибка при загрузке данных из БД:', error.message);
    return null;
  }
}

/**
 * Загружает контент из node-descriptions.json
 */
function loadContentData(): NodeDescriptionsData | null {
  try {
    const nodeDescPath = path.join(__dirname, '../data/node-descriptions.json');
    
    if (!fs.existsSync(nodeDescPath)) {
      console.log('⚠️  node-descriptions.json не найден.');
      return null;
    }

    const content = fs.readFileSync(nodeDescPath, 'utf-8');
    return JSON.parse(content) as NodeDescriptionsData;
  } catch (error: any) {
    console.error('❌ Ошибка при загрузке node-descriptions.json:', error.message);
    return null;
  }
}

/**
 * Загружает квесты из БД
 */
async function loadQuestsData(): Promise<QuestFromDB[]> {
  try {
    const quests = await prisma.quest.findMany({
      select: {
        id: true,
        userId: true,
        title: true,
        description: true,
        type: true,
        status: true,
        branch: true,
        steps_json: true,
        criteria_json: true,
        reward_json: true,
        linked_nodes: true,
        evidence_links_json: true,
        tags: true,
        created_at: true,
        updated_at: true,
        activated_at: true,
        completed_at: true,
        source: true,
      },
    });

    return quests as QuestFromDB[];
  } catch (error: any) {
    console.error('❌ Ошибка при загрузке квестов из БД:', error.message);
    return [];
  }
}

/**
 * Загружает шаблоны квестов из quest-templates.json
 */
function loadQuestTemplates(): QuestTemplatesData | null {
  try {
    const questTemplatesPath = path.join(__dirname, '../data/quest-templates.json');
    
    if (!fs.existsSync(questTemplatesPath)) {
      console.log('⚠️  quest-templates.json не найден.');
      return null;
    }

    const content = fs.readFileSync(questTemplatesPath, 'utf-8');
    return JSON.parse(content) as QuestTemplatesData;
  } catch (error: any) {
    console.error('❌ Ошибка при загрузке quest-templates.json:', error.message);
    return null;
  }
}

/**
 * Загружает кейсы из interactive-cases.json
 */
function loadCasesData(): CasesData | null {
  try {
    const casesPath = path.join(__dirname, '../data/interactive-cases.json');
    
    if (!fs.existsSync(casesPath)) {
      console.log('⚠️  interactive-cases.json не найден.');
      return null;
    }

    const content = fs.readFileSync(casesPath, 'utf-8');
    return JSON.parse(content) as CasesData;
  } catch (error: any) {
    console.error('❌ Ошибка при загрузке interactive-cases.json:', error.message);
    return null;
  }
}

/**
 * Извлекает только структуру из узла
 */
function extractNodeStructure(node: AbilityNode): {
  node_id: string;
  branch_id: string;
  tier: 'basic' | 'intermediate' | 'advanced' | 'master';
  unlock_conditions?: any;
  xp_required: number;
  prerequisites: string[];
} {
  return {
    node_id: node.node_id,
    branch_id: node.branch_id,
    tier: node.tier,
    unlock_conditions: node.unlock_conditions,
    xp_required: node.xp_required || 0,
    prerequisites: node.prerequisites || [],
  };
}

/**
 * Извлекает контент из узла
 */
function extractNodeContent(node: AbilityNode): NodeDescription | null {
  const content: NodeDescription = {
    name: node.name || node.node_id,
  };

  if (node.description) {
    content.full_description = node.description;
  }

  if (node.development_type) {
    content.development_type = node.development_type;
  }

  if (node.integration_level) {
    content.integration_levels = {
      Novice: node.integration_level,
    };
  }

  // Если нет контента, возвращаем null
  if (!content.full_description && !content.development_type && !content.integration_levels) {
    return null;
  }

  return content;
}

/**
 * Извлекает только структуру из ветки
 */
function extractBranchStructure(branch: AbilityBranch): Partial<AbilityBranch> {
  return {
    branch_id: branch.branch_id,
    color: branch.color || '#4A90E2',
    icon: branch.icon || 'circle',
  };
}

/**
 * Извлекает контент из ветки
 */
function extractBranchContent(branch: AbilityBranch): { name?: string; description?: string } {
  return {
    name: branch.name,
    description: branch.description,
  };
}

/**
 * Извлекает только структуру из квеста (без контента и пользовательских данных)
 */
function extractQuestStructure(quest: QuestFromDB): {
  id: string;
  type: string;
  source: string | null;
  branch: string | null;
  linked_nodes: string[];
  tags: string[];
  created_at: Date;
  updated_at: Date;
} {
  return {
    id: quest.id,
    type: quest.type,
    source: quest.source,
    branch: quest.branch,
    linked_nodes: quest.linked_nodes || [],
    tags: quest.tags || [],
    created_at: quest.created_at,
    updated_at: quest.updated_at,
    // НЕ включаем: userId, status, activated_at, completed_at (пользовательские данные)
    // НЕ включаем: title, description (контент)
    // НЕ включаем: steps_json, criteria_json, reward_json (смешанные данные)
  };
}

/**
 * Извлекает контент из квеста из шаблона
 */
function extractQuestContent(template: QuestTemplate): {
  id: string;
  title: string;
  description: string;
  type: string;
  steps?: Array<{ order: number; title: string | null; description: string }>;
  criteria?: { type: string; items?: string[]; theory_and_examples?: string };
  reward?: { xp?: number; skill_xp?: number; nodes?: Record<string, any> };
  linked_nodes?: string[];
  tags?: string[];
  estimated_duration_days?: number;
} {
  return {
    id: template.id,
    title: template.title,
    description: template.description,
    type: template.type,
    steps: template.steps,
    criteria: template.criteria,
    reward: template.reward,
    linked_nodes: template.linked_nodes,
    tags: template.tags,
    estimated_duration_days: template.estimated_duration_days,
  };
}

/**
 * Извлекает только структуру из кейса
 */
function extractCaseStructure(case_: InteractiveCase): {
  id: string;
  node_id?: string;
  branch_id?: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  indicators?: {
    trust?: string;
    risk?: string;
    time?: string;
    [key: string]: any;
  };
} {
  return {
    id: case_.id,
    node_id: case_.node_id,
    branch_id: case_.branch_id,
    difficulty: case_.difficulty,
    indicators: case_.indicators || undefined,
    // НЕ включаем: title, context (контент)
    // НЕ включаем: options, reflection (контент)
  };
}

/**
 * Извлекает контент из кейса
 */
function extractCaseContent(case_: InteractiveCase): {
  title: string;
  context: string;
  options: Array<{
    id: string;
    text: string;
    skill_used?: string;
    consequence: { immediate: string; second_order: string; systemic: string };
    sm_impact?: Record<string, number>;
    hint?: string;
    warning?: string;
    explanation?: string;
  }>;
  reflection?: {
    questions: string[];
    mirror?: Record<string, string>;
    key_insight?: string;
  };
} {
  return {
    title: case_.title,
    context: case_.context,
    options: case_.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      skill_used: opt.skill_used || undefined,
      consequence: opt.consequence,
      sm_impact: opt.sm_impact,
      hint: opt.hint,
      warning: opt.warning,
      explanation: opt.explanation,
    })),
    reflection: case_.reflection,
  };
}

/**
 * Создает директорию, если её нет
 */
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Экранирует JSON для Markdown
 */
function escapeJsonForMarkdown(json: any): string {
  return JSON.stringify(json, null, 2).replace(/`/g, '\\`');
}

/**
 * Форматирует дату
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================================================
// ФУНКЦИИ ГЕНЕРАЦИИ MD ДЛЯ NODES И BRANCHES
// ============================================================================

/**
 * Генерирует MD для структуры узлов
 */
function generateNodesStructureMD(
  nodes: AbilityNode[],
  treeVersion: string,
  generationDate: string,
): string {
  const structureNodes = nodes.map(extractNodeStructure);
  const examples = structureNodes.slice(0, 3);

  const statsByTier = structureNodes.reduce((acc, node) => {
    acc[node.tier] = (acc[node.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statsByBranch = structureNodes.reduce((acc, node) => {
    acc[node.branch_id] = (acc[node.branch_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return `# Структура узлов (Nodes)

**Дата генерации:** ${generationDate}  
**Версия данных:** ${treeVersion}  
**Количество узлов:** ${structureNodes.length}

---

## Описание

Этот документ содержит только **структурные данные** узлов, без контента и пользовательских данных.

## Схема данных

\`\`\`typescript
interface NodeStructure {
  node_id: string;
  branch_id: string;
  tier: 'basic' | 'intermediate' | 'advanced' | 'master';
  prerequisites: string[];
  unlock_conditions: {
    type: string;
    [key: string]: any;
  };
  xp_required: number;
}
\`\`\`

## Поля структуры

| Поле | Тип | Описание |
|------|-----|----------|
| \`node_id\` | \`string\` | Уникальный идентификатор узла |
| \`branch_id\` | \`string\` | Идентификатор ветки, к которой относится узел |
| \`tier\` | \`'basic' \| 'intermediate' \| 'advanced' \| 'master'\` | Уровень сложности узла |
| \`prerequisites\` | \`string[]\` | Список node_id обязательных предварительных узлов |
| \`unlock_conditions\` | \`object\` | Условия разблокировки узла |
| \`xp_required\` | \`number\` | Количество XP, необходимое для разблокировки |

## Статистика

### По уровням (tier)

${Object.entries(statsByTier)
  .map(([tier, count]) => `- **${tier}**: ${count} узлов`)
  .join('\n')}

### По веткам (branch_id)

${Object.entries(statsByBranch)
  .map(([branchId, count]) => `- **${branchId}**: ${count} узлов`)
  .join('\n')}

## Примеры

${examples.map((node, index) => `### Пример ${index + 1}: ${node.node_id}

\`\`\`json
${escapeJsonForMarkdown(node)}
\`\`\`
`).join('\n')}

## Все узлы (структура)

${structureNodes.map((node, index) => `### ${index + 1}. ${node.node_id}

- **Branch ID**: \`${node.branch_id}\`
- **Tier**: \`${node.tier}\`
- **Prerequisites**: ${node.prerequisites?.length ? node.prerequisites.map(p => `\`${p}\``).join(', ') : 'нет'}
- **XP Required**: ${node.xp_required || 0}
- **Unlock Conditions**: \`${JSON.stringify(node.unlock_conditions)}\`

`).join('\n')}

---

**См. также:**
- [02_NODES_CONTENT.md](./02_NODES_CONTENT.md) - Контент узлов
- [03_NODES_FULL.md](./03_NODES_FULL.md) - Полные данные узлов
`;
}

/**
 * Генерирует MD для контента узлов
 */
function generateNodesContentMD(
  nodeDescriptions: NodeDescriptionsData,
  generationDate: string,
): string {
  const nodes = Object.entries(nodeDescriptions.node_descriptions);
  const examples = nodes.slice(0, 3);

  const statsByDevelopmentType = nodes.reduce((acc, [, desc]) => {
    const type = desc.development_type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const nodesWithExamples = nodes.filter(([, desc]) => desc.examples && desc.examples.length > 0);
  const nodesWithReflectionPrompts = nodes.filter(
    ([, desc]) => desc.reflection_prompts && desc.reflection_prompts.length > 0,
  );

  return `# Контент узлов (Nodes)

**Дата генерации:** ${generationDate}  
**Количество узлов с контентом:** ${nodes.length}

---

## Описание

Этот документ содержит только **контентные данные** узлов из \`node-descriptions.json\`.

## Схема данных

\`\`\`typescript
interface NodeContent {
  name: string;
  full_description?: string;
  practical_meaning?: string;
  examples?: string[];
  integration_levels?: {
    Novice?: string;
    Integrated?: string;
    Embodied?: string;
  };
  development_type?: string;
  situation_guidance?: string;
  reflection_prompts?: string[];
}
\`\`\`

## Поля контента

| Поле | Тип | Описание |
|------|-----|----------|
| \`name\` | \`string\` | Название узла (обязательное) |
| \`full_description\` | \`string?\` | Полное описание способности |
| \`practical_meaning\` | \`string?\` | Практическое значение |
| \`examples\` | \`string[]?\` | Примеры использования |
| \`integration_levels\` | \`object?\` | Уровни интеграции (Novice, Integrated, Embodied) |
| \`development_type\` | \`string?\` | Тип развития (reflection, action, etc.) |
| \`situation_guidance\` | \`string?\` | Руководство по ситуациям |
| \`reflection_prompts\` | \`string[]?\` | Промпты для рефлексии |

## Статистика

- **Всего узлов с контентом**: ${nodes.length}
- **Узлов с примерами**: ${nodesWithExamples.length}
- **Узлов с промптами рефлексии**: ${nodesWithReflectionPrompts.length}

### По типу развития (development_type)

${Object.entries(statsByDevelopmentType)
  .map(([type, count]) => `- **${type}**: ${count} узлов`)
  .join('\n')}

## Примеры

${examples.map(([nodeId, desc], index) => `### Пример ${index + 1}: ${nodeId}

\`\`\`json
${escapeJsonForMarkdown(desc)}
\`\`\`
`).join('\n')}

## Все узлы (контент)

${nodes.map(([nodeId, desc], index) => `### ${index + 1}. ${nodeId}

- **Name**: ${desc.name}
${desc.full_description ? `- **Full Description**: ${desc.full_description}\n` : ''}${desc.practical_meaning ? `- **Practical Meaning**: ${desc.practical_meaning}\n` : ''}${desc.development_type ? `- **Development Type**: \`${desc.development_type}\`\n` : ''}${desc.examples && desc.examples.length > 0 ? `- **Examples**: ${desc.examples.length} примеров\n` : ''}${desc.integration_levels ? `- **Integration Levels**: Novice, Integrated, Embodied\n` : ''}${desc.reflection_prompts && desc.reflection_prompts.length > 0 ? `- **Reflection Prompts**: ${desc.reflection_prompts.length} промптов\n` : ''}

`).join('\n')}

---

**См. также:**
- [01_NODES_STRUCTURE.md](./01_NODES_STRUCTURE.md) - Структура узлов
- [03_NODES_FULL.md](./03_NODES_FULL.md) - Полные данные узлов
`;
}

/**
 * Генерирует MD для полных данных узлов (структура + контент)
 */
function generateNodesFullMD(
  nodes: AbilityNode[],
  nodeDescriptions: NodeDescriptionsData | null,
  treeVersion: string,
  generationDate: string,
): string {
  // Группируем по веткам
  const nodesByBranch = nodes.reduce((acc, node) => {
    if (!acc[node.branch_id]) {
      acc[node.branch_id] = [];
    }
    acc[node.branch_id].push(node);
    return acc;
  }, {} as Record<string, AbilityNode[]>);

  // Группируем по уровням
  const nodesByTier = nodes.reduce((acc, node) => {
    if (!acc[node.tier]) {
      acc[node.tier] = [];
    }
    acc[node.tier].push(node);
    return acc;
  }, {} as Record<string, AbilityNode[]>);

  const fullNodes = nodes.map((node) => {
    const structure = extractNodeStructure(node);
    const content = nodeDescriptions?.node_descriptions[node.node_id] || extractNodeContent(node) || null;
    return { ...structure, ...content };
  });

  return `# Полные данные узлов (Nodes)

**Дата генерации:** ${generationDate}  
**Версия данных:** ${treeVersion}  
**Количество узлов:** ${nodes.length}

---

## Описание

Этот документ содержит **полные данные узлов** (структура + контент), объединенные для валидации.

## Структура

Данные сгруппированы по:
1. **Веткам** (branch_id) - группы узлов по областям развития
2. **Уровням** (tier) - сложность узлов (basic, intermediate, advanced, master)

## По веткам

${Object.entries(nodesByBranch)
  .map(
    ([branchId, branchNodes]) => `
### ${branchId}

**Количество узлов:** ${branchNodes.length}

${branchNodes
  .map((node, index) => {
    const content = nodeDescriptions?.node_descriptions[node.node_id] || extractNodeContent(node) || null;
    const structure = extractNodeStructure(node);
    return `#### ${index + 1}. ${node.node_id}

**Структура:**
\`\`\`json
${escapeJsonForMarkdown(structure)}
\`\`\`

${content ? `**Контент:**
\`\`\`json
${escapeJsonForMarkdown(content)}
\`\`\`
` : '**Контент:** не найден'}

`;
  })
  .join('\n')}
`,
  )
  .join('\n')}

## По уровням (tier)

${Object.entries(nodesByTier)
  .map(
    ([tier, tierNodes]) => `
### ${tier}

**Количество узлов:** ${tierNodes.length}

| Node ID | Branch ID | Prerequisites | XP Required |
|---------|-----------|---------------|-------------|
${tierNodes
  .map(
    (node) =>
      `| \`${node.node_id}\` | \`${node.branch_id}\` | ${node.prerequisites?.length || 0} | ${node.xp_required || 0} |`,
  )
  .join('\n')}
`,
  )
  .join('\n')}

---

**См. также:**
- [01_NODES_STRUCTURE.md](./01_NODES_STRUCTURE.md) - Только структура узлов
- [02_NODES_CONTENT.md](./02_NODES_CONTENT.md) - Только контент узлов
`;
}

/**
 * Генерирует MD для структуры веток
 */
function generateBranchesStructureMD(
  branches: AbilityBranch[],
  treeVersion: string,
  generationDate: string,
): string {
  const structureBranches = branches.map(extractBranchStructure);
  const examples = structureBranches.slice(0, 3);

  return `# Структура веток (Branches)

**Дата генерации:** ${generationDate}  
**Версия данных:** ${treeVersion}  
**Количество веток:** ${structureBranches.length}

---

## Описание

Этот документ содержит только **структурные данные** веток, без контента.

## Схема данных

\`\`\`typescript
interface BranchStructure {
  branch_id: string;
  color: string;
  icon: string;
}
\`\`\`

## Поля структуры

| Поле | Тип | Описание |
|------|-----|----------|
| \`branch_id\` | \`string\` | Уникальный идентификатор ветки |
| \`color\` | \`string\` | Цвет ветки (HEX) |
| \`icon\` | \`string\` | Иконка ветки |

## Примеры

${examples.map((branch, index) => `### Пример ${index + 1}: ${branch.branch_id}

\`\`\`json
${escapeJsonForMarkdown(branch)}
\`\`\`
`).join('\n')}

## Все ветки (структура)

${structureBranches.map((branch, index) => `### ${index + 1}. ${branch.branch_id}

- **Color**: \`${branch.color}\`
- **Icon**: \`${branch.icon}\`

`).join('\n')}

---

**См. также:**
- [05_BRANCHES_CONTENT.md](./05_BRANCHES_CONTENT.md) - Контент веток
- [06_BRANCHES_FULL.md](./06_BRANCHES_FULL.md) - Полные данные веток
`;
}

/**
 * Генерирует MD для контента веток
 */
function generateBranchesContentMD(
  branches: AbilityBranch[],
  generationDate: string,
): string {
  const branchesWithContent = branches.filter((b) => b.name || b.description);

  return `# Контент веток (Branches)

**Дата генерации:** ${generationDate}  
**Количество веток с контентом:** ${branchesWithContent.length}

---

## Описание

Этот документ содержит только **контентные данные** веток (name, description).

## Схема данных

\`\`\`typescript
interface BranchContent {
  name?: string;
  description?: string;
}
\`\`\`

## Поля контента

| Поле | Тип | Описание |
|------|-----|----------|
| \`name\` | \`string?\` | Название ветки |
| \`description\` | \`string?\` | Описание ветки |

## Все ветки (контент)

${branchesWithContent.map((branch, index) => {
  const content = extractBranchContent(branch);
  return `### ${index + 1}. ${branch.branch_id}

\`\`\`json
${escapeJsonForMarkdown(content)}
\`\`\`

`;
}).join('\n')}

---

**См. также:**
- [04_BRANCHES_STRUCTURE.md](./04_BRANCHES_STRUCTURE.md) - Структура веток
- [06_BRANCHES_FULL.md](./06_BRANCHES_FULL.md) - Полные данные веток
`;
}

/**
 * Генерирует MD для полных данных веток (структура + контент)
 */
function generateBranchesFullMD(
  branches: AbilityBranch[],
  nodes: AbilityNode[],
  generationDate: string,
): string {
  const branchesWithNodes = branches.map((branch) => {
    const structure = extractBranchStructure(branch);
    const content = extractBranchContent(branch);
    const relatedNodes = nodes.filter((node) => node.branch_id === branch.branch_id);
    return { ...structure, ...content, relatedNodes };
  });

  return `# Полные данные веток (Branches)

**Дата генерации:** ${generationDate}  
**Количество веток:** ${branches.length}

---

## Описание

Этот документ содержит **полные данные веток** (структура + контент) с связанными узлами.

## Все ветки (полные данные)

${branchesWithNodes.map((branch, index) => `### ${index + 1}. ${branch.branch_id}

**Структура:**
- **Color**: \`${branch.color}\`
- **Icon**: \`${branch.icon}\`

**Контент:**
${branch.name ? `- **Name**: ${branch.name}\n` : ''}${branch.description ? `- **Description**: ${branch.description}\n` : ''}
**Связанные узлы:** ${branch.relatedNodes.length}

${branch.relatedNodes.length > 0 ? `
| Node ID | Tier | XP Required |
|---------|------|-------------|
${branch.relatedNodes.map((node: AbilityNode) => `| \`${node.node_id}\` | \`${node.tier}\` | ${node.xp_required || 0} |`).join('\n')}
` : 'Нет связанных узлов'}

`).join('\n')}

---

**См. также:**
- [04_BRANCHES_STRUCTURE.md](./04_BRANCHES_STRUCTURE.md) - Только структура веток
- [05_BRANCHES_CONTENT.md](./05_BRANCHES_CONTENT.md) - Только контент веток
`;
}

/**
 * Генерирует MD для связей (Edges)
 */
function generateEdgesMD(
  edges: any[],
  treeVersion: string,
  generationDate: string,
): string {
  if (!edges || edges.length === 0) {
    return `# Связи (Edges)

**Дата генерации:** ${generationDate}  
**Версия данных:** ${treeVersion}

---

## Описание

Этот документ содержит данные о связях между узлами.

## Результат

**Связи не найдены** в данных дерева.

Возможно, связи не используются в текущей версии системы, или они определяются динамически на основе prerequisites.
`;
  }

  const examples = edges.slice(0, 3);

  return `# Связи (Edges)

**Дата генерации:** ${generationDate}  
**Версия данных:** ${treeVersion}  
**Количество связей:** ${edges.length}

---

## Описание

Этот документ содержит данные о **связях между узлами** (edges).

## Схема данных

\`\`\`typescript
interface Edge {
  source: string;  // node_id источника
  target: string;  // node_id цели
  type?: string;   // тип связи
  weight?: number; // вес связи
}
\`\`\`

## Примеры

${examples.map((edge, index) => `### Пример ${index + 1}

\`\`\`json
${escapeJsonForMarkdown(edge)}
\`\`\`
`).join('\n')}

## Все связи

${edges.map((edge, index) => `### ${index + 1}. Связь ${edge.source} → ${edge.target}

\`\`\`json
${escapeJsonForMarkdown(edge)}
\`\`\`

`).join('\n')}

---
`;
}

// ============================================================================
// ФУНКЦИИ ГЕНЕРАЦИИ MD ДЛЯ QUESTS И CASES
// ============================================================================

function generateQuestsStructureMD(quests: QuestFromDB[], generationDate: string): string {
  const structureQuests = quests.map(extractQuestStructure);
  const examples = structureQuests.slice(0, 3);
  const statsByType = structureQuests.reduce((acc, quest) => {
    acc[quest.type] = (acc[quest.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const statsBySource = structureQuests.reduce((acc, quest) => {
    const source = quest.source || 'unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return `# Структура квестов (Quests)

**Дата генерации:** ${generationDate}  
**Количество квестов:** ${structureQuests.length}

---

## Описание

Этот документ содержит только **структурные данные** квестов из БД, без контента и пользовательских данных.

## Схема данных

\`\`\`typescript
interface QuestStructure {
  id: string;
  type: string;
  source: string | null;
  branch: string | null;
  linked_nodes: string[];
  tags: string[];
  created_at: Date;
  updated_at: Date;
}
\`\`\`

## Поля структуры

| Поле | Тип | Описание |
|------|-----|----------|
| \`id\` | \`string\` | Уникальный идентификатор квеста |
| \`type\` | \`string\` | Тип квеста (micro, weekly, story, in-person) |
| \`source\` | \`string \| null\` | Источник квеста (base_template, auto_generated, user_generated) |
| \`branch\` | \`string \| null\` | Ветка способностей, к которой относится квест |
| \`linked_nodes\` | \`string[]\` | Список node_id связанных узлов |
| \`tags\` | \`string[]\` | Теги квеста |
| \`created_at\` | \`Date\` | Дата создания |
| \`updated_at\` | \`Date\` | Дата обновления |

## Статистика

### По типу (type)

${Object.entries(statsByType).map(([type, count]) => `- **${type}**: ${count} квестов`).join('\n')}

### По источнику (source)

${Object.entries(statsBySource).map(([source, count]) => `- **${source}**: ${count} квестов`).join('\n')}

## Примеры

${examples.map((quest, index) => `### Пример ${index + 1}: ${quest.id}

\`\`\`json
${escapeJsonForMarkdown({
  id: quest.id,
  type: quest.type,
  source: quest.source,
  branch: quest.branch,
  linked_nodes: quest.linked_nodes,
  tags: quest.tags,
  created_at: quest.created_at.toISOString(),
  updated_at: quest.updated_at.toISOString(),
})}
\`\`\`
`).join('\n')}

## Все квесты (структура)

${structureQuests.map((quest, index) => `### ${index + 1}. ${quest.id}

- **Type**: \`${quest.type}\`
- **Source**: \`${quest.source || 'unknown'}\`
- **Branch**: ${quest.branch ? `\`${quest.branch}\`` : 'нет'}
- **Linked Nodes**: ${quest.linked_nodes.length > 0 ? quest.linked_nodes.map(n => `\`${n}\``).join(', ') : 'нет'}
- **Tags**: ${quest.tags.length > 0 ? quest.tags.join(', ') : 'нет'}
- **Created**: ${quest.created_at.toISOString().split('T')[0]}
- **Updated**: ${quest.updated_at.toISOString().split('T')[0]}

`).join('\n')}

---

**См. также:**
- [09_QUESTS_CONTENT.md](./09_QUESTS_CONTENT.md) - Контент квестов
- [10_QUESTS_FULL.md](./10_QUESTS_FULL.md) - Полные данные квестов
`;
}

function generateQuestsContentMD(questTemplates: QuestTemplatesData, generationDate: string): string {
  const templates = questTemplates.quest_templates;
  const examples = templates.slice(0, 3);
  const statsByType = templates.reduce((acc, template) => {
    acc[template.type] = (acc[template.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const templatesWithTheory = templates.filter((t) => t.criteria?.theory_and_examples);
  const templatesWithSteps = templates.filter((t) => t.steps && t.steps.length > 0);
  return `# Контент квестов (Quests)

**Дата генерации:** ${generationDate}  
**Количество шаблонов квестов:** ${templates.length}

---

## Описание

Этот документ содержит только **контентные данные** квестов из \`quest-templates.json\`.

## Схема данных

\`\`\`typescript
interface QuestContent {
  id: string;
  title: string;
  description: string;
  type: string;
  steps?: Array<{ order: number; title: string | null; description: string }>;
  criteria?: { type: string; items?: string[]; theory_and_examples?: string };
  reward?: { xp?: number; skill_xp?: number; nodes?: Record<string, any> };
  linked_nodes?: string[];
  tags?: string[];
  estimated_duration_days?: number;
}
\`\`\`

## Поля контента

| Поле | Тип | Описание |
|------|-----|----------|
| \`id\` | \`string\` | Уникальный идентификатор квеста |
| \`title\` | \`string\` | Название квеста |
| \`description\` | \`string\` | Описание квеста |
| \`type\` | \`string\` | Тип квеста (micro, weekly, story, in-person) |
| \`steps\` | \`Array?\` | Массив шагов квеста |
| \`criteria\` | \`object?\` | Критерии выполнения (type, items, theory_and_examples) |
| \`reward\` | \`object?\` | Награда за выполнение (xp, skill_xp, nodes) |
| \`linked_nodes\` | \`string[]?\` | Список node_id связанных узлов |
| \`tags\` | \`string[]?\` | Теги квеста |
| \`estimated_duration_days\` | \`number?\` | Оценочная длительность в днях |

## Статистика

- **Всего шаблонов квестов**: ${templates.length}
- **Квестов с теорией и примерами**: ${templatesWithTheory.length}
- **Квестов со шагами**: ${templatesWithSteps.length}

### По типу (type)

${Object.entries(statsByType).map(([type, count]) => `- **${type}**: ${count} квестов`).join('\n')}

## Примеры

${examples.map((template, index) => `### Пример ${index + 1}: ${template.id}

**Title**: ${template.title}  
**Type**: \`${template.type}\`  
**Description**: ${template.description.substring(0, 200)}${template.description.length > 200 ? '...' : ''}

\`\`\`json
${escapeJsonForMarkdown(extractQuestContent(template))}
\`\`\`
`).join('\n')}

## Все квесты (контент)

${templates.map((template, index) => {
  const content = extractQuestContent(template);
  return `### ${index + 1}. ${template.id}

- **Title**: ${template.title}
- **Type**: \`${template.type}\`
- **Description**: ${template.description.substring(0, 150)}${template.description.length > 150 ? '...' : ''}
${template.steps && template.steps.length > 0 ? `- **Steps**: ${template.steps.length} шагов\n` : ''}${template.criteria ? `- **Criteria**: ${template.criteria.items ? `${template.criteria.items.length} критериев` : 'настроено'}\n` : ''}${template.criteria?.theory_and_examples ? `- **Theory**: есть (${template.criteria.theory_and_examples.length} символов)\n` : ''}${template.reward ? `- **Reward**: ${template.reward.xp || 0} XP\n` : ''}${template.linked_nodes && template.linked_nodes.length > 0 ? `- **Linked Nodes**: ${template.linked_nodes.map(n => `\`${n}\``).join(', ')}\n` : ''}${template.tags && template.tags.length > 0 ? `- **Tags**: ${template.tags.join(', ')}\n` : ''}${template.estimated_duration_days ? `- **Duration**: ${template.estimated_duration_days} дней\n` : ''}
`;
}).join('\n')}

---

**См. также:**
- [08_QUESTS_STRUCTURE.md](./08_QUESTS_STRUCTURE.md) - Структура квестов
- [10_QUESTS_FULL.md](./10_QUESTS_FULL.md) - Полные данные квестов
`;
}

function generateQuestsFullMD(quests: QuestFromDB[], questTemplates: QuestTemplatesData | null, generationDate: string): string {
  const templatesMap = questTemplates ? new Map(questTemplates.quest_templates.map((t) => [t.id, t])) : new Map<string, QuestTemplate>();
  const questsByType = quests.reduce((acc, quest) => {
    if (!acc[quest.type]) {
      acc[quest.type] = [];
    }
    acc[quest.type].push(quest);
    return acc;
  }, {} as Record<string, QuestFromDB[]>);
  const questsBySource = quests.reduce((acc, quest) => {
    const source = quest.source || 'unknown';
    if (!acc[source]) {
      acc[source] = [];
    }
    acc[source].push(quest);
    return acc;
  }, {} as Record<string, QuestFromDB[]>);
  return `# Полные данные квестов (Quests)

**Дата генерации:** ${generationDate}  
**Количество квестов:** ${quests.length}  
**Количество шаблонов:** ${questTemplates?.quest_templates.length || 0}

---

## Описание

Этот документ содержит **полные данные квестов** (структура + контент), объединенные для валидации.

## Структура

Данные сгруппированы по:
1. **Типу** (type) - micro, weekly, story, in-person
2. **Источнику** (source) - base_template, auto_generated, user_generated

## По типу

${Object.entries(questsByType)
  .map(([type, typeQuests]) => `
### ${type}

**Количество квестов:** ${typeQuests.length}

${typeQuests.map((quest, index) => {
    const structure = extractQuestStructure(quest);
    const template = templatesMap.get(quest.id);
    const content = template ? extractQuestContent(template) : null;
    return `#### ${index + 1}. ${quest.id}

**Структура:**
\`\`\`json
${escapeJsonForMarkdown({
  id: structure.id,
  type: structure.type,
  source: structure.source,
  branch: structure.branch,
  linked_nodes: structure.linked_nodes,
  tags: structure.tags,
  created_at: structure.created_at.toISOString(),
  updated_at: structure.updated_at.toISOString(),
})}
\`\`\`

${content ? `**Контент:**
- **Title**: ${content.title}
- **Description**: ${content.description.substring(0, 200)}${content.description.length > 200 ? '...' : ''}
${content.steps && content.steps.length > 0 ? `- **Steps**: ${content.steps.length} шагов\n` : ''}${content.criteria ? `- **Criteria**: ${content.criteria.items ? `${content.criteria.items.length} критериев` : 'настроено'}\n` : ''}${content.reward ? `- **Reward**: ${content.reward.xp || 0} XP\n` : ''}
` : '**Контент:** не найден в шаблонах'}
`;
  }).join('\n')}
`,
  ).join('\n')}

## По источнику

${Object.entries(questsBySource)
  .map(([source, sourceQuests]) => `
### ${source}

**Количество квестов:** ${sourceQuests.length}

| ID | Type | Branch | Linked Nodes | Tags |
|----|------|--------|--------------|------|
${sourceQuests.map((quest) => {
    const structure = extractQuestStructure(quest);
    return `| \`${quest.id}\` | \`${structure.type}\` | ${structure.branch ? `\`${structure.branch}\`` : 'нет'} | ${structure.linked_nodes.length} | ${structure.tags.length} |`;
  }).join('\n')}
`,
  ).join('\n')}

---

**См. также:**
- [08_QUESTS_STRUCTURE.md](./08_QUESTS_STRUCTURE.md) - Только структура квестов
- [09_QUESTS_CONTENT.md](./09_QUESTS_CONTENT.md) - Только контент квестов
`;
}

function generateCasesStructureMD(cases: InteractiveCase[], generationDate: string): string {
  const structureCases = cases.map(extractCaseStructure);
  const examples = structureCases.slice(0, 3);
  const statsByDifficulty = structureCases.reduce((acc, case_) => {
    acc[case_.difficulty] = (acc[case_.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const statsByBranch = structureCases.reduce((acc, case_) => {
    const branchId = case_.branch_id || 'unknown';
    acc[branchId] = (acc[branchId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const statsByNode = structureCases.reduce((acc, case_) => {
    const nodeId = case_.node_id || 'unknown';
    acc[nodeId] = (acc[nodeId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return `# Структура кейсов (Cases)

**Дата генерации:** ${generationDate}  
**Количество кейсов:** ${structureCases.length}

---

## Описание

Этот документ содержит только **структурные данные** кейсов из \`interactive-cases.json\`.

## Схема данных

\`\`\`typescript
interface CaseStructure {
  id: string;
  node_id: string;
  branch_id: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  indicators: {
    trust: string;
    risk: string;
    time: string;
  };
}
\`\`\`

## Поля структуры

| Поле | Тип | Описание |
|------|-----|----------|
| \`id\` | \`string\` | Уникальный идентификатор кейса |
| \`node_id\` | \`string\` | ID узла, к которому привязан кейс |
| \`branch_id\` | \`string\` | ID ветки, к которой относится кейс |
| \`difficulty\` | \`'basic' \| 'intermediate' \| 'advanced'\` | Уровень сложности кейса |
| \`indicators\` | \`object\` | Индикаторы (trust, risk, time) |

## Статистика

### По сложности (difficulty)

${Object.entries(statsByDifficulty).map(([difficulty, count]) => `- **${difficulty}**: ${count} кейсов`).join('\n')}

### По веткам (branch_id)

${Object.entries(statsByBranch).map(([branchId, count]) => `- **${branchId}**: ${count} кейсов`).join('\n')}

### По узлам (node_id)

${Object.entries(statsByNode).map(([nodeId, count]) => `- **${nodeId}**: ${count} кейсов`).join('\n')}

## Примеры

${examples.map((case_, index) => `### Пример ${index + 1}: ${case_.id}

\`\`\`json
${escapeJsonForMarkdown(case_)}
\`\`\`
`).join('\n')}

## Все кейсы (структура)

${structureCases.map((case_, index) => `### ${index + 1}. ${case_.id}

- **Node ID**: \`${case_.node_id || 'нет'}\`
- **Branch ID**: \`${case_.branch_id || 'нет'}\`
- **Difficulty**: \`${case_.difficulty}\`
${case_.indicators ? `- **Indicators**: ${case_.indicators.trust ? `trust=\`${case_.indicators.trust}\`` : ''}${case_.indicators.risk ? `, risk=\`${case_.indicators.risk}\`` : ''}${case_.indicators.time ? `, time=\`${case_.indicators.time}\`` : ''}` : '- **Indicators**: не указаны'}

`).join('\n')}

---

**См. также:**
- [12_CASES_CONTENT.md](./12_CASES_CONTENT.md) - Контент кейсов
- [13_CASES_FULL.md](./13_CASES_FULL.md) - Полные данные кейсов
`;
}

function generateCasesContentMD(cases: InteractiveCase[], generationDate: string): string {
  const examples = cases.slice(0, 3);
  const casesWithReflection = cases.filter((c) => c.reflection && c.reflection.questions && c.reflection.questions.length > 0);
  const casesWithOptions = cases.filter((c) => c.options && c.options.length > 0);
  const avgOptionsPerCase = casesWithOptions.length > 0 ? casesWithOptions.reduce((sum, c) => sum + c.options.length, 0) / casesWithOptions.length : 0;
  return `# Контент кейсов (Cases)

**Дата генерации:** ${generationDate}  
**Количество кейсов с контентом:** ${cases.length}

---

## Описание

Этот документ содержит только **контентные данные** кейсов из \`interactive-cases.json\`.

## Схема данных

\`\`\`typescript
interface CaseContent {
  title: string;
  context: string;
  options: Array<{
    id: string;
    text: string;
    skill_used: string;
    consequence: { immediate: string; second_order: string; systemic: string };
    sm_impact?: Record<string, number>;
    hint?: string;
    warning?: string;
    explanation?: string;
  }>;
  reflection: {
    questions: string[];
    mirror: Record<string, string>;
  };
}
\`\`\`

## Поля контента

| Поле | Тип | Описание |
|------|-----|----------|
| \`title\` | \`string\` | Название кейса |
| \`context\` | \`string\` | Контекст ситуации (полное описание) |
| \`options\` | \`Array\` | Массив вариантов решения (A, B, C, D и т.д.) |
| \`reflection\` | \`object\` | Рефлексия (questions, mirror) |

## Статистика

- **Всего кейсов с контентом**: ${cases.length}
- **Кейсов с рефлексией**: ${casesWithReflection.length}
- **Кейсов с опциями**: ${casesWithOptions.length}
- **Среднее количество опций на кейс**: ${avgOptionsPerCase.toFixed(1)}

## Примеры

${examples.map((case_, index) => {
  const content = extractCaseContent(case_);
  return `### Пример ${index + 1}: ${case_.id}

**Title**: ${case_.title}  
**Node ID**: \`${case_.node_id || 'нет'}\`  
**Branch ID**: \`${case_.branch_id || 'нет'}\`  
**Difficulty**: \`${case_.difficulty}\`  
**Context**: ${case_.context.substring(0, 200)}${case_.context.length > 200 ? '...' : ''}  
**Options**: ${case_.options.length} вариантов

\`\`\`json
${escapeJsonForMarkdown(content)}
\`\`\`
`;
}).join('\n')}

## Все кейсы (контент)

${cases.map((case_, index) => {
  const content = extractCaseContent(case_);
  return `### ${index + 1}. ${case_.id}

- **Title**: ${case_.title}
- **Node ID**: \`${case_.node_id || 'нет'}\`  
- **Branch ID**: \`${case_.branch_id || 'нет'}\`  
- **Difficulty**: \`${case_.difficulty}\`
- **Context**: ${case_.context.length} символов
- **Options**: ${case_.options.length} вариантов (${case_.options.map((o) => o.id).join(', ')})
${case_.reflection ? `- **Reflection Questions**: ${case_.reflection.questions?.length || 0} вопросов\n${case_.reflection.mirror ? `- **Reflection Mirror**: ${Object.keys(case_.reflection.mirror).length} вариантов\n` : ''}` : '- **Reflection**: не указана'}

`;
}).join('\n')}

---

**См. также:**
- [11_CASES_STRUCTURE.md](./11_CASES_STRUCTURE.md) - Структура кейсов
- [13_CASES_FULL.md](./13_CASES_FULL.md) - Полные данные кейсов
`;
}

function generateCasesFullMD(cases: InteractiveCase[], generationDate: string): string {
  const casesByDifficulty = cases.reduce((acc, case_) => {
    if (!acc[case_.difficulty]) {
      acc[case_.difficulty] = [];
    }
    acc[case_.difficulty].push(case_);
    return acc;
  }, {} as Record<string, InteractiveCase[]>);
  const casesByBranch = cases.reduce((acc, case_) => {
    const branchId = case_.branch_id || 'unknown';
    if (!acc[branchId]) {
      acc[branchId] = [];
    }
    acc[branchId].push(case_);
    return acc;
  }, {} as Record<string, InteractiveCase[]>);
  const casesByNode = cases.reduce((acc, case_) => {
    const nodeId = case_.node_id || 'unknown';
    if (!acc[nodeId]) {
      acc[nodeId] = [];
    }
    acc[nodeId].push(case_);
    return acc;
  }, {} as Record<string, InteractiveCase[]>);
  return `# Полные данные кейсов (Cases)

**Дата генерации:** ${generationDate}  
**Количество кейсов:** ${cases.length}

---

## Описание

Этот документ содержит **полные данные кейсов** (структура + контент) для валидации.

## Структура

Данные сгруппированы по:
1. **Сложности** (difficulty) - basic, intermediate, advanced
2. **Веткам** (branch_id) - группы кейсов по областям развития
3. **Узлам** (node_id) - кейсы, связанные с конкретными узлами

## По сложности

${Object.entries(casesByDifficulty)
  .map(([difficulty, difficultyCases]) => `
### ${difficulty}

**Количество кейсов:** ${difficultyCases.length}

${difficultyCases.map((case_, index) => {
    const structure = extractCaseStructure(case_);
    const content = extractCaseContent(case_);
    return `#### ${index + 1}. ${case_.id}

**Структура:**
\`\`\`json
${escapeJsonForMarkdown(structure)}
\`\`\`

**Контент:**
- **Title**: ${content.title}
- **Context**: ${content.context.substring(0, 300)}${content.context.length > 300 ? '...' : ''}
- **Options**: ${content.options.length} вариантов
  ${content.options.map((opt) => `
  - **${opt.id}**: ${opt.text}${opt.skill_used ? ` (${opt.skill_used})` : ''}
    - Immediate: ${opt.consequence.immediate}
    - Second Order: ${opt.consequence.second_order}
    - Systemic: ${opt.consequence.systemic}
  `).join('')}
${content.reflection ? `- **Reflection**: ${content.reflection.questions?.length || 0} вопросов` : '- **Reflection**: не указана'}

`;
}).join('\n')}
`,
  ).join('\n')}

## По веткам

${Object.entries(casesByBranch)
  .map(([branchId, branchCases]) => `
### ${branchId}

**Количество кейсов:** ${branchCases.length}

| ID | Title | Node ID | Difficulty | Options |
|----|-------|---------|------------|---------|
${branchCases.map((case_) => `| \`${case_.id}\` | ${case_.title} | \`${case_.node_id || 'нет'}\` | \`${case_.difficulty}\` | ${case_.options.length} |`).join('\n')}
`,
  ).join('\n')}

## По узлам

${Object.entries(casesByNode)
  .map(([nodeId, nodeCases]) => `
### ${nodeId}

**Количество кейсов:** ${nodeCases.length}

${nodeCases.map((case_) => {
    const structure = extractCaseStructure(case_);
    const content = extractCaseContent(case_);
    return `#### ${case_.id}: ${case_.title}

- **Branch ID**: \`${structure.branch_id || 'нет'}\`
- **Difficulty**: \`${structure.difficulty}\`
${structure.indicators ? `- **Indicators**: ${structure.indicators.trust ? `trust=\`${structure.indicators.trust}\`` : ''}${structure.indicators.risk ? `, risk=\`${structure.indicators.risk}\`` : ''}${structure.indicators.time ? `, time=\`${structure.indicators.time}\`` : ''}` : '- **Indicators**: не указаны'}
- **Context**: ${content.context.substring(0, 200)}${content.context.length > 200 ? '...' : ''}
- **Options**: ${content.options.length} вариантов

`;
  }).join('\n')}
`,
  ).join('\n')}

---

**См. также:**
- [11_CASES_STRUCTURE.md](./11_CASES_STRUCTURE.md) - Только структура кейсов
- [12_CASES_CONTENT.md](./12_CASES_CONTENT.md) - Только контент кейсов
`;
}

/**
 * Генерирует summary файл
 */
function generateSummaryMD(
  tree: SemanticTree,
  nodeDescriptions: NodeDescriptionsData | null,
  generationDate: string,
  quests?: QuestFromDB[],
  questTemplates?: QuestTemplatesData | null,
  cases?: InteractiveCase[],
): string {
  const nodesByTier = tree.nodes.reduce((acc, node) => {
    acc[node.tier] = (acc[node.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const nodesByBranch = tree.nodes.reduce((acc, node) => {
    acc[node.branch_id] = (acc[node.branch_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const nodesWithContent = nodeDescriptions
    ? Object.keys(nodeDescriptions.node_descriptions).length
    : 0;

  // Статистика по квестам
  const questsByType = quests?.reduce((acc, quest) => {
    acc[quest.type] = (acc[quest.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const questsBySource = quests?.reduce((acc, quest) => {
    const source = quest.source || 'unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const questsWithTemplates = questTemplates?.quest_templates.length || 0;

  // Статистика по кейсам
  const casesByDifficulty = cases?.reduce((acc, case_) => {
    acc[case_.difficulty] = (acc[case_.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const casesByBranch = cases?.reduce((acc, case_) => {
    const branchId = case_.branch_id || 'unknown';
    acc[branchId] = (acc[branchId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return `# Сводка данных для валидации

**Дата генерации:** ${generationDate}  
**Версия данных:** ${tree.semantic_version || 'unknown'}  
**Tree Revision:** ${tree.tree_revision || 'unknown'}  
**Seed Version:** ${tree.seed_version || 'unknown'}

---

## Общая информация

Этот документ содержит общую информацию о всех данных дерева способностей, извлеченных для валидации.

## Статистика

### Узлы (Nodes)

- **Всего узлов**: ${tree.nodes.length}
- **Узлов с контентом**: ${nodesWithContent}
- **Узлов без контента**: ${tree.nodes.length - nodesWithContent}

**По уровням (tier):**
${Object.entries(nodesByTier)
  .map(([tier, count]) => `- **${tier}**: ${count} узлов`)
  .join('\n')}

**По веткам (branch_id):**
${Object.entries(nodesByBranch)
  .map(([branchId, count]) => `- **${branchId}**: ${count} узлов`)
  .join('\n')}

### Ветки (Branches)

- **Всего веток**: ${tree.branches.length}

| Branch ID | Узлов | Узлов с контентом |
|-----------|-------|-------------------|
${Object.entries(nodesByBranch)
  .map(([branchId, count]) => {
    const nodesWithContentInBranch = nodeDescriptions
      ? tree.nodes.filter((node) => node.branch_id === branchId && nodeDescriptions.node_descriptions[node.node_id])
          .length
      : 0;
    return `| \`${branchId}\` | ${count} | ${nodesWithContentInBranch} |`;
  })
  .join('\n')}

### Связи (Edges)

- **Всего связей**: ${tree.edges?.length || 0}

${tree.edges && tree.edges.length > 0 ? 'Связи найдены в данных.' : 'Связи не найдены в данных. Возможно, они определяются динамически на основе prerequisites.'}

### Квесты (Quests)

- **Всего квестов**: ${quests?.length || 0}
- **Шаблонов квестов**: ${questsWithTemplates}

**По типу (type):**
${Object.entries(questsByType).map(([type, count]) => `- **${type}**: ${count} квестов`).join('\n')}

**По источнику (source):**
${Object.entries(questsBySource).map(([source, count]) => `- **${source}**: ${count} квестов`).join('\n')}

### Кейсы (Cases)

- **Всего кейсов**: ${cases?.length || 0}

**По сложности (difficulty):**
${Object.entries(casesByDifficulty).map(([difficulty, count]) => `- **${difficulty}**: ${count} кейсов`).join('\n')}

**По веткам (branch_id):**
${Object.entries(casesByBranch).map(([branchId, count]) => `- **${branchId}**: ${count} кейсов`).join('\n')}

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
`;
}

/**
 * Главная функция
 */
async function main() {
  console.log('📋 Генерация MD-документов для валидации данных...\n');

  try {
    // 1. Загружаем данные
    console.log('1️⃣  Загрузка данных из БД...');
    const tree = await loadTreeData();
    if (!tree) {
      console.error('❌ Не удалось загрузить данные из БД.');
      process.exit(1);
    }
    console.log(`   ✅ Загружено: ${tree.nodes.length} узлов, ${tree.branches.length} веток`);

    console.log('\n2️⃣  Загрузка контента из node-descriptions.json...');
    const nodeDescriptions = loadContentData();
    if (nodeDescriptions) {
      console.log(`   ✅ Загружено: ${Object.keys(nodeDescriptions.node_descriptions).length} узлов с контентом`);
    } else {
      console.log('   ⚠️  node-descriptions.json не найден, будет использован контент из БД');
    }

    console.log('\n3️⃣  Загрузка квестов из БД...');
    const quests = await loadQuestsData();
    console.log(`   ✅ Загружено: ${quests.length} квестов`);

    console.log('\n4️⃣  Загрузка шаблонов квестов из quest-templates.json...');
    const questTemplates = loadQuestTemplates();
    if (questTemplates) {
      console.log(`   ✅ Загружено: ${questTemplates.quest_templates.length} шаблонов квестов`);
    } else {
      console.log('   ⚠️  quest-templates.json не найден');
    }

    console.log('\n5️⃣  Загрузка кейсов из interactive-cases.json...');
    const casesData = loadCasesData();
    const cases = casesData ? casesData.interactive_cases : [];
    if (casesData) {
      console.log(`   ✅ Загружено: ${cases.length} кейсов`);
    } else {
      console.log('   ⚠️  interactive-cases.json не найден');
    }

    // 6. Создаем директорию
    console.log('\n6️⃣  Создание директории для документов...');
    const outputDir = path.join(__dirname, '../docs/migration/validation');
    ensureDirectoryExists(outputDir);
    console.log(`   ✅ Директория создана: ${outputDir}`);

    // 7. Генерируем MD-файлы
    console.log('\n7️⃣  Генерация MD-документов...');
    const generationDate = formatDate(new Date());
    const treeVersion = tree.semantic_version || `${tree.tree_revision || 'unknown'}`;

    const files = [
      {
        name: '00_SUMMARY.md',
        content: generateSummaryMD(tree, nodeDescriptions, generationDate, quests, questTemplates, cases),
      },
      { name: '01_NODES_STRUCTURE.md', content: generateNodesStructureMD(tree.nodes, treeVersion, generationDate) },
      {
        name: '02_NODES_CONTENT.md',
        content: nodeDescriptions
          ? generateNodesContentMD(nodeDescriptions, generationDate)
          : generateNodesContentMD({ node_descriptions: {} }, generationDate),
      },
      {
        name: '03_NODES_FULL.md',
        content: generateNodesFullMD(tree.nodes, nodeDescriptions, treeVersion, generationDate),
      },
      { name: '04_BRANCHES_STRUCTURE.md', content: generateBranchesStructureMD(tree.branches, treeVersion, generationDate) },
      { name: '05_BRANCHES_CONTENT.md', content: generateBranchesContentMD(tree.branches, generationDate) },
      { name: '06_BRANCHES_FULL.md', content: generateBranchesFullMD(tree.branches, tree.nodes, generationDate) },
      { name: '07_EDGES.md', content: generateEdgesMD(tree.edges || [], treeVersion, generationDate) },
      { name: '08_QUESTS_STRUCTURE.md', content: generateQuestsStructureMD(quests, generationDate) },
      {
        name: '09_QUESTS_CONTENT.md',
        content: questTemplates
          ? generateQuestsContentMD(questTemplates, generationDate)
          : '# Контент квестов (Quests)\n\n⚠️ quest-templates.json не найден.',
      },
      { name: '10_QUESTS_FULL.md', content: generateQuestsFullMD(quests, questTemplates, generationDate) },
      { name: '11_CASES_STRUCTURE.md', content: generateCasesStructureMD(cases, generationDate) },
      { name: '12_CASES_CONTENT.md', content: generateCasesContentMD(cases, generationDate) },
      { name: '13_CASES_FULL.md', content: generateCasesFullMD(cases, generationDate) },
    ];

    for (const file of files) {
      const filePath = path.join(outputDir, file.name);
      fs.writeFileSync(filePath, file.content, 'utf-8');
      console.log(`   ✅ Создан: ${file.name}`);
    }

    // 8. Заменяем файлы в reports/ на новые выгрузки
    console.log('\n8️⃣  Замена файлов в reports/ на новые выгрузки...');
    const reportsDir = path.join(__dirname, '../reports');
    ensureDirectoryExists(reportsDir);

    // Копируем файлы для замены в reports/
    const reportsReplacements: Array<{ source: string; target: string; description: string }> = [
      {
        source: path.join(outputDir, '00_SUMMARY.md'),
        target: path.join(reportsDir, 'content-analysis-summary.md'),
        description: 'Summary заменен на новую выгрузку',
      },
      {
        source: path.join(outputDir, '09_QUESTS_CONTENT.md'),
        target: path.join(reportsDir, 'content-analysis-quests.md'),
        description: 'Quests заменен на новую выгрузку контента',
      },
      {
        source: path.join(outputDir, '12_CASES_CONTENT.md'),
        target: path.join(reportsDir, 'content-analysis-cases-part1.md'),
        description: 'Cases часть 1 заменена на новую выгрузку контента',
      },
      {
        source: path.join(outputDir, '13_CASES_FULL.md'),
        target: path.join(reportsDir, 'content-analysis-cases-part2.md'),
        description: 'Cases часть 2 заменена на новую выгрузку полных данных',
      },
    ];

    for (const replacement of reportsReplacements) {
      if (fs.existsSync(replacement.source)) {
        fs.copyFileSync(replacement.source, replacement.target);
        console.log(`   ✅ ${replacement.description}: ${path.basename(replacement.target)}`);
      } else {
        console.log(`   ⚠️  Файл не найден: ${replacement.source}`);
      }
    }

    // Удаляем старые части cases, которые были объединены
    const oldCasesFiles = [
      path.join(reportsDir, 'content-analysis-cases-part3.md'),
    ];
    for (const oldFile of oldCasesFiles) {
      if (fs.existsSync(oldFile)) {
        fs.unlinkSync(oldFile);
        console.log(`   ✅ Удален старый файл: ${path.basename(oldFile)}`);
      }
    }

    console.log('\n✅ Все MD-документы успешно созданы!');
    console.log(`\n📁 Расположение валидации: ${outputDir}`);
    console.log(`📁 Расположение отчетов: ${reportsDir}`);
  } catch (error: any) {
    console.error('\n❌ Ошибка при генерации документов:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем скрипт
main();
