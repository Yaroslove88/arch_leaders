import { Injectable, Logger } from '@nestjs/common';
import { QuestGenerationService } from '../quests/quest-generation.service';
import { QuestRepository } from '../quests/quest.repository';
import type { GeneratedQuest } from '../quests/quest-generation.types';

/**
 * Сервис оркестрации для управления жизненным циклом квестов
 * Разрывает циклическую зависимость между Sync и Quests
 */
@Injectable()
export class QuestOrchestrationService {
  private readonly logger = new Logger(QuestOrchestrationService.name);

  constructor(
    private readonly questGenerationService: QuestGenerationService,
    private readonly questRepository: QuestRepository,
  ) {}

  /**
   * Обработать завершенный анализ сессии и сгенерировать квесты
   * @param sessionId ID сессии, для которой нужно сгенерировать квесты
   */
  async handleSessionAnalyzed(sessionId: string): Promise<number> {
    this.logger.log(`🎯 Handling session analyzed: ${sessionId}`);

    try {
      // Получаем результат анализа сессии
      const analysisResult = await this.questGenerationService.getSessionAnalysisResult(sessionId);

      // Генерируем квесты через QuestGenerationService (чистая генерация, без сохранения)
      const generatedQuests: GeneratedQuest[] = await this.questGenerationService.generateQuests(
        analysisResult,
        sessionId,
      );

      this.logger.log(`✅ Generated ${generatedQuests.length} quests for session ${sessionId}`);

      // Сохраняем квесты через репозиторий
      if (generatedQuests.length > 0) {
        await this.questRepository.createMany(
          generatedQuests.map((quest) => ({
            userId: quest.userId,
            title: quest.title,
            description: quest.description,
            type: quest.type,
            status: 'backlog',
            steps: [],
            criteria: quest.criteria,
            reward: quest.reward,
            linked_nodes: quest.linked_nodes || [],
            evidence_links: [],
            source: quest.source,
            tags: quest.tags,
            session_id: quest.session_id,
          })),
        );
      }

      // Управляем лимитом активных квестов
      await this.manageActiveQuestLimit();

      return generatedQuests.length;
    } catch (error) {
      this.logger.error(`❌ Failed to handle session analyzed ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Управление лимитом активных квестов
   * Переводит лишние квесты в backlog
   */
  private async manageActiveQuestLimit(): Promise<number> {
    const activeQuests = await this.questRepository.findActiveQuests();

    if (activeQuests.length <= 5) {
      return 0;
    }

    // Получаем список квестов для архивации через генератор
    const questsToArchive = await this.questGenerationService.getQuestsToArchive(activeQuests);

    // Переводим старые квесты в backlog через репозиторий
    let archivedCount = 0;
    for (const questId of questsToArchive) {
      await this.questRepository.updateStatus(questId, 'backlog');
      archivedCount++;
    }

    return archivedCount;
  }
}

