import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntriesService } from '../entries/entries.service';
import { AnalysisParserService } from '../sync/analysis-parser.service';
import { QuestGenerationService } from '../quests/quest-generation.service';
import { QuestsService } from '../quests/quests.service';
import { EvidenceService } from '../evidence/evidence.service';
import { TreeService } from '../tree/tree.service';
import { CoreLoopStage, Rationale, NodeState } from '@leadership-architect/shared';
import {
  CoreLoopProcessRequest,
  CoreLoopProcessResponse,
  CoreLoopCompleteRequest,
  CoreLoopCompleteResponse,
  TreeChange,
} from './core-loop.types';

/**
 * Сервис для управления Core Loop
 * Объединяет Entry -> Analysis -> Quest -> Evidence -> Tree Update в единый поток
 * 
 * @see docs/DECISION_LOGIC.md для логики Core Loop
 * @see packages/shared/src/ontology.ts для типов
 */
@Injectable()
export class CoreLoopService {
  private readonly logger = new Logger(CoreLoopService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entriesService: EntriesService,
    private readonly analysisParser: AnalysisParserService,
    private readonly questGeneration: QuestGenerationService,
    private readonly questsService: QuestsService,
    private readonly evidenceService: EvidenceService,
    private readonly treeService: TreeService,
  ) {}

  /**
   * Обработать ситуацию через Core Loop
   * Entry -> Analysis -> Quest (опционально)
   */
  async process(
    userId: string,
    request: CoreLoopProcessRequest,
  ): Promise<CoreLoopProcessResponse> {
    this.logger.log(`[CoreLoop] Processing situation for user ${userId}`);

    // 1. Создаём Entry
    const entry = await this.entriesService.create(userId, {
      text: request.text,
      type: request.type || 'situation',
      source: 'core-loop',
      participants: request.participants || [],
      context_json: request.context || {},
    });

    this.logger.log(`[CoreLoop] Entry created: ${entry.id}`);

    // 2. Анализируем через LLM
    const analysis = await this.analysisParser.analyzeEntry(entry.id);

    // Получаем session для ответа
    const session = await this.prisma.session.findUnique({
      where: { entry_id: entry.id },
    });

    if (!session) {
      throw new NotFoundException(`Session for entry ${entry.id} not found`);
    }

    this.logger.log(`[CoreLoop] Analysis completed: ${session.id}`);

    // 3. Генерируем квест (если запрошено)
    let questResponse: CoreLoopProcessResponse['quest'] | undefined;

    if (request.generateQuest !== false) {
      try {
        const analysisResult = await this.questGeneration.getSessionAnalysisResult(session.id);
        const generatedQuests = await this.questGeneration.generateQuests(analysisResult, session.id);

        if (generatedQuests.length > 0) {
          // Сохраняем первый квест
          const quest = await this.questsService.create({
            title: generatedQuests[0].title,
            description: generatedQuests[0].description,
            type: generatedQuests[0].type as 'micro' | 'weekly' | 'story' | 'in-person',
            criteria: {
              type: generatedQuests[0].criteria?.type || 'custom',
              target: generatedQuests[0].criteria?.target,
              description: generatedQuests[0].criteria?.description || '',
              theory_and_examples: generatedQuests[0].criteria?.theory_and_examples,
            },
            reward: generatedQuests[0].reward,
            linked_nodes: generatedQuests[0].linked_nodes,
            session_id: session.id,
            source: 'core-loop',
            tags: generatedQuests[0].tags,
          }, userId);

          if (quest) {
            questResponse = {
              id: quest.id,
              title: quest.title,
              description: quest.description || '',
              type: quest.type,
              linked_nodes: quest.linked_nodes || [],
              rationale: generatedQuests[0].rationale,
            };

            this.logger.log(`[CoreLoop] Quest created: ${quest.id}`);
          }
        }
      } catch (error) {
        this.logger.warn(`[CoreLoop] Quest generation failed: ${error}`);
        // Продолжаем без квеста
      }
    }

    return {
      entry: {
        id: entry.id,
        text: entry.text,
        type: entry.type,
        created_at: entry.created_at,
      },
      session: {
        id: session.id,
        summary: session.summary,
        themes: session.themes,
        patterns: session.patterns,
        ability_signals: analysis.ability_signals.map((s) => ({
          node_id: s.node_id,
          signal: s.signal,
        })),
        rationale: analysis.rationale,
      },
      quest: questResponse,
      currentStage: questResponse ? CoreLoopStage.QUEST : CoreLoopStage.ANALYSIS,
    };
  }

