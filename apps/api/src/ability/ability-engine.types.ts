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
  progress: number; // 0..1+
  relevance: number; // 0..1
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
  conditions?: unknown; // unlock criteria
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

