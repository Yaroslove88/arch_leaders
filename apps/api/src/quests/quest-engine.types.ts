/**
 * Типы для QuestEngine
 */

import type { QuestCriteria, QuestReward, QuestStep } from '../common/schemas/quest.schema';

export interface AbilitySignal {
  node_id: string;
  signal: string;
}

export interface FocusPoint {
  area: string;
  priority: 'high' | 'medium' | 'low';
}

export interface QuestGenerationInput {
  userId: string;
  sessionId?: string;
  abilitySignals: AbilitySignal[];
  themes: string[];
  patterns: string[];
  focus: FocusPoint[];
  nodeInfos?: Map<string, NodeInfo>;
}

export interface NodeInfo {
  node_id: string;
  name?: string;
  level?: 'basic' | 'mid' | 'advanced' | 'master';
  branch?: string;
}

export interface QuestRule {
  type: 'micro' | 'weekly' | 'story' | 'in-person';
  criteriaType: 'evidence' | 'count' | 'streak' | 'custom';
  target?: number;
  xp: number;
  skillXp?: number;
  maxQuests?: number; // Максимальное количество квестов этого типа
}

export interface GeneratedQuestData {
  title: string;
  description: string;
  type: 'micro' | 'weekly' | 'story' | 'in-person';
  criteria: QuestCriteria;
  reward?: QuestReward | null;
  linked_nodes?: string[];
  tags: string[];
}

export interface QuestGenerationOutput {
  quests: GeneratedQuestData[];
  summary: {
    total: number;
    byType: Record<string, number>;
  };
}

