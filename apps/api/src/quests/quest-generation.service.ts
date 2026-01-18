import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TreeService } from '../tree/tree.service';
import { LLMService } from '../llm/llm.service';
import {
  parseAbilitySignalsJson,
  parseFocusJson,
} from '../common/mappers/session.mapper';
import type { AbilitySignal, FocusPoint } from '../common/schemas/session.schema';
import { SessionAnalysisResult, GeneratedQuest } from './quest-generation.types';
import { QuestEngine } from './quest-engine.service';
import type { NodeInfo } from './quest-engine.types';
import { Rationale, DecisionType } from '@leadership-architect/shared';

/**
 * Сервис для генерации квестов на основе анализа
 * Чистый генератор - не сохраняет в БД, только генерирует данные
 */
@Injectable()
export class QuestGenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly treeService: TreeService,
    private readonly llmService: LLMService,
    private readonly questEngine: QuestEngine,
  ) {}

  /**
   * Получить результат анализа сессии для генерации квестов
   */
  async getSessionAnalysisResult(sessionId: string): Promise<SessionAnalysisResult> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        entry: true,
      },
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const abilitySignals = parseAbilitySignalsJson(session.ability_signals_json);
    const themes = session.themes || [];
    const patterns = session.patterns || [];
    const focus = parseFocusJson(session.focus_json);

    return {
      userId: session.userId,
      abilitySignals,
      themes,
      patterns,
      focus,
    };
  }

  /**
   * Генерировать квесты на основе результата анализа
   * Возвращает массив сгенерированных квестов (не сохраняет в БД)
   * Использует QuestEngine для детерминированных правил
   */
  async generateQuests(analysisResult: SessionAnalysisResult, sessionId: string): Promise<GeneratedQuest[]> {
    const { userId, abilitySignals, themes, focus } = analysisResult;

    // Загружаем информацию об узлах для QuestEngine
    const nodeInfos = await this.loadNodeInfos(abilitySignals.map((s) => s.node_id));

    // Используем QuestEngine для генерации структуры квестов
    const engineResult = this.questEngine.generateQuests({
      userId,
      sessionId,
      abilitySignals,
      themes,
      patterns: analysisResult.patterns,
      focus,
      nodeInfos,
    });

    // Преобразуем результат QuestEngine в GeneratedQuest и добавляем теорию через LLM
    const generatedQuests: GeneratedQuest[] = [];

    for (const questData of engineResult.quests) {
      // Гарантируем наличие description в criteria и преобразуем theory_and_examples в строку
      const theoryAndExamples = questData.criteria.theory_and_examples;
      const theoryAndExamplesString = typeof theoryAndExamples === 'string' 
        ? theoryAndExamples 
        : typeof theoryAndExamples === 'object' && theoryAndExamples !== null
          ? [theoryAndExamples.theory, theoryAndExamples.examples].filter(Boolean).join('\n\n')
          : undefined;

      const criteria = {
        type: questData.criteria.type,
        target: questData.criteria.target,
        description: questData.criteria.description || '',
        theory_and_examples: theoryAndExamplesString,
      };

      // Создаём rationale для объяснимости
      const rationale = this.createQuestRationale({
        questTitle: questData.title,
        linkedNodes: questData.linked_nodes || [],
        themes,
        sessionId,
        nodeInfos,
      });

      const generatedQuest: GeneratedQuest = {
        userId,
        title: questData.title,
        description: questData.description,
        type: questData.type,
        criteria,
        reward: questData.reward || undefined,
        linked_nodes: questData.linked_nodes,
        session_id: sessionId,
        source: 'session_analysis',
        tags: questData.tags,
        rationale,
      };

      // Генерируем теорию и примеры для квеста через LLM
      try {
        const nodeId = questData.linked_nodes?.[0];
        const abilityNode = nodeId ? await this.getAbilityNode(nodeId) : undefined;

        console.log(`[QuestGeneration] Generating theory for quest: ${generatedQuest.title}`);
        const theoryAndExamples = await this.llmService.generateQuestTheory(generatedQuest, abilityNode);
        if (theoryAndExamples && theoryAndExamples.trim().length > 0) {
          generatedQuest.criteria.theory_and_examples = theoryAndExamples;
          console.log(`[QuestGeneration] Theory generated successfully, length: ${theoryAndExamples.length}`);
        } else {
          console.warn(`[QuestGeneration] Theory generation returned empty result for quest: ${generatedQuest.title}`);
        }
      } catch (error) {
        console.error('[QuestGeneration] Failed to generate quest theory:', error);
        // Продолжаем без теории, если генерация не удалась
      }

      generatedQuests.push(generatedQuest);
    }

    return generatedQuests;
  }

  /**
   * Генерировать квесты на основе Session (удобный метод для обратной совместимости)
   * @deprecated Используйте getSessionAnalysisResult + generateQuests
   */
  async generateQuestsFromSession(sessionId: string): Promise<GeneratedQuest[]> {
    const analysisResult = await this.getSessionAnalysisResult(sessionId);
    return this.generateQuests(analysisResult, sessionId);
  }

  /**
   * Загрузить информацию об узлах для QuestEngine
   */
  private async loadNodeInfos(nodeIds: string[]): Promise<Map<string, NodeInfo>> {
    if (nodeIds.length === 0) {
      return new Map();
    }

    const nodeInfos = new Map<string, NodeInfo>();
    const missing: string[] = [];

    try {
      const tree = await this.treeService.getSemantic();
      for (const nodeId of nodeIds) {
        const node = tree.nodes.find((n) => n.node_id === nodeId);
        if (node) {
          nodeInfos.set(nodeId, {
            node_id: node.node_id,
            name: node.name,
            level: (node as any).level,
            branch: (node as any).branch,
          });
        } else {
          missing.push(nodeId);
        }
      }
      if (missing.length > 0) {
        console.warn(
          `[QuestGeneration] nodeIds not found in tree: ${missing
            .slice(0, 5)
            .join(', ')}${missing.length > 5 ? '...' : ''}`,
        );
      }
    } catch (error) {
      console.error('[QuestGeneration] Failed to load node infos:', error);
    }

    return nodeInfos;
  }

  /**
   * Получить название узла по ID
   */
  private async getNodeName(nodeId: string): Promise<string> {
    try {
      const tree = await this.treeService.getSemantic();
      const node = tree.nodes.find((n) => n.node_id === nodeId);
      return node?.name || nodeId;
    } catch {
      return nodeId;
    }
  }

  /**
   * Получить информацию об узле способности
   */
  private async getAbilityNode(nodeId: string): Promise<{
    node_id: string;
    name?: string;
    full_description?: string;
    practical_meaning?: string;
    examples?: string[];
  } | undefined> {
    try {
      const tree = await this.treeService.getSemantic();
      const node = tree.nodes.find((n) => n.node_id === nodeId);
      if (!node) return undefined;

      return {
        node_id: node.node_id,
        name: node.name,
        full_description: (node as any).full_description,
        practical_meaning: (node as any).practical_meaning,
        examples: (node as any).examples || [],
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Управление лимитом активных квестов
   * Возвращает список ID квестов, которые нужно перевести в backlog
   * (не выполняет обновление - это делает репозиторий)
   */
  async getQuestsToArchive(activeQuests: Array<{ id: string; created_at: Date }>): Promise<string[]> {
    if (activeQuests.length <= 5) {
      return [];
    }

    // Возвращаем ID старых квестов для архивации
    return activeQuests.slice(5).map((quest) => quest.id);
  }

  /**
   * Создать rationale для сгенерированного квеста
   * Объясняет почему именно этот квест был создан
   * 
   * @see packages/shared/src/ontology.ts для структуры Rationale
   */
  private createQuestRationale(params: {
    questTitle: string;
    linkedNodes: string[];
    themes: string[];
    sessionId: string;
    nodeInfos: Map<string, NodeInfo>;
  }): Rationale {
    const { questTitle, linkedNodes, themes, sessionId, nodeInfos } = params;
    
    const reasons: string[] = [];
    
    // Добавляем причины на основе связанных узлов
    if (linkedNodes.length > 0) {
      const nodeNames = linkedNodes
        .map((id) => nodeInfos.get(id)?.name || id)
        .join(', ');
      reasons.push(`Связан с развитием способностей: ${nodeNames}`);
    }
    
    // Добавляем причины на основе тем анализа
    if (themes.length > 0) {
      reasons.push(`Основан на темах из анализа: ${themes.slice(0, 3).join(', ')}`);
    }
    
    // Добавляем связь с сессией
    reasons.push(`Сгенерирован на основе анализа сессии`);
    
    return {
      summary: `Квест "${questTitle}" создан для развития выявленных в анализе способностей`,
      reasons,
      evidenceLinks: [sessionId],
      linkedNodes,
      confidence: linkedNodes.length > 0 ? 0.8 : 0.6,
    };
  }
}

