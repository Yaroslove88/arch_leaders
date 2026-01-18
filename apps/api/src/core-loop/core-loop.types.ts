/**
 * Типы для Core Loop API
 * @see packages/shared/src/ontology.ts для CoreLoopStage
 */
import { Rationale, CoreLoopStage } from '@leadership-architect/shared';

/**
 * Запрос на обработку ситуации через Core Loop
 * POST /core-loop/process
 */
export interface CoreLoopProcessRequest {
  /** Описание ситуации */
  text: string;
  /** Тип записи */
  type?: 'situation' | 'reflection' | 'observation';
  /** Участники ситуации */
  participants?: string[];
  /** Дополнительный контекст */
  context?: Record<string, any>;
  /** Генерировать квест сразу (default: true) */
  generateQuest?: boolean;
}

/**
 * Результат обработки Core Loop
 */
export interface CoreLoopProcessResponse {
  /** Созданная запись */
  entry: {
    id: string;
    text: string;
    type: string;
    created_at: Date;
  };
  /** Результат анализа */
  session: {
    id: string;
    summary: string;
    themes: string[];
    patterns: string[];
    ability_signals: Array<{ node_id: string; signal: string }>;
    rationale?: Rationale;
  };
  /** Сгенерированный квест (если generateQuest=true) */
  quest?: {
    id: string;
    title: string;
    description: string;
    type: string;
    linked_nodes: string[];
    rationale?: Rationale;
  };
  /** Изменения в дереве после анализа */
  treeChanges?: TreeChange[];
  /** Текущий этап Core Loop */
  currentStage: CoreLoopStage;
}

/**
 * Запрос на завершение квеста через Core Loop
 * POST /core-loop/complete
 */
export interface CoreLoopCompleteRequest {
  /** ID квеста */
  questId: string;
  /** Evidence данные */
  evidence: {
    /** Что произошло */
    what_happened: string;
    /** Что заметил пользователь */
    what_noticed: string;
    /** Дополнительные заметки */
    notes?: string;
  };
}

/**
 * Результат завершения квеста
 */
export interface CoreLoopCompleteResponse {
  /** Созданный evidence */
  evidence: {
    id: string;
    what_happened: string;
    what_noticed: string;
    created_at: Date;
  };
  /** Квест завершён? */
  questCompleted: boolean;
  /** Изменения в дереве */
  treeChanges: TreeChange[];
  /** Объяснение изменений */
  rationale: Rationale;
  /** Текущий этап Core Loop */
  currentStage: CoreLoopStage;
}

/**
 * Изменение в дереве способностей
 */
export interface TreeChange {
  node_id: string;
  node_name?: string;
  xpBefore: number;
  xpAfter: number;
  xpDelta: number;
  stateBefore: string;
  stateAfter: string;
  /** Новые узлы, разблокированные благодаря этому изменению */
  newlyUnlocked?: string[];
}
