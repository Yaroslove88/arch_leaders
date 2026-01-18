#!/usr/bin/env ts-node

/**
 * Скрипт для анализа полноты контента всех объектов проекта
 * Проверяет все поля (обязательные и опциональные) и генерирует markdown отчеты
 */

import * as fs from 'fs';
import * as path from 'path';

// Типы данных
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
  development_type?: 'practice' | 'reflection' | 'theory' | 'mixed';
  situation_guidance?: string;
  reflection_prompts?: string[];
  related_quests?: string[];
  [key: string]: any;
}

interface AbilityNode {
  node_id: string;
  name: string;
  description: string;
  branch_id: string;
  tier: 'basic' | 'intermediate' | 'advanced';
  state?: string;
  unlock_conditions?: any;
  integration_level?: string;
  development_type?: string;
  xp_required?: number;
  xp_current?: number;
  prerequisites?: string[]; // Может быть в Prisma, но не в JSON
  branch?: string; // Может быть в Prisma как branch, но в JSON это branch_id
  title?: string; // Может быть в Prisma, но в JSON это name
  level?: string; // Может быть в Prisma, но в JSON это tier
}

interface AbilityBranch {
  branch_id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'micro' | 'weekly' | 'story' | 'in-person';
  steps?: Array<{ order: number; title: string | null; description: string }>;
  criteria: {
    type: 'count' | 'evidence' | 'streak' | 'custom';
    target?: number;
    description?: string;
    items?: string[];
    theory_and_examples?: string;
  };
  reward?: {
    xp?: number;
    skill_xp?: number;
    artifact?: string;
  };
  linked_nodes?: string[];
  tags?: string[];
  source?: string;
  due_hint?: string;
  estimated_duration_days?: number;
}

interface CaseOption {
  id: string;
  text: string;
  skill_used?: string;
  consequence: {
    immediate: string;
    second_order: string;
    systemic: string;
  };
  sm_impact?: {
    C?: number;
    K?: number;
    R?: number;
    S?: number;
    F?: number;
  };
  hint?: string;
  warning?: string;
  explanation?: string;
}

interface InteractiveCase {
  id: string;
  title: string;
  node_id?: string;
  branch_id?: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  context: string;
  indicators?: {
    trust?: 'low' | 'medium' | 'high' | 'critical';
    risk?: 'low' | 'medium' | 'high' | 'critical';
    time?: 'low' | 'medium' | 'high' | 'critical';
    chaos?: 'low' | 'medium' | 'high' | 'critical';
    autonomy?: 'low' | 'medium' | 'high' | 'critical';
    speed?: 'low' | 'medium' | 'high' | 'critical';
    quality?: 'low' | 'medium' | 'high' | 'critical';
    uncertainty?: 'low' | 'medium' | 'high' | 'critical';
    stakes?: 'low' | 'medium' | 'high' | 'critical';
  };
  pattern?: {
    trigger: string;
    behavior: string;
    result: string;
  };
  options: CaseOption[];
  reflection: {
    questions: string[];
    mirror?: Record<string, string>;
    key_insight?: string;
  };
}

interface Build {
  build_id: string;
  name: string;
  icon: string;
  fantasy: string;
  description: string;
  entry_conditions: {
    required_nodes: string[];
    optional_nodes?: string[];
    behavioral_patterns?: Record<string, any>;
    min_required_count?: number;
  };
  bonuses: Record<string, any>;
  hidden_costs: Record<string, any>;
  exit_conditions: Record<string, any>;
  color: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  invalidFields: string[];
  content: Record<string, any>;
}

// Пути к файлам
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports');
const SEED_FILE = path.join(PROJECT_ROOT, 'packages', 'shared', 'src', 'seed', 'initial-ability-tree.json');

// Загрузка данных
function loadJSON<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

