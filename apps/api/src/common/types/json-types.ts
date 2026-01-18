/**
 * Типы для JSON полей Prisma моделей
 * 
 * Эти типы используются для типизации JSON полей в Prisma схемах
 * и должны совпадать со структурами, хранящимися в БД.
 */

/**
 * Insight - важное наблюдение из анализа
 */
export interface Insight {
  title: string;
  description: string;
}

/**
 * FocusPoint - зона для внимания
 */
export interface FocusPoint {
  area: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * AbilitySignal - сигнал проявления способности
 */
export interface AbilitySignal {
  node_id: string;
  signal: string;
}

/**
 * QuestStep - шаг выполнения квеста
 */
export interface QuestStep {
  id: string;
  description: string;
  completed?: boolean;
}

/**
 * QuestCriteria - критерии успеха квеста
 */
export interface QuestCriteria {
  type: 'count' | 'evidence' | 'streak' | 'custom';
  target?: number;
  description: string;
  theory_and_examples?: string;
}

/**
 * QuestReward - награда за выполнение квеста
 * Новая система: Base XP + Reflection XP
 */
export interface QuestReward {
  // Старые поля для обратной совместимости (deprecated)
  xp?: number;
  skill_xp?: number;
  // Новые поля
  base_xp?: number;
  reflection_xp?: number;
  max?: number; // base_xp + reflection_xp
  artifact?: string;
}

/**
 * EvidenceLink - связь evidence с другими сущностями
 */
export interface EvidenceLink {
  link_type: 'quest' | 'node' | 'entry' | 'session';
  link_id: string;
}

/**
 * ChangeOp - операция изменения в ChangeLog
 */
export interface ChangeOp {
  op: 'add' | 'remove' | 'update';
  path: string;
  value?: unknown;
}

/**
 * ParsedAnalysis - результат анализа ситуации
 */
export interface ParsedAnalysis {
  summary: string;
  insights: Insight[];
  focus: FocusPoint[];
  themes: string[];
  patterns: string[];
  tensions: string[];
  ability_signals: AbilitySignal[];
}



