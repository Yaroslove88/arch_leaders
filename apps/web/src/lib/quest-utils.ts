/**
 * Утилиты для работы с квестами и уровнями узлов
 * Вынесены из experiments/page.tsx для переиспользования
 */
import { SemanticTree } from './api';

/**
 * Интеграционные уровни и их числовые значения
 */
const INTEGRATION_LEVELS: Record<string, number> = {
  'Novice': 1,
  'Integrated': 2,
  'Embodied': 3,
};

/**
 * Маппинг tier на числовой уровень
 */
const TIER_LEVELS: Record<string, number> = {
  'basic': 1,
  'intermediate': 2,
  'advanced': 3,
  'master': 4,
};

/**
 * Результат определения уровня узла
 */
export interface NodeLevelInfo {
  level: number;
  maxLevel: number;
}

/**
 * Результат определения сложности квеста
 */
export interface QuestComplexityInfo {
  minLevel: number;
  maxLevel: number;
  avgLevel: number;
}

/**
 * Получить уровень узла дерева способностей
 * 
 * @param nodeId ID узла
 * @param tree Дерево способностей
 * @param nodeDescriptions Описания узлов (опционально)
 */
export function getNodeLevel(
  nodeId: string | undefined,
  tree: SemanticTree | null | undefined,
  nodeDescriptions?: Record<string, any>,
): NodeLevelInfo {
  if (!nodeId || !tree) {
    return { level: 0, maxLevel: 3 };
  }

  const node = tree.nodes?.find(n => n.node_id === nodeId);
  if (!node) {
    return { level: 0, maxLevel: 3 };
  }

  // Приоритет: integration_level > tier > описание
  let level = 0;
  let maxLevel = 3;

  // Проверяем integration_level
  const integrationLevel = (node as any).integration_level;
  if (integrationLevel && INTEGRATION_LEVELS[integrationLevel]) {
    level = INTEGRATION_LEVELS[integrationLevel];
    maxLevel = 3;
  } else {
    // Проверяем tier
    const tier = (node as any).tier;
    if (tier && TIER_LEVELS[tier]) {
      level = TIER_LEVELS[tier];
      maxLevel = 4;
    }
  }

  // Проверяем описание узла
  if (nodeDescriptions && nodeDescriptions[nodeId]) {
    const desc = nodeDescriptions[nodeId];
    if (desc.integration_levels) {
      // Определяем текущий уровень по состоянию
      const state = (node as any).state;
      if (state === 'integrated') {
        level = 3;
      } else if (state === 'unlocked') {
        level = 2;
      } else if (state === 'active' || state === 'available') {
        level = 1;
      }
    }
  }

  return { level, maxLevel };
}

/**
 * Получить сложность квеста на основе связанных узлов
 * 
 * @param quest Квест
 * @param tree Дерево способностей
 * @param nodeDescriptions Описания узлов (опционально)
 */
export function getQuestComplexity(
  quest: { linked_nodes?: string[] },
  tree: SemanticTree | null | undefined,
  nodeDescriptions?: Record<string, any>,
): QuestComplexityInfo {
  const linkedNodes = quest.linked_nodes || [];
  
  if (linkedNodes.length === 0 || !tree) {
    return { minLevel: 0, maxLevel: 0, avgLevel: 0 };
  }

  let minLevel = Infinity;
  let maxLevel = -Infinity;
  let totalLevel = 0;
  let validNodes = 0;

  for (const nodeId of linkedNodes) {
    const { level, maxLevel: nodeMaxLevel } = getNodeLevel(nodeId, tree, nodeDescriptions);
    if (level > 0) {
      minLevel = Math.min(minLevel, level);
      maxLevel = Math.max(maxLevel, level);
      totalLevel += level;
      validNodes++;
    }
  }

  if (validNodes === 0) {
    return { minLevel: 0, maxLevel: 0, avgLevel: 0 };
  }

  return {
    minLevel: minLevel === Infinity ? 0 : minLevel,
    maxLevel: maxLevel === -Infinity ? 0 : maxLevel,
    avgLevel: Math.round(totalLevel / validNodes * 10) / 10,
  };
}

/**
 * Сортировать квесты по сложности
 * 
 * @param quests Массив квестов
 * @param tree Дерево способностей
 * @param nodeDescriptions Описания узлов (опционально)
 * @param ascending По возрастанию (default: true)
 */
export function sortQuestsByComplexity<T extends { linked_nodes?: string[] }>(
  quests: T[],
  tree: SemanticTree | null | undefined,
  nodeDescriptions?: Record<string, any>,
  ascending = true,
): T[] {
  return [...quests].sort((a, b) => {
    const complexityA = getQuestComplexity(a, tree, nodeDescriptions);
    const complexityB = getQuestComplexity(b, tree, nodeDescriptions);
    const diff = complexityA.avgLevel - complexityB.avgLevel;
    return ascending ? diff : -diff;
  });
}