// Создание директории reports если не существует
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Загрузка всех данных
console.log('Загрузка данных...');
const treeData = loadJSON<{ branches: AbilityBranch[]; nodes: AbilityNode[] }>(SEED_FILE);
const nodeDescriptions = loadJSON<{ node_descriptions: Record<string, NodeDescription> }>(
  path.join(DATA_DIR, 'node-descriptions.json')
);
const questTemplates = loadJSON<{ quest_templates: Quest[] }>(
  path.join(DATA_DIR, 'quest-templates.json')
);
const interactiveCases = loadJSON<{ interactive_cases: InteractiveCase[] }>(
  path.join(DATA_DIR, 'interactive-cases.json')
);
const builds = loadJSON<{ builds: Build[] }>(path.join(DATA_DIR, 'builds.json'));

// Создание справочников для проверки ссылок
const nodeIds = new Set(treeData.nodes.map(n => n.node_id));
const branchIds = new Set(treeData.branches.map(b => b.branch_id));
const questIds = new Set(questTemplates.quest_templates.map(q => q.id));

console.log(`Загружено: ${treeData.nodes.length} узлов, ${treeData.branches.length} веток, ${questTemplates.quest_templates.length} квестов, ${interactiveCases.interactive_cases.length} кейсов, ${builds.builds.length} стилей`);

// Валидация узлов
function validateNode(node: AbilityNode, description: NodeDescription | undefined): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    missingFields: [],
    invalidFields: [],
    content: {}
  };

  // Обязательные поля из семантического дерева
  if (!node.node_id) result.errors.push('Отсутствует node_id');
  if (!node.branch_id) result.errors.push('Отсутствует branch_id');
  if (!node.name) result.errors.push('Отсутствует name');
  if (!node.description) result.errors.push('Отсутствует description');
  if (!node.tier) result.errors.push('Отсутствует tier');
  // prerequisites может отсутствовать в JSON (есть только в Prisma)

  // Проверка описания
  if (!description) {
    result.errors.push('Отсутствует описание в node-descriptions.json');
    result.isValid = false;
    return result;
  }

  // Обязательные поля описания
  if (!description.name) result.errors.push('Отсутствует name в описании');
  if (!description.full_description) result.errors.push('Отсутствует full_description');
  if (!description.practical_meaning) result.errors.push('Отсутствует practical_meaning');
  if (!description.examples || !Array.isArray(description.examples) || description.examples.length === 0) {
    result.errors.push('Отсутствует или пустой examples');
  }
  if (!description.integration_levels) {
    result.errors.push('Отсутствует integration_levels');
  } else {
    if (!description.integration_levels.Novice) result.errors.push('Отсутствует integration_levels.Novice');
    if (!description.integration_levels.Integrated) result.errors.push('Отсутствует integration_levels.Integrated');
    if (!description.integration_levels.Embodied) result.errors.push('Отсутствует integration_levels.Embodied');
  }

  // Опциональные поля
  if (!description.development_type) {
    result.warnings.push('Отсутствует development_type (опционально)');
  } else if (!['practice', 'reflection', 'theory', 'mixed'].includes(description.development_type)) {
    result.invalidFields.push(`development_type имеет невалидное значение: ${description.development_type}`);
  }

  if (!description.situation_guidance) {
    result.warnings.push('Отсутствует situation_guidance (опционально)');
  }

  if (!description.reflection_prompts || !Array.isArray(description.reflection_prompts) || description.reflection_prompts.length === 0) {
    if (description.development_type === 'reflection') {
      result.warnings.push('Отсутствуют reflection_prompts для reflection-узла');
    }
  }

  // Проверка ссылок
  if (!branchIds.has(node.branch_id)) {
    result.errors.push(`Невалидная ссылка на ветку: ${node.branch_id}`);
  }

  // prerequisites может быть в Prisma, но не в JSON семантического дерева
  if (node.prerequisites && Array.isArray(node.prerequisites)) {
    for (const prereq of node.prerequisites) {
      if (!nodeIds.has(prereq)) {
        result.errors.push(`Невалидная ссылка в prerequisites: ${prereq}`);
      }
    }
  }

  if (description.related_quests) {
    for (const questId of description.related_quests) {
      if (!questIds.has(questId)) {
        result.warnings.push(`Невалидная ссылка в related_quests: ${questId}`);
      }
    }
  }

  // Сохранение контента
  result.content = {
    node: node,
    description: description
  };

  result.isValid = result.errors.length === 0;
  return result;
}

