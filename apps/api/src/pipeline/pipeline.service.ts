import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PipelineStage,
  PipelineConfig,
  PipelineContext,
  StageResult,
  PreprocessResult,
  ExtractResult,
  SignalsResult,
  ApplyResult,
  QuestsResult,
} from './pipeline.types';
import { LLMService } from '../llm/llm.service';
import {
  validateInsightsJson,
  validateFocusJson,
  validateAbilitySignalsJson,
  parseAbilitySignalsJson,
} from '../common/mappers/session.mapper';
import type { Insight, FocusPoint, AbilitySignal } from '../common/schemas/session.schema';
import { QuestOrchestrationService } from '../orchestration/quest-orchestration.service';
import { AbilityStateService } from '../ability/ability-state.service';

/**
 * Сервис для выполнения staged pipeline анализа
 */
@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LLMService,
    private readonly questOrchestration: QuestOrchestrationService,
    private readonly abilityStateService: AbilityStateService,
  ) {}

  /**
   * Выполнить pipeline анализа
   */
  async runPipeline(context: PipelineContext): Promise<{
    sessionId: string;
    stages: Record<PipelineStage, StageResult>;
  }> {
    this.logger.log(`🚀 Starting pipeline for entry ${context.entryId}`);

    const stages: Record<PipelineStage, StageResult> = {
      preprocess: { stage: 'preprocess', success: false },
      extract: { stage: 'extract', success: false },
      signals: { stage: 'signals', success: false },
      apply: { stage: 'apply', success: false },
      quests: { stage: 'quests', success: false },
    };

    // Определяем, с какого этапа начинать
    const stageOrder: PipelineStage[] = ['preprocess', 'extract', 'signals', 'apply', 'quests'];
    const startIndex = context.config.fromStage
      ? stageOrder.indexOf(context.config.fromStage)
      : 0;

    let sessionId = context.sessionId;

    // Preprocess
    if (startIndex <= 0 && context.config.stagesEnabled.preprocess) {
      stages.preprocess = await this.runPreprocess(context);
    }

    // Extract
    if (startIndex <= 1 && context.config.stagesEnabled.extract) {
      stages.extract = await this.runExtract(context, stages.preprocess.data as PreprocessResult | undefined);
      // Сохраняем результаты extract в SessionArtifact
      if (stages.extract.success && sessionId) {
        await this.saveArtifact(sessionId, 'extract', stages.extract.data as ExtractResult);
      }
    }

    // Signals
    if (startIndex <= 2 && context.config.stagesEnabled.signals) {
      stages.signals = await this.runSignals(context, stages.extract.data as ExtractResult | undefined);
      // Сохраняем результаты signals в SessionArtifact
      if (stages.signals.success && sessionId) {
        await this.saveArtifact(sessionId, 'signals', stages.signals.data as SignalsResult);
      }
    }

    // Apply (изменение состояния)
    if (startIndex <= 3 && context.config.stagesEnabled.apply) {
      stages.apply = await this.runApply(context, stages.signals.data as SignalsResult | undefined);
      // Сохраняем результаты apply в SessionArtifact
      if (stages.apply.success && sessionId) {
        await this.saveArtifact(sessionId, 'apply', stages.apply.data as ApplyResult);
      }
    }

    // Quests
    if (startIndex <= 4 && context.config.stagesEnabled.quests) {
      stages.quests = await this.runQuests(context, stages.extract.data as ExtractResult | undefined);
      // Сохраняем результаты quests в SessionArtifact
      if (stages.quests.success && sessionId) {
        await this.saveArtifact(sessionId, 'quests', stages.quests.data as QuestsResult);
      }
    }

    // Создаем или обновляем Session с финальными результатами
    if (!sessionId) {
      sessionId = await this.createOrUpdateSession(context, stages);
    } else {
      await this.updateSession(sessionId, stages);
    }

    this.logger.log(`✅ Pipeline completed for entry ${context.entryId}, session ${sessionId}`);

    return { sessionId, stages };
  }

  /**
   * Этап 1: Preprocess (нормализация текста, контекст)
   */
  private async runPreprocess(context: PipelineContext): Promise<StageResult<PreprocessResult>> {
    this.logger.log(`[Preprocess] Processing entry ${context.entryId}`);

    try {
      const entry = await this.prisma.entry.findUnique({
        where: { id: context.entryId },
      });

      if (!entry) {
        throw new Error(`Entry ${context.entryId} not found`);
      }

      // Нормализация текста (можно добавить логику очистки, форматирования)
      const normalizedText = entry.text.trim();

      return {
        stage: 'preprocess',
        success: true,
        data: {
          normalizedText,
          context: {
            type: entry.type,
            participants: entry.participants,
            contextJson: entry.context_json,
          },
        },
      };
    } catch (error) {
      this.logger.error(`[Preprocess] Failed:`, error);
      return {
        stage: 'preprocess',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Этап 2: Extract (темы/инсайты/фокусы через LLM)
   */
  private async runExtract(
    context: PipelineContext,
    preprocessResult?: PreprocessResult,
  ): Promise<StageResult<ExtractResult>> {
    this.logger.log(`[Extract] Extracting themes/insights/focus for entry ${context.entryId}`);

    try {
      if (!preprocessResult) {
        throw new Error('Preprocess result is required for extract stage');
      }

      // Вызываем LLM для извлечения структурированных данных
      const analysis = await this.llmService.analyzeSituation(
        {
          text: preprocessResult.normalizedText,
          type: preprocessResult.context.type,
          participants: preprocessResult.context.participants,
          context_json: preprocessResult.context.contextJson,
        },
        undefined, // requestId можно добавить позже
      );

      return {
        stage: 'extract',
        success: true,
        data: {
          summary: analysis.summary,
          themes: analysis.themes,
          patterns: analysis.patterns,
          tensions: analysis.tensions,
          insights: analysis.insights,
          focus: analysis.focus,
          // Сохраняем ability_signals для signals этапа
          abilitySignals: analysis.ability_signals.map((s) => ({
            node_id: s.node_id,
            signal: s.signal,
          })),
        },
      };
    } catch (error) {
      this.logger.error(`[Extract] Failed:`, error);
      return {
        stage: 'extract',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Этап 3: Signals (ability signals из extract)
   */
  private async runSignals(
    context: PipelineContext,
    extractResult?: ExtractResult,
  ): Promise<StageResult<SignalsResult>> {
    this.logger.log(`[Signals] Processing ability signals for entry ${context.entryId}`);

    try {
      if (!extractResult) {
        throw new Error('Extract result is required for signals stage');
      }

      // Получаем ability_signals из extract результата
      const abilitySignals = extractResult.abilitySignals || [];

      return {
        stage: 'signals',
        success: true,
        data: {
          abilitySignals,
        },
      };
    } catch (error) {
      this.logger.error(`[Signals] Failed:`, error);
      return {
        stage: 'signals',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Этап 4: Apply (изменение состояния: tree/userAbilityState)
   */
  private async runApply(
    context: PipelineContext,
    signalsResult?: SignalsResult,
  ): Promise<StageResult<ApplyResult>> {
    this.logger.log(`[Apply] Applying state changes for entry ${context.entryId}`);

    try {
      if (!signalsResult) {
        throw new Error('Signals result is required for apply stage');
      }

      // Применяем сигналы через AbilityStateService
      const result = await this.abilityStateService.applySignals(
        context.userId,
        signalsResult.abilitySignals,
      );

      return {
        stage: 'apply',
        success: true,
        data: {
          abilityStateChanges: result.changes.map((c) => ({
            nodeId: c.nodeId,
            before: {
              state: c.before.state,
              progress: c.before.progress,
            },
            after: {
              state: c.after.state,
              progress: c.after.progress,
            },
          })),
          changeLogId: result.changeLogId,
        },
      };
    } catch (error) {
      this.logger.error(`[Apply] Failed:`, error);
      return {
        stage: 'apply',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Этап 5: Quests (генерация квестов)
   */
  private async runQuests(
    context: PipelineContext,
    extractResult?: ExtractResult,
  ): Promise<StageResult<QuestsResult>> {
    this.logger.log(`[Quests] Generating quests for entry ${context.entryId}`);

    try {
      if (!context.sessionId) {
        throw new Error('Session ID is required for quests stage');
      }

      // Генерируем квесты через orchestration
      const questsGenerated = await this.questOrchestration.handleSessionAnalyzed(context.sessionId);

      // Получаем созданные квесты
      const quests = await this.prisma.quest.findMany({
        where: {
          session_id: context.sessionId,
          source: 'session_analysis',
        },
        select: { id: true },
      });

      return {
        stage: 'quests',
        success: true,
        data: {
          questsGenerated,
          questIds: quests.map((q) => q.id),
        },
      };
    } catch (error) {
      this.logger.error(`[Quests] Failed:`, error);
      return {
        stage: 'quests',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Сохранить артефакт этапа в SessionArtifact
   */
  private async saveArtifact(sessionId: string, kind: string, payload: unknown): Promise<void> {
    // Находим последнюю версию артефакта этого типа
    const lastArtifact = await this.prisma.sessionArtifact.findFirst({
      where: {
        session_id: sessionId,
        kind,
      },
      orderBy: { version: 'desc' },
    });

    const nextVersion = lastArtifact ? lastArtifact.version + 1 : 1;

    await this.prisma.sessionArtifact.create({
      data: {
        session_id: sessionId,
        kind,
        version: nextVersion,
        payload: payload as any,
      },
    });

    this.logger.log(`Saved artifact ${kind} v${nextVersion} for session ${sessionId}`);
  }

  /**
   * Создать или обновить Session с результатами pipeline
   */
  private async createOrUpdateSession(
    context: PipelineContext,
    stages: Record<PipelineStage, StageResult>,
  ): Promise<string> {
    const extractResult = stages.extract.data as ExtractResult | undefined;

    if (!extractResult) {
      throw new Error('Extract stage must succeed to create session');
    }

    // Проверяем существующую сессию
    const existing = await this.prisma.session.findUnique({
      where: { entry_id: context.entryId },
    });

    const sessionData = {
      summary: extractResult.summary,
      insights_json: validateInsightsJson(extractResult.insights),
      focus_json: validateFocusJson(extractResult.focus),
      themes: extractResult.themes,
      patterns: extractResult.patterns,
      tensions: extractResult.tensions,
      ability_signals_json: extractResult.abilitySignals
        ? validateAbilitySignalsJson(extractResult.abilitySignals)
        : [],
      status: stages.quests.success ? 'succeeded' : 'processing',
      completed_at: stages.quests.success ? new Date() : null,
    };

    if (existing) {
      const updated = await this.prisma.session.update({
        where: { id: existing.id },
        data: sessionData,
      });
      return updated.id;
    } else {
      const created = await this.prisma.session.create({
        data: {
          ...sessionData,
          entry: { connect: { id: context.entryId } },
          user: { connect: { id: context.userId } },
        },
      });
      return created.id;
    }
  }

  /**
   * Обновить существующую Session
   */
  private async updateSession(
    sessionId: string,
    stages: Record<PipelineStage, StageResult>,
  ): Promise<void> {
    const extractResult = stages.extract.data as ExtractResult | undefined;

    if (extractResult) {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          summary: extractResult.summary,
          insights_json: validateInsightsJson(extractResult.insights),
          focus_json: validateFocusJson(extractResult.focus),
          themes: extractResult.themes,
          patterns: extractResult.patterns,
          tensions: extractResult.tensions,
          status: stages.quests.success ? 'succeeded' : 'processing',
          completed_at: stages.quests.success ? new Date() : null,
        },
      });
    }
  }
}