  /**
   * Завершить квест с evidence
   * Evidence -> Quest Completion -> Tree Update
   */
  async complete(
    userId: string,
    request: CoreLoopCompleteRequest,
  ): Promise<CoreLoopCompleteResponse> {
    this.logger.log(`[CoreLoop] Completing quest ${request.questId} for user ${userId}`);

    // 1. Проверяем квест
    const quest = await this.prisma.quest.findUnique({
      where: { id: request.questId },
    });

    if (!quest || quest.userId !== userId) {
      throw new NotFoundException(`Quest ${request.questId} not found`);
    }

    // 2. Создаём Evidence
    const evidence = await this.evidenceService.create(userId, {
      quest_id: request.questId,
      type: 'reflection',
      text: `${request.evidence.what_happened}\n\n---\n\n${request.evidence.what_noticed}`,
    });

    if (!evidence) {
      throw new NotFoundException(`Failed to create evidence`);
    }

    this.logger.log(`[CoreLoop] Evidence created: ${evidence.id}`);

    // 3. Обновляем дерево и собираем изменения
    const treeChanges: TreeChange[] = [];
    const linkedNodes = quest.linked_nodes || [];

    for (const nodeId of linkedNodes) {
      try {
        // Получаем текущее состояние узла
        const treeBefore = await this.treeService.getSemantic(userId);
        const nodeBefore = treeBefore.nodes.find((n) => n.node_id === nodeId);

        if (!nodeBefore) continue;

        const xpBefore = nodeBefore.xp_current || 0;
        const stateBefore = nodeBefore.state;

        // Добавляем XP (базово 10 XP за evidence)
        const xpDelta = 10;
        const updatedNode = await this.treeService.updateNodeProgress(nodeId, xpDelta, userId);

        // Проверяем новые разблокированные узлы
        const treeAfter = await this.treeService.getSemantic(userId);
        const newlyUnlocked = treeAfter.nodes
          .filter((n) => {
            const before = treeBefore.nodes.find((b) => b.node_id === n.node_id);
            return before?.state === NodeState.LOCKED && n.state === NodeState.AVAILABLE;
          })
          .map((n) => n.node_id);

        treeChanges.push({
          node_id: nodeId,
          node_name: updatedNode.name,
          xpBefore,
          xpAfter: updatedNode.xp_current,
          xpDelta,
          stateBefore: stateBefore as string,
          stateAfter: updatedNode.state as string,
          newlyUnlocked: newlyUnlocked.length > 0 ? newlyUnlocked : undefined,
        });
      } catch (error) {
        this.logger.warn(`[CoreLoop] Failed to update node ${nodeId}: ${error}`);
      }
    }

    // 4. Обновляем статус квеста
    await this.prisma.quest.update({
      where: { id: quest.id },
      data: { status: 'done', completed_at: new Date() },
    });

    this.logger.log(`[CoreLoop] Quest completed: ${quest.id}`);

    // 5. Создаём rationale для изменений
    const rationale: Rationale = {
      summary: `Квест "${quest.title}" завершён, дерево обновлено`,
      reasons: [
        `Evidence добавлен: "${request.evidence.what_noticed.slice(0, 50)}..."`,
        `Обновлено ${treeChanges.length} узлов`,
        ...treeChanges
          .filter((c) => c.stateBefore !== c.stateAfter)
          .map((c) => `${c.node_name || c.node_id}: ${c.stateBefore} → ${c.stateAfter}`),
      ],
      evidenceLinks: [evidence.id],
      linkedNodes,
      confidence: 1.0,
    };

    return {
      evidence: {
        id: evidence.id,
        what_happened: request.evidence.what_happened,
        what_noticed: request.evidence.what_noticed,
        created_at: evidence.created_at,
      },
      questCompleted: true,
      treeChanges,
      rationale,
      currentStage: CoreLoopStage.TREE_UPDATE,
    };
  }
}
