import { NodeAbilityState, Quest, InteractiveCase } from './api';
import { tokens, NodeState, BranchId, NodeStateStyle } from '@leadership-architect/ui';

export type Tone = 'focus' | 'growth' | 'warning' | 'critical' | 'neutral';

/**
 * Branch color palette from tokens (CSS vars with fallbacks)
 */
const BRANCH_COLORS: Record<string, string> = {
  'subjectivity': `var(--branch-subjectivity, ${tokens.colors.branches.subjectivity})`,
  'architectural-thinking': `var(--branch-architectural-thinking, ${tokens.colors.branches['architectural-thinking']})`,
  'resilience': `var(--branch-resilience, ${tokens.colors.branches.resilience})`,
  'responsibility': `var(--branch-responsibility, ${tokens.colors.branches.responsibility})`,
  'feedback': `var(--branch-feedback, ${tokens.colors.branches.feedback})`,
  'environment-maturity': `var(--branch-environment-maturity, ${tokens.colors.branches['environment-maturity']})`,
};

/**
 * Maps branch ID to its color (CSS var with fallback)
 */
export function mapBranchToColor(branchId: string): string {
  // Direct match
  if (BRANCH_COLORS[branchId]) {
    return BRANCH_COLORS[branchId];
  }
  
  // Fuzzy match for localized names
  const lowerBranchId = branchId.toLowerCase();
  for (const [key, color] of Object.entries(BRANCH_COLORS)) {
    if (lowerBranchId.includes(key.toLowerCase())) {
      return color;
    }
  }
  
  // Fallback with consistent hash for unknown branches
  const hashColors = [
    tokens.colors.branches.subjectivity,
    tokens.colors.branches['architectural-thinking'],
    tokens.colors.branches.resilience,
    tokens.colors.branches.responsibility,
    tokens.colors.branches.feedback,
    tokens.colors.branches['environment-maturity'],
  ];
  let hash = 0;
  for (let i = 0; i < branchId.length; i++) {
    hash = ((hash << 5) - hash) + branchId.charCodeAt(i);
    hash = hash & hash;
  }
  return hashColors[Math.abs(hash) % hashColors.length];
}

/**
 * Maps branch ID to semantic Tone for Badge/Progress
 */
export function mapBranchToTone(branchId: string): Tone {
  const lowerBranchId = branchId.toLowerCase();
  
  // Strategic / thinking branches -> focus
  if (lowerBranchId.includes('subjectivity') || 
      lowerBranchId.includes('architectural') ||
      lowerBranchId.includes('feedback')) {
    return 'focus';
  }
  
  // Growth / responsibility branches -> growth
  if (lowerBranchId.includes('responsibility') || 
      lowerBranchId.includes('environment')) {
    return 'growth';
  }
  
  // Challenge / resilience branches -> warning
  if (lowerBranchId.includes('resilience')) {
    return 'warning';
  }
  
  return 'neutral';
}

/**
 * Gets node state styles from tokens (CSS vars with fallbacks)
 */
export function getNodeStateStyles(state: NodeState): NodeStateStyle {
  const stateTokens = tokens.colors.nodeStates[state] || tokens.colors.nodeStates.locked;
  const prefix = `--node-${state}`;
  
  return {
    bg: `var(${prefix}-bg, ${stateTokens.bg})`,
    border: `var(${prefix}-border, ${stateTokens.border})`,
    text: `var(${prefix}-text, ${stateTokens.text})`,
    accent: `var(${prefix}-accent, ${stateTokens.accent})`,
  };
}

/**
 * Gets raw node state colors (without CSS var wrapper) for contexts like Canvas/SVG
 */
export function getNodeStateColorsRaw(state: NodeState): NodeStateStyle {
  return tokens.colors.nodeStates[state] || tokens.colors.nodeStates.locked;
}

/**
 * Gets raw branch color (without CSS var wrapper) for contexts like Canvas/SVG
 */
export function getBranchColorRaw(branchId: string): string {
  const branches = tokens.colors.branches as Record<string, string>;
  
  // Direct match
  if (branches[branchId]) {
    return branches[branchId];
  }
  
  // Fuzzy match
  const lowerBranchId = branchId.toLowerCase();
  for (const [key, color] of Object.entries(branches)) {
    if (key !== 'default' && lowerBranchId.includes(key.toLowerCase())) {
      return color;
    }
  }
  
  return branches.default || '#6B7280';
}

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