// Валидация веток
function validateBranch(branch: AbilityBranch): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    missingFields: [],
    invalidFields: [],
    content: { branch }
  };

  if (!branch.branch_id) result.errors.push('Отсутствует branch_id');
  if (!branch.name) result.errors.push('Отсутствует name');
  if (!branch.description) result.errors.push('Отсутствует description');
  if (!branch.color) result.errors.push('Отсутствует color');
  if (!branch.icon) result.errors.push('Отсутствует icon');

  // Проверка формата цвета
  if (branch.color && !/^#[0-9A-Fa-f]{6}$/.test(branch.color)) {
    result.invalidFields.push(`Невалидный формат цвета: ${branch.color} (ожидается #RRGGBB)`);
  }

  // Проверка иконки
  if (branch.icon && branch.icon.trim().length === 0) {
    result.errors.push('Иконка пустая');
  }

  result.isValid = result.errors.length === 0;
  return result;
}

// Валидация квестов
function validateQuest(quest: Quest): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    missingFields: [],
    invalidFields: [],
    content: { quest }
  };

  // Обязательные поля
  if (!quest.id) result.errors.push('Отсутствует id');
  if (!quest.title) result.errors.push('Отсутствует title');
  if (quest.title && quest.title.length > 200) result.invalidFields.push(`title превышает 200 символов: ${quest.title.length}`);
  if (!quest.description) result.errors.push('Отсутствует description');
  if (quest.description && quest.description.length > 5000) result.invalidFields.push(`description превышает 5000 символов: ${quest.description.length}`);
  if (!quest.type) result.errors.push('Отсутствует type');
  if (quest.type && !['micro', 'weekly', 'story', 'in-person'].includes(quest.type)) {
    result.invalidFields.push(`Невалидный type: ${quest.type}`);
  }
  if (!quest.criteria) result.errors.push('Отсутствует criteria');
  if (quest.criteria) {
    if (!quest.criteria.type) result.errors.push('Отсутствует criteria.type');
    if (quest.criteria.type && !['count', 'evidence', 'streak', 'custom'].includes(quest.criteria.type)) {
      result.invalidFields.push(`Невалидный criteria.type: ${quest.criteria.type}`);
    }
    if (quest.criteria.type === 'custom' && (!quest.criteria.items || !Array.isArray(quest.criteria.items))) {
      result.errors.push('Для criteria.type=custom требуется criteria.items (массив)');
    }
    if ((quest.criteria.type === 'count' || quest.criteria.type === 'streak') && typeof quest.criteria.target !== 'number') {
      result.errors.push(`Для criteria.type=${quest.criteria.type} требуется criteria.target (число)`);
    }
    if (quest.criteria.target && (quest.criteria.target < 1 || quest.criteria.target > 10000)) {
      result.invalidFields.push(`criteria.target вне диапазона 1-10000: ${quest.criteria.target}`);
    }
    if (quest.criteria.description && quest.criteria.description.length > 1000) {
      result.invalidFields.push(`criteria.description превышает 1000 символов: ${quest.criteria.description.length}`);
    }
    if (quest.criteria.theory_and_examples && quest.criteria.theory_and_examples.length > 50000) {
      result.invalidFields.push(`criteria.theory_and_examples превышает 50000 символов: ${quest.criteria.theory_and_examples.length}`);
    }
  }

  // Опциональные поля
  if (quest.steps) {
    if (quest.steps.length > 100) result.invalidFields.push(`steps превышает 100 элементов: ${quest.steps.length}`);
    for (let i = 0; i < quest.steps.length; i++) {
      const step = quest.steps[i];
      if (typeof step.order !== 'number') result.errors.push(`steps[${i}].order должен быть числом`);
      if (step.title !== null && typeof step.title !== 'string') result.errors.push(`steps[${i}].title должен быть строкой или null`);
      if (!step.description || typeof step.description !== 'string') result.errors.push(`steps[${i}].description должен быть непустой строкой`);
    }
  }

  if (quest.reward) {
    if (quest.reward.xp !== undefined && (quest.reward.xp < 0 || quest.reward.xp > 100000)) {
      result.invalidFields.push(`reward.xp вне диапазона 0-100000: ${quest.reward.xp}`);
    }
    if (quest.reward.skill_xp !== undefined && (quest.reward.skill_xp < 0 || quest.reward.skill_xp > 10000)) {
      result.invalidFields.push(`reward.skill_xp вне диапазона 0-10000: ${quest.reward.skill_xp}`);
    }
    if (quest.reward.artifact && quest.reward.artifact.length > 200) {
      result.invalidFields.push(`reward.artifact превышает 200 символов: ${quest.reward.artifact.length}`);
    }
  } else {
    result.warnings.push('Отсутствует reward (опционально)');
  }

  if (quest.linked_nodes) {
    if (quest.linked_nodes.length > 10) result.invalidFields.push(`linked_nodes превышает 10 элементов: ${quest.linked_nodes.length}`);
    for (const nodeId of quest.linked_nodes) {
      if (!nodeIds.has(nodeId)) {
        result.errors.push(`Невалидная ссылка в linked_nodes: ${nodeId}`);
      }
    }
  }

  if (quest.tags) {
    if (quest.tags.length > 20) result.invalidFields.push(`tags превышает 20 элементов: ${quest.tags.length}`);
    for (const tag of quest.tags) {
      if (tag.length > 50) result.invalidFields.push(`tag превышает 50 символов: ${tag}`);
    }
  }

  if (quest.source && quest.source.length > 200) {
    result.invalidFields.push(`source превышает 200 символов: ${quest.source.length}`);
  }

  if (quest.due_hint && quest.due_hint.length > 500) {
    result.invalidFields.push(`due_hint превышает 500 символов: ${quest.due_hint.length}`);
  }

  if (quest.estimated_duration_days !== undefined && quest.estimated_duration_days <= 0) {
    result.invalidFields.push(`estimated_duration_days должно быть > 0: ${quest.estimated_duration_days}`);
  }

  result.isValid = result.errors.length === 0;
  return result;
}

