/**
 * Типы для AbilityEngine
 */

export type AbilityState = 'locked' | 'available' | 'active' | 'unlocked' | 'integrated';

export interface AbilitySignal {
  node_id: string;
  signal: string;
}

export interface AbilityStateSnapshot {
  nodeId: string;
  state: AbilityState;
  progress: number; // 0..1 (вычисляется на лету из xp_current / xp_required)
  internalProgress: number; // УПРОЩЕНО: используется тот же progress (для обратной совместимости)
  relevance: number; // 0..1
  storedExperience?: number; // УПРОЩЕНО: больше не используется (для обратной совместимости)
  lastActivityDate?: Date; // дата последней активности
}

export interface AbilityStateChange {
  nodeId: string;
  before: AbilityStateSnapshot;
  after: AbilityStateSnapshot;
  reason?: string;
}

export interface AbilityNodeInfo {
  id: string;
  branch: string;
  title: string;
  description: string;
  level: 'basic' | 'mid' | 'advanced' | 'master';
  conditions?: unknown; // unlock criteria (legacy)
  prerequisites?: string[]; // массив ID узлов, которые должны быть разблокированы
}

export interface ComputeNextInput {
  userId: string;
  signals: AbilitySignal[];
  currentStates: Map<string, AbilityStateSnapshot>;
  nodeInfos: Map<string, AbilityNodeInfo>;
}

export interface ComputeNextOutput {
  changes: AbilityStateChange[];
  summary: {
    nodesUpdated: number;
    nodesUnlocked: number;
    nodesActivated: number;
  };
}

export interface ApplyQuestExperienceInput {
  userId: string;
  nodeId: string;
  baseXp: number;
  reflectionXp: number;
  questDifficulty?: 'basic' | 'intermediate' | 'advanced';
  currentStates: Map<string, AbilityStateSnapshot>;
  nodeInfos: Map<string, AbilityNodeInfo>;
}

export interface ApplyQuestExperienceOutput {
  change: AbilityStateChange | null;
}

