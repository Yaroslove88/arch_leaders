import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { LLMService } from '../llm/llm.service';
import { PrismaService } from '../prisma/prisma.service';
import { QuestOrchestrationService } from '../orchestration/quest-orchestration.service';
import {
  parseInsightsJson,
  parseFocusJson,
  parseAbilitySignalsJson,
  validateInsightsJson,
  validateFocusJson,
  validateAbilitySignalsJson,
} from '../common/mappers/session.mapper';
import type { Insight, FocusPoint, AbilitySignal } from '../common/schemas/session.schema';
import { Rationale, DecisionType } from '@leadership-architect/shared';

/**
 * Результат анализа ситуации
 * @see packages/shared/src/ontology.ts для типов Rationale
 */
export interface ParsedAnalysis {
  summary: string;
  insights: Insight[];
  focus: FocusPoint[];
  themes: string[];
  patterns: string[];
  tensions: string[];
  ability_signals: AbilitySignal[];
  /** Объяснение результатов анализа */
  rationale?: Rationale;
}

/**
 * Сервис для анализа управленческих ситуаций
 * Использует LLM для извлечения структурированных данных
 */
@Injectable()
export class AnalysisParserService {
  private readonly logger = new Logger(AnalysisParserService.name);

  constructor(
    @Inject(LLMService) private readonly llmService: LLMService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional()
    @Inject(QuestOrchestrationService)
    private readonly questOrchestrationService?: QuestOrchestrationService,
  ) {
    this.logger.log('🔍 AnalysisParserService constructor called');
    this.logger.log(`🔍 LLMService: ${this.llmService ? 'available' : 'NOT available'}`);
    this.logger.log(`🔍 PrismaService: ${this.prisma ? 'available' : 'NOT available'}`);
    
    if (!this.llmService) {
      this.logger.error('❌ LLMService is not available');
      throw new Error('LLMService must be initialized. Check that LLMModule is properly imported.');
    }
    if (!this.prisma) {
      this.logger.error('❌ PrismaService is not available');
      throw new Error('PrismaService must be initialized. Check that PrismaModule is properly imported.');
    }
    this.logger.log('✅ AnalysisParserService initialized with LLMService and PrismaService');
  }

  /**
   * Анализировать Entry и создать Session
   */
  async analyzeEntry(entryId: string): Promise<ParsedAnalysis> {
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new Error(`Entry ${entryId} not found`);
    }

    // Проверяем, есть ли уже сессия
    const existingSession = await this.prisma.session.findUnique({
      where: { entry_id: entryId },
    });

    if (existingSession && existingSession.status === 'done') {
      this.logger.log(`Session already exists for entry ${entryId}`);
      return {
        summary: existingSession.summary,
        insights: parseInsightsJson(existingSession.insights_json),
        focus: parseFocusJson(existingSession.focus_json),
        themes: existingSession.themes,
        patterns: existingSession.patterns,
        tensions: existingSession.tensions,
        ability_signals: parseAbilitySignalsJson(existingSession.ability_signals_json),
      };
    }

    // Обновляем статус на analyzing
    if (existingSession) {
      await this.prisma.session.update({
        where: { id: existingSession.id },
        data: { status: 'analyzing' },
      });
    }

