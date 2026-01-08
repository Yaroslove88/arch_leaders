import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestOrchestrationService } from '../../orchestration/quest-orchestration.service';
import { PipelineService } from '../../pipeline/pipeline.service';
import type { ClaimedJob } from '../jobs.service';
import type { PipelineConfig } from '../../pipeline/pipeline.types';

/**
 * Обработчик задачи анализа записи
 * Использует staged pipeline для анализа
 */
@Injectable()
export class AnalyzeEntryHandler {
  private readonly logger = new Logger(AnalyzeEntryHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly questOrchestration: QuestOrchestrationService,
    private readonly pipelineService: PipelineService,
  ) {}

  /**
   * Обработать задачу анализа записи
   */
  async handle(job: ClaimedJob): Promise<void> {
    const entryId = job.entityId;

    if (!entryId) {
      throw new Error('Entry ID is required for analyze_entry job');
    }

    this.logger.log(`Processing analyze_entry job ${job.id} for entry ${entryId}`);

    try {
      // Получаем entry для получения userId
      const entry = await this.prisma.entry.findUnique({
        where: { id: entryId },
        select: { id: true, userId: true },
      });

      if (!entry) {
        throw new Error(`Entry ${entryId} not found`);
      }

      // Получаем конфигурацию pipeline из params job
      const jobParams = job.params as { config?: PipelineConfig; fromStage?: string } | null;
      const config: PipelineConfig = jobParams?.config || {
        stagesEnabled: {
          preprocess: true,
          extract: true,
          signals: true,
          apply: true,
          quests: true,
        },
        fromStage: jobParams?.fromStage as any,
      };

      // Проверяем существующую сессию
      const existingSession = await this.prisma.session.findUnique({
        where: { entry_id: entryId },
        select: { id: true },
      });

      // Запускаем staged pipeline
      const result = await this.pipelineService.runPipeline({
        entryId,
        sessionId: existingSession?.id,
        userId: entry.userId,
        config,
      });

      // Генерируем квесты через orchestration (если этап quests включен и успешен)
      if (config.stagesEnabled.quests && result.stages.quests.success) {
        this.questOrchestration
          .handleSessionAnalyzed(result.sessionId)
          .catch((error) => {
            this.logger.error(`Failed to generate quests for session ${result.sessionId}:`, error);
            // Не проваливаем job, если генерация квестов не удалась
          });
      }

      this.logger.log(`Successfully processed analyze_entry job ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed to process analyze_entry job ${job.id}:`, error);
      throw error;
    }
  }
}

