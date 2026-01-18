// Карточки для UI

// Карточка ветки способностей
export { BranchCard, type BranchCardProps } from './BranchCard';

// Компактная карточка узла
export { 
  NodeCard, 
  type NodeCardProps, 
  type NodeState,
  type IntegrationLevel,
  type DevelopmentType,
} from './NodeCard';

// Детальная карточка узла
export { NodeDetailCard, type NodeDetailCardProps } from './NodeDetailCard';

// Карточка квеста для списка
export { QuestCard, type QuestCardProps, type QuestType, type QuestDifficulty, type QuestStatus } from './QuestCard';

// Детальная карточка квеста с кликабельными шагами
export { QuestDetailCard, type QuestDetailCardProps, type QuestStep, type EvidenceItem } from './QuestDetailCard';

// Карточка кейса для списка
export {
  CaseCard,
  type CaseCardProps,
  type CaseDifficulty,
  type CaseStatus,
} from './CaseCard';

// Детальная карточка кейса с структурированным контекстом (legacy)
export { CaseDetailCard, type CaseDetailCardProps, type CaseOption, type CaseOutcome } from './CaseDetailCard';

// Детальная карточка кейса v2 (новый дизайн)
export { CaseDetailCardV2 } from './CaseDetailCardV2';
export type {
  CaseDetailCardV2Props,
  CaseCardData,
  CaseMeta,
  CasePortal,
  CaseEvent,
  CaseSpaceMap,
  CaseFacts,
  CaseBackground,
  CaseDilemma,
  CaseConsequence,
  CasePosition,
  CaseIndicators,
  CaseReflection,
} from './CaseCardTypes';
export { DIFFICULTY_CONFIG, SPACE_MAP_LABELS } from './CaseCardTypes';

// Карточка стиля лидерства
export { BuildCard, type BuildCardProps, type BuildStatus, type BuildRequirement } from './BuildCard';