    try {
      // Анализ через LLM (передаем requestId если доступен)
      const requestId = (entry as any).requestId; // В будущем можно добавить через контекст
      const analysis = await this.llmService.analyzeSituation(
        {
          text: entry.text,
          type: entry.type,
          participants: entry.participants,
          context_json: entry.context_json,
        },
        requestId,
      );

      // Валидируем данные перед записью
      const validatedInsights = validateInsightsJson(analysis.insights);
      const validatedFocus = validateFocusJson(analysis.focus);
      const validatedAbilitySignals = validateAbilitySignalsJson(analysis.ability_signals);

      // Создаем или обновляем Session
      const sessionData = {
        summary: analysis.summary,
        insights_json: validatedInsights,
        focus_json: validatedFocus,
        themes: analysis.themes,
        patterns: analysis.patterns,
        tensions: analysis.tensions,
        ability_signals_json: validatedAbilitySignals,
        status: 'succeeded' as const,
        completed_at: new Date(),
      };

      let session;
      if (existingSession) {
        session = await this.prisma.session.update({
          where: { id: existingSession.id },
          data: sessionData,
        });
      } else {
        session = await this.prisma.session.create({
          data: {
            ...sessionData,
            entry: { connect: { id: entryId } },
            user: { connect: { id: entry.userId } },
          },
        });
      }

      this.logger.log(`✅ Analysis completed for entry ${entryId}`);

      // Сохраняем сырой артефакт анализа с метаданными промпта/модели
      const promptMeta = (analysis as any).__meta;
      await this.prisma.sessionArtifact.create({
        data: {
          session_id: session.id,
          kind: 'raw_analysis',
          version: 1,
          prompt_id: promptMeta?.prompt_id,
          prompt_version: promptMeta?.prompt_version,
          model: promptMeta?.model,
          payload: analysis,
        },
      });

      // Генерируем квесты на основе анализа через orchestration (асинхронно, не блокируем ответ)
      this.handleQuestGeneration(session.id).catch((error) => {
        this.logger.error(`Failed to generate quests for session ${session.id}:`, error);
      });

      // Создаём rationale для объяснимости
      const rationale = this.createAnalysisRationale({
        themes: analysis.themes,
        patterns: analysis.patterns,
        abilitySignals: analysis.ability_signals,
        entryId,
      });

      return {
        summary: analysis.summary,
        insights: analysis.insights,
        focus: analysis.focus,
        themes: analysis.themes,
        patterns: analysis.patterns,
        tensions: analysis.tensions,
        ability_signals: analysis.ability_signals,
        rationale,
      };
    } catch (error) {
      this.logger.error(`❌ Analysis failed for entry ${entryId}:`, error);

      // Обновляем статус на error
      if (existingSession) {
        await this.prisma.session.update({
          where: { id: existingSession.id },
          data: {
            status: 'error',
            analysis_error: error instanceof Error ? error.message : String(error),
          },
        });
      } else {
        await this.prisma.session.create({
          data: {
            entry: { connect: { id: entryId } },
            user: { connect: { id: entry.userId } },
            summary: 'Analysis failed',
            insights_json: [],
            focus_json: [],
            themes: [],
            patterns: [],
            tensions: [],
            ability_signals_json: [],
            status: 'error',
            analysis_error: error instanceof Error ? error.message : String(error),
          },
        });
      }

      throw error;
    }
  }

  /**
   * Обработать генерацию квестов через orchestration
   */
  private async handleQuestGeneration(sessionId: string): Promise<void> {
    if (!this.questOrchestrationService) {
      this.logger.warn('QuestOrchestrationService not available, skipping quest generation');
      return;
    }

    try {
      const count = await this.questOrchestrationService.handleSessionAnalyzed(sessionId);
      this.logger.log(`✅ Orchestrated generation of ${count} quests for session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to orchestrate quest generation:`, error);
    }
  }

  /**
   * Создать rationale для результатов анализа
   * Объясняет как система пришла к выводам
   * 
   * @see packages/shared/src/ontology.ts для структуры Rationale
   */
  private createAnalysisRationale(params: {
    themes: string[];
    patterns: string[];
    abilitySignals: AbilitySignal[];
    entryId: string;
  }): Rationale {
    const { themes, patterns, abilitySignals, entryId } = params;
    
    const reasons: string[] = [];
    
    // Описываем выявленные темы
    if (themes.length > 0) {
      reasons.push(`Выявлено ${themes.length} ключевых тем: ${themes.slice(0, 3).join(', ')}${themes.length > 3 ? '...' : ''}`);
    }
    
    // Описываем паттерны
    if (patterns.length > 0) {
      reasons.push(`Обнаружено ${patterns.length} паттернов поведения`);
    }
    
    // Описываем связь со способностями
    if (abilitySignals.length > 0) {
      const nodeIds = abilitySignals.map((s) => s.node_id);
      reasons.push(`Связь с ${abilitySignals.length} способностями в дереве`);
    }
    
    // Определяем уверенность на основе количества данных
    const confidence = Math.min(
      0.5 + (themes.length * 0.1) + (patterns.length * 0.05) + (abilitySignals.length * 0.1),
      0.95,
    );
    
    return {
      summary: `Анализ ситуации выявил ${themes.length} тем, ${patterns.length} паттернов и ${abilitySignals.length} связей со способностями`,
      reasons,
      evidenceLinks: [entryId],
      linkedNodes: abilitySignals.map((s) => s.node_id),
      confidence,
    };
  }
}