// Валидация кейсов
function validateCase(caseItem: InteractiveCase): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    missingFields: [],
    invalidFields: [],
    content: { case: caseItem }
  };

  // Обязательные поля
  if (!caseItem.id) result.errors.push('Отсутствует id');
  if (!caseItem.title) result.errors.push('Отсутствует title');
  if (!caseItem.difficulty) result.errors.push('Отсутствует difficulty');
  if (caseItem.difficulty && !['basic', 'intermediate', 'advanced'].includes(caseItem.difficulty)) {
    result.invalidFields.push(`Невалидный difficulty: ${caseItem.difficulty}`);
  }
  if (!caseItem.context) result.errors.push('Отсутствует context');
  if (!caseItem.options || !Array.isArray(caseItem.options) || caseItem.options.length < 2) {
    result.errors.push('Отсутствует options или меньше 2 вариантов');
  }
  if (!caseItem.reflection || !Array.isArray(caseItem.reflection.questions) || caseItem.reflection.questions.length === 0) {
    result.errors.push('Отсутствует reflection.questions или пустой массив');
  }

  // Валидация опций
  if (caseItem.options) {
    for (let i = 0; i < caseItem.options.length; i++) {
      const option = caseItem.options[i];
      if (!option.id) result.errors.push(`options[${i}].id отсутствует`);
      if (!['A', 'B', 'C', 'D'].includes(option.id)) result.warnings.push(`options[${i}].id нестандартное значение: ${option.id}`);
      if (!option.text) result.errors.push(`options[${i}].text отсутствует`);
      if (!option.consequence) result.errors.push(`options[${i}].consequence отсутствует`);
      if (option.consequence) {
        if (!option.consequence.immediate) result.errors.push(`options[${i}].consequence.immediate отсутствует`);
        if (!option.consequence.second_order) result.errors.push(`options[${i}].consequence.second_order отсутствует`);
        if (!option.consequence.systemic) result.errors.push(`options[${i}].consequence.systemic отсутствует`);
      }
      if (option.sm_impact) {
        const validKeys = ['C', 'K', 'R', 'S', 'F'];
        for (const key of Object.keys(option.sm_impact)) {
          if (!validKeys.includes(key)) {
            result.warnings.push(`options[${i}].sm_impact содержит невалидный ключ: ${key}`);
          }
          if (typeof option.sm_impact[key as keyof typeof option.sm_impact] !== 'number') {
            result.errors.push(`options[${i}].sm_impact.${key} должен быть числом`);
          }
        }
      }
    }
  }

  // Опциональные поля
  if (caseItem.node_id && !nodeIds.has(caseItem.node_id)) {
    result.errors.push(`Невалидная ссылка node_id: ${caseItem.node_id}`);
  }

  if (caseItem.branch_id && !branchIds.has(caseItem.branch_id)) {
    result.errors.push(`Невалидная ссылка branch_id: ${caseItem.branch_id}`);
  }

  if (caseItem.indicators) {
    const validLevels = ['low', 'medium', 'high', 'critical'];
    for (const [key, value] of Object.entries(caseItem.indicators)) {
      if (!validLevels.includes(value as string)) {
        result.invalidFields.push(`indicators.${key} имеет невалидное значение: ${value}`);
      }
    }
  }

  if (caseItem.pattern) {
    if (!caseItem.pattern.trigger) result.warnings.push('pattern.trigger отсутствует');
    if (!caseItem.pattern.behavior) result.warnings.push('pattern.behavior отсутствует');
    if (!caseItem.pattern.result) result.warnings.push('pattern.result отсутствует');
  }

  if (caseItem.reflection && caseItem.reflection.mirror) {
    for (const [key, value] of Object.entries(caseItem.reflection.mirror)) {
      if (!['A', 'B', 'C', 'D'].includes(key)) {
        result.warnings.push(`reflection.mirror содержит нестандартный ключ: ${key}`);
      }
    }
  }

  result.isValid = result.errors.length === 0;
  return result;
}

