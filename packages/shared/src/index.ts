// Shared types and schemas for Leadership Architect
export * from './schemas';

// Ontology exports (excluding CaseDifficulty which is already exported from schemas)
export {
  // Development Levels
  IntegrationLevel,
  NodeState,
  NodeTier,
  DevelopmentType,
  TIER_TO_LEGACY_LEVEL,
  LEGACY_LEVEL_TO_TIER,
  // Ontology Domains
  OntologyDomain,
  DOMAIN_TO_BRANCH,
  // Core Loop
  CoreLoopStage,
  CORE_LOOP_PATH,
  // Quest types
  QuestType,
  QuestStatus,
  // XP and Progress
  XP_THRESHOLDS,
  QUEST_XP_REWARDS,
  CASE_XP_REWARDS,
  CASE_ACCESS_REQUIREMENTS,
  // Explainability
  Rationale,
  DecisionType,
  // Builds
  BuildType,
  BUILD_DETECTION_THRESHOLD,
  // Utility functions
  isValidIntegrationLevel,
  isValidNodeState,
  getNextNodeState,
  getIntegrationLevelFromState,
} from './ontology';

// Re-export CaseDifficulty enum from ontology with different name to avoid conflict
export { CaseDifficulty as OntologyCaseDifficulty } from './ontology';

