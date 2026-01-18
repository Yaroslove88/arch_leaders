import { NodeAbilityState, Quest, InteractiveCase } from './api';

export type Tone = 'focus' | 'growth' | 'warning' | 'critical' | 'neutral';

/**
 * Маппинг состояния узла на визуальный тон
 */
export function mapNodeStateToTone(state: NodeAbilityState['state']): Tone {
  switch (state) {
    case 'integrated':
    case 'unlocked':
      return 'growth';
    case 'active':
      return 'focus';
    case 'available':
      return 'warning';
    case 'locked':
    default:
      return 'neutral';
  }
}

/**
 * Маппинг статуса квеста на визуальный тон
 */
export function mapQuestStatusToTone(status: string): Tone {
  switch (status) {
    case 'completed':
    case 'done':
      return 'growth';
    case 'active':
    case 'in_progress':
      return 'focus';
    case 'available':
    case 'backlog':
      return 'warning';
    case 'locked':
    case 'archived':
    default:
      return 'neutral';
  }
}

/**
 * Маппинг статуса кейса на визуальный тон
 */
export function mapCaseStatusToTone(status: string): Tone {
  switch (status) {
    case 'completed':
    case 'solved':
      return 'growth';
    case 'available':
      return 'warning';
    case 'locked':
    default:
      return 'neutral';
  }
}

/**
 * Маппинг сложности на визуальный тон (опционально)
 */
export function mapDifficultyToTone(difficulty: string): Tone {
  switch (difficulty) {
    case 'advanced':
      return 'critical';
    case 'intermediate':
      return 'warning';
    case 'basic':
    default:
      return 'focus';
  }
}