// Валидация стилей
function validateBuild(build: Build): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    missingFields: [],
    invalidFields: [],
    content: { build }
  };

  // Обязательные поля
  if (!build.build_id) result.errors.push('Отсутствует build_id');
  if (!build.name) result.errors.push('Отсутствует name');
  if (!build.icon) result.errors.push('Отсутствует icon');
  if (!build.fantasy) result.errors.push('Отсутствует fantasy');
  if (!build.description) result.errors.push('Отсутствует description');
  if (!build.entry_conditions) result.errors.push('Отсутствует entry_conditions');
  if (!build.bonuses) result.errors.push('Отсутствует bonuses');
  if (!build.hidden_costs) result.errors.push('Отсутствует hidden_costs');
  if (!build.exit_conditions) result.errors.push('Отсутствует exit_conditions');
  if (!build.color) result.errors.push('Отсутствует color');

  // Проверка entry_conditions
  if (build.entry_conditions) {
    if (!Array.isArray(build.entry_conditions.required_nodes)) {
      result.errors.push('entry_conditions.required_nodes должен быть массивом');
    } else {
      if (build.entry_conditions.required_nodes.length === 0) {
        result.errors.push('entry_conditions.required_nodes не может быть пустым массивом');
      }
      for (const nodeId of build.entry_conditions.required_nodes) {
        if (!nodeIds.has(nodeId)) {
          result.errors.push(`Невалидная ссылка в entry_conditions.required_nodes: ${nodeId}`);
        }
      }
    }
    
    if (build.entry_conditions.optional_nodes) {
      if (!Array.isArray(build.entry_conditions.optional_nodes)) {
        result.errors.push('entry_conditions.optional_nodes должен быть массивом');
      } else {
        for (const nodeId of build.entry_conditions.optional_nodes) {
          if (!nodeIds.has(nodeId)) {
            result.errors.push(`Невалидная ссылка в entry_conditions.optional_nodes: ${nodeId}`);
          }
        }
      }
    }
    
    if (build.entry_conditions.min_required_count !== undefined) {
      if (typeof build.entry_conditions.min_required_count !== 'number' || build.entry_conditions.min_required_count < 1) {
        result.errors.push('entry_conditions.min_required_count должен быть числом >= 1');
      }
      if (build.entry_conditions.min_required_count > build.entry_conditions.required_nodes.length) {
        result.errors.push(`entry_conditions.min_required_count (${build.entry_conditions.min_required_count}) больше количества required_nodes (${build.entry_conditions.required_nodes.length})`);
      }
    } else {
      // Если не указано, по умолчанию должно быть равно количеству required_nodes
      result.warnings.push('entry_conditions.min_required_count отсутствует, будет использовано значение по умолчанию (все required_nodes)');
    }
    
    if (!build.entry_conditions.behavioral_patterns) {
      result.warnings.push('entry_conditions.behavioral_patterns отсутствует (опционально)');
    }
  }

  // Проверка формата цвета
  if (build.color && !/^#[0-9A-Fa-f]{6}$/.test(build.color)) {
    result.invalidFields.push(`Невалидный формат цвета: ${build.color} (ожидается #RRGGBB)`);
  }

  result.isValid = result.errors.length === 0;
  return result;
}

