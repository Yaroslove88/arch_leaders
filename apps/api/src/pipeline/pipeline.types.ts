/**
 * Типы для staged pipeline
 */

export type PipelineStage =
  | 'preprocess'
  | 'extract'
  | 'signals'
  | 'apply'
  | 'quests';

export interface PipelineConfig {
  stagesEnabled: Record<PipelineStage, boolean>;
  fromStage?: PipelineStage; // С какого этапа начать (для перезапуска)
}

export interface PipelineContext {
  entryId: string;
  sessionId?: string;
  userId: string;
  config: PipelineConfig;
}

export interface StageResult<T = unknown> {
  stage: PipelineStage;
  success: boolean;
  data?: T;
  error?: string;
  artifacts?: Array<{
    kind: string;
    payload: unknown;
  }>;
}

export interface PreprocessResult {
  normalizedText: string;
  context: {
    type: string;
    participants: string[];
    contextJson?: unknown;
  };
}

export interface ExtractResult {
  summary: string;
  themes: string[];
  patterns: string[];
  tensions: string[];
  insights: Array<{ title: string; description: string }>;
  focus: Array<{ area: string; priority: 'high' | 'medium' | 'low' }>;
  abilitySignals?: Array<{ node_id: string; signal: string }>;
}

export interface SignalsResult {
  abilitySignals: Array<{ node_id: string; signal: string }>;
}

export interface ApplyResult {
  abilityStateChanges: Array<{
    nodeId: string;
    before: { state: string; progress: number };
    after: { state: string; progress: number };
  }>;
  changeLogId?: string;
}

export interface QuestsResult {
  questsGenerated: number;
  questIds: string[];
}