// Генерация markdown отчета
function generateMarkdownReport(
  title: string,
  items: Array<{ id: string; name: string; result: ValidationResult }>,
  itemType: string
): string {
  let md = `# ${title}\n\n`;
  md += `*Дата анализа: ${new Date().toLocaleString('ru-RU')}*\n\n`;

  // Сводная статистика
  const total = items.length;
  const valid = items.filter(i => i.result.isValid && i.result.warnings.length === 0).length;
  const withWarnings = items.filter(i => i.result.isValid && i.result.warnings.length > 0).length;
  const invalid = items.filter(i => !i.result.isValid).length;

  md += `## Сводная статистика\n\n`;
  md += `- **Всего ${itemType}:** ${total}\n`;
  md += `- ✅ **С полным контентом:** ${valid}\n`;
  md += `- ⚠️ **С предупреждениями:** ${withWarnings}\n`;
  md += `- ❌ **С ошибками:** ${invalid}\n\n`;

  // Детальный список
  md += `## Детальный анализ\n\n`;

  for (const item of items) {
    const status = item.result.isValid
      ? item.result.warnings.length === 0
        ? '✅'
        : '⚠️'
      : '❌';

    md += `### ${status} ${item.id} - ${item.name}\n\n`;

    // Обязательные поля
    if (item.result.errors.length > 0) {
      md += `#### ❌ Ошибки (обязательные поля)\n\n`;
      for (const error of item.result.errors) {
        md += `- ${error}\n`;
      }
      md += `\n`;
    }

    // Предупреждения (опциональные поля)
    if (item.result.warnings.length > 0) {
      md += `#### ⚠️ Предупреждения (опциональные поля)\n\n`;
      for (const warning of item.result.warnings) {
        md += `- ${warning}\n`;
      }
      md += `\n`;
    }

    // Невалидные поля
    if (item.result.invalidFields.length > 0) {
      md += `#### ⚠️ Невалидные форматы\n\n`;
      for (const invalid of item.result.invalidFields) {
        md += `- ${invalid}\n`;
      }
      md += `\n`;
    }

    // Содержание полей
    md += `#### 📋 Содержание полей\n\n`;
    md += `\`\`\`json\n${JSON.stringify(item.result.content, null, 2)}\n\`\`\`\n\n`;

    md += `---\n\n`;
  }

  return md;
}

// Основная функция
function main() {
  console.log('Начало анализа...\n');

  // Валидация узлов
  console.log('Анализ узлов...');
  const nodeResults: Array<{ id: string; name: string; result: ValidationResult }> = [];
  for (const node of treeData.nodes) {
    const description = nodeDescriptions.node_descriptions[node.node_id];
    const result = validateNode(node, description);
    nodeResults.push({
      id: node.node_id,
      name: node.name || node.node_id,
      result
    });
  }

  // Проверка узлов без описаний
  const nodesWithoutDescriptions = treeData.nodes.filter(
    n => !nodeDescriptions.node_descriptions[n.node_id]
  );
  if (nodesWithoutDescriptions.length > 0) {
    console.log(`⚠️ Найдено ${nodesWithoutDescriptions.length} узлов без описаний`);
  }

  // Валидация веток
  console.log('Анализ веток...');
  const branchResults: Array<{ id: string; name: string; result: ValidationResult }> = [];
  for (const branch of treeData.branches) {
    const result = validateBranch(branch);
    branchResults.push({
      id: branch.branch_id,
      name: branch.name,
      result
    });
  }

  // Валидация квестов
  console.log('Анализ квестов...');
  const questResults: Array<{ id: string; name: string; result: ValidationResult }> = [];
  for (const quest of questTemplates.quest_templates) {
    const result = validateQuest(quest);
    questResults.push({
      id: quest.id,
      name: quest.title,
      result
    });
  }

  // Валидация кейсов
  console.log('Анализ кейсов...');
  const caseResults: Array<{ id: string; name: string; result: ValidationResult }> = [];
  for (const caseItem of interactiveCases.interactive_cases) {
    const result = validateCase(caseItem);
    caseResults.push({
      id: caseItem.id,
      name: caseItem.title,
      result
    });
  }

  // Валидация стилей
  console.log('Анализ стилей...');
  const buildResults: Array<{ id: string; name: string; result: ValidationResult }> = [];
  for (const build of builds.builds) {
    const result = validateBuild(build);
    buildResults.push({
      id: build.build_id,
      name: build.name,
      result
    });
  }

  // Генерация отчетов
  console.log('\nГенерация отчетов...');

  // Отчет по узлам
  const nodesReport = generateMarkdownReport('Анализ узлов способностей', nodeResults, 'узлов');
  fs.writeFileSync(path.join(REPORTS_DIR, 'content-analysis-nodes.md'), nodesReport, 'utf-8');
  console.log('✅ Отчет по узлам: reports/content-analysis-nodes.md');

  // Отчет по веткам
  const branchesReport = generateMarkdownReport('Анализ веток способностей', branchResults, 'веток');
  fs.writeFileSync(path.join(REPORTS_DIR, 'content-analysis-branches.md'), branchesReport, 'utf-8');
  console.log('✅ Отчет по веткам: reports/content-analysis-branches.md');

  // Отчет по квестам (разбить на части если > 50)
  if (questResults.length > 50) {
    const chunkSize = 50;
    for (let i = 0; i < questResults.length; i += chunkSize) {
      const chunk = questResults.slice(i, i + chunkSize);
      const partNum = Math.floor(i / chunkSize) + 1;
      const questReport = generateMarkdownReport(
        `Анализ квестов (часть ${partNum})`,
        chunk,
        'квестов'
      );
      const filename = `content-analysis-quests-part${partNum}.md`;
      fs.writeFileSync(path.join(REPORTS_DIR, filename), questReport, 'utf-8');
      console.log(`✅ Отчет по квестам (часть ${partNum}): reports/${filename}`);
    }
  } else {
    const questReport = generateMarkdownReport('Анализ квестов', questResults, 'квестов');
    fs.writeFileSync(path.join(REPORTS_DIR, 'content-analysis-quests.md'), questReport, 'utf-8');
    console.log('✅ Отчет по квестам: reports/content-analysis-quests.md');
  }

  // Отчет по кейсам (разбить на части если > 30)
  if (caseResults.length > 30) {
    const chunkSize = 30;
    for (let i = 0; i < caseResults.length; i += chunkSize) {
      const chunk = caseResults.slice(i, i + chunkSize);
      const partNum = Math.floor(i / chunkSize) + 1;
      const caseReport = generateMarkdownReport(
        `Анализ кейсов (часть ${partNum})`,
        chunk,
        'кейсов'
      );
      const filename = `content-analysis-cases-part${partNum}.md`;
      fs.writeFileSync(path.join(REPORTS_DIR, filename), caseReport, 'utf-8');
      console.log(`✅ Отчет по кейсам (часть ${partNum}): reports/${filename}`);
    }
  } else {
    const caseReport = generateMarkdownReport('Анализ кейсов', caseResults, 'кейсов');
    fs.writeFileSync(path.join(REPORTS_DIR, 'content-analysis-cases.md'), caseReport, 'utf-8');
    console.log('✅ Отчет по кейсам: reports/content-analysis-cases.md');
  }

  // Отчет по стилям
  const buildsReport = generateMarkdownReport('Анализ стилей лидерства', buildResults, 'стилей');
  fs.writeFileSync(path.join(REPORTS_DIR, 'content-analysis-builds.md'), buildsReport, 'utf-8');
  console.log('✅ Отчет по стилям: reports/content-analysis-builds.md');

  // Сводный отчет
  const summaryReport = `# Сводный отчет анализа контента

*Дата анализа: ${new Date().toLocaleString('ru-RU')}*

## Общая статистика

- **Узлы:** ${nodeResults.length} (✅ ${nodeResults.filter(r => r.result.isValid && r.result.warnings.length === 0).length}, ⚠️ ${nodeResults.filter(r => r.result.isValid && r.result.warnings.length > 0).length}, ❌ ${nodeResults.filter(r => !r.result.isValid).length})
- **Ветки:** ${branchResults.length} (✅ ${branchResults.filter(r => r.result.isValid && r.result.warnings.length === 0).length}, ⚠️ ${branchResults.filter(r => r.result.isValid && r.result.warnings.length > 0).length}, ❌ ${branchResults.filter(r => !r.result.isValid).length})
- **Квесты:** ${questResults.length} (✅ ${questResults.filter(r => r.result.isValid && r.result.warnings.length === 0).length}, ⚠️ ${questResults.filter(r => r.result.isValid && r.result.warnings.length > 0).length}, ❌ ${questResults.filter(r => !r.result.isValid).length})
- **Кейсы:** ${caseResults.length} (✅ ${caseResults.filter(r => r.result.isValid && r.result.warnings.length === 0).length}, ⚠️ ${caseResults.filter(r => r.result.isValid && r.result.warnings.length > 0).length}, ❌ ${caseResults.filter(r => !r.result.isValid).length})
- **Стили:** ${buildResults.length} (✅ ${buildResults.filter(r => r.result.isValid && r.result.warnings.length === 0).length}, ⚠️ ${buildResults.filter(r => r.result.isValid && r.result.warnings.length > 0).length}, ❌ ${buildResults.filter(r => !r.result.isValid).length})

## Детальные отчеты

- [Анализ узлов](content-analysis-nodes.md)
- [Анализ веток](content-analysis-branches.md)
- [Анализ квестов](content-analysis-quests.md${questResults.length > 50 ? ' или части)' : ')'}
- [Анализ кейсов](content-analysis-cases.md${caseResults.length > 30 ? ' или части)' : ')'}
- [Анализ стилей](content-analysis-builds.md)

## Критические проблемы

${nodeResults.filter(r => !r.result.isValid).length > 0 ? `### Узлы с ошибками (${nodeResults.filter(r => !r.result.isValid).length})\n\n` : ''}
${nodeResults.filter(r => !r.result.isValid).slice(0, 10).map(r => `- ${r.id}: ${r.result.errors.join(', ')}`).join('\n')}
${nodeResults.filter(r => !r.result.isValid).length > 10 ? `\n... и еще ${nodeResults.filter(r => !r.result.isValid).length - 10} узлов\n` : ''}

${questResults.filter(r => !r.result.isValid).length > 0 ? `### Квесты с ошибками (${questResults.filter(r => !r.result.isValid).length})\n\n` : ''}
${questResults.filter(r => !r.result.isValid).slice(0, 10).map(r => `- ${r.id}: ${r.result.errors.join(', ')}`).join('\n')}
${questResults.filter(r => !r.result.isValid).length > 10 ? `\n... и еще ${questResults.filter(r => !r.result.isValid).length - 10} квестов\n` : ''}

${caseResults.filter(r => !r.result.isValid).length > 0 ? `### Кейсы с ошибками (${caseResults.filter(r => !r.result.isValid).length})\n\n` : ''}
${caseResults.filter(r => !r.result.isValid).slice(0, 10).map(r => `- ${r.id}: ${r.result.errors.join(', ')}`).join('\n')}
${caseResults.filter(r => !r.result.isValid).length > 10 ? `\n... и еще ${caseResults.filter(r => !r.result.isValid).length - 10} кейсов\n` : ''}
`;

  fs.writeFileSync(path.join(REPORTS_DIR, 'content-analysis-summary.md'), summaryReport, 'utf-8');
  console.log('✅ Сводный отчет: reports/content-analysis-summary.md');

  console.log('\n✅ Анализ завершен!');
}

main();
