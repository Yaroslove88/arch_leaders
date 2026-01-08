import { Injectable, NotFoundException, BadRequestException, Inject, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TreeService } from '../tree/tree.service';
import { Prisma } from '@prisma/client';
import {
  parseStepsJson,
  parseCriteriaJson,
  parseRewardJson,
  validateStepsJson,
  validateCriteriaJson,
  validateRewardJson,
} from '../common/mappers/quest.mapper';

interface CreateQuestDto {
  title: string;
  description: string;
  type: 'micro' | 'weekly' | 'story' | 'in-person';
  status?: 'backlog' | 'active' | 'completed' | 'failed' | 'archived';
  steps?: Array<{ id: string; description: string; completed?: boolean }>;
  criteria: {
    type: 'count' | 'evidence' | 'streak' | 'custom';
    target?: number;
    description: string;
    theory_and_examples?: string;
  };
  reward?: {
    xp?: number;
    skill_xp?: number;
    artifact?: string;
  };
  linked_nodes?: string[];
  evidence_links?: any[];
  due_hint?: string;
  source?: string;
  tags?: string[];
  session_id?: string;
}

@Injectable()
export class QuestsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TreeService) private readonly treeService: TreeService,
  ) {
    if (!this.prisma) {
      throw new InternalServerErrorException('PrismaService injection failed');
    }
    if (!this.treeService) {
      throw new InternalServerErrorException('TreeService injection failed');
    }
  }

  /**
   * Получить все квесты пользователя
   */
  async getAll(status?: 'active' | 'backlog' | 'done' | 'archived', userId?: string) {
    if (!this.prisma?.quest) {
      throw new InternalServerErrorException('Prisma quest model is not available');
    }

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (userId) {
      where.userId = userId;
    }

    const quests = await this.prisma.quest.findMany({
      where,
      include: {
        session: {
          select: {
            id: true,
            summary: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      quests: quests.map((q) => this.transformQuest(q)),
      count: quests.length,
      status: status || 'all',
    };
  }

  /**
   * Получить квест по ID
   */
  async getById(id: string) {
    const quest = await this.prisma.quest.findUnique({
      where: { id },
      include: {
        session: true,
      },
    });

    if (!quest) {
      throw new NotFoundException(`Quest ${id} not found`);
    }

    return this.transformQuest(quest);
  }

  /**
   * Создать новый квест
   */
  async create(createDto: CreateQuestDto, userId?: string) {
    // Валидация
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    if (!createDto.title || createDto.title.trim().length === 0) {
      throw new BadRequestException('title is required');
    }

    if (!createDto.description || createDto.description.trim().length === 0) {
      throw new BadRequestException('description is required');
    }

    const validTypes = ['micro', 'weekly', 'story', 'in-person'];
    if (!validTypes.includes(createDto.type)) {
      throw new BadRequestException(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Автоматическое связывание с узлами дерева, если не указано явно
    let linkedNodes = createDto.linked_nodes || [];
    if (linkedNodes.length === 0 && createDto.title && createDto.description) {
      // Простая логика связывания по ключевым словам
      linkedNodes = await this.autoLinkNodes(createDto.title + ' ' + createDto.description);
    }

    const quest = await this.prisma.quest.create({
      data: {
        userId,
        title: createDto.title,
        description: createDto.description,
        type: createDto.type,
        status: createDto.status || 'backlog',
        steps_json: validateStepsJson(createDto.steps || []),
        criteria_json: validateCriteriaJson(createDto.criteria),
        reward_json: validateRewardJson(createDto.reward) || Prisma.JsonNull,
        linked_nodes: linkedNodes,
        evidence_links_json: createDto.evidence_links || [],
        due_hint: createDto.due_hint || null,
        source: createDto.source || null,
        tags: createDto.tags || [],
        session_id: createDto.session_id || null,
      },
      include: {
        session: true,
      },
    });

    return this.transformQuest(quest);
  }

  /**
   * Обновить квест
   */
  async update(id: string, updateDto: Partial<CreateQuestDto>) {
    const quest = await this.prisma.quest.findUnique({
      where: { id },
    });

    if (!quest) {
      throw new NotFoundException(`Quest ${id} not found`);
    }

    const updateData: any = {};

    if (updateDto.title !== undefined) {
      updateData.title = updateDto.title;
    }

    if (updateDto.description !== undefined) {
      updateData.description = updateDto.description;
    }

    if (updateDto.steps !== undefined) {
      updateData.steps_json = validateStepsJson(updateDto.steps);
    }

    if (updateDto.criteria !== undefined) {
      updateData.criteria_json = validateCriteriaJson(updateDto.criteria);
    }

    if (updateDto.reward !== undefined) {
      updateData.reward_json = validateRewardJson(updateDto.reward) || Prisma.JsonNull;
    }

    if (updateDto.linked_nodes !== undefined) {
      updateData.linked_nodes = updateDto.linked_nodes;
    }

    if (updateDto.tags !== undefined) {
      updateData.tags = updateDto.tags;
    }

    const updated = await this.prisma.quest.update({
      where: { id },
      data: updateData,
      include: {
        session: true,
      },
    });

    return this.transformQuest(updated);
  }

  /**
   * Удалить квест
   */
  async delete(id: string) {
    const quest = await this.prisma.quest.findUnique({
      where: { id },
    });

    if (!quest) {
      throw new NotFoundException(`Quest ${id} not found`);
    }

    await this.prisma.quest.delete({
      where: { id },
    });

    return { success: true, message: `Quest ${id} deleted` };
  }

  /**
   * Активировать квест
   */
  async activate(id: string) {
    const quest = await this.prisma.quest.findUnique({
      where: { id },
    });

    if (!quest) {
      throw new NotFoundException(`Quest ${id} not found`);
    }

    // Проверяем лимит активных квестов (5)
    const activeCount = await this.prisma.quest.count({
      where: { status: 'active' },
    });

    if (activeCount >= 5 && quest.status !== 'active') {
      throw new BadRequestException('Maximum 5 active quests allowed. Please complete or archive some quests first.');
    }

    const updated = await this.prisma.quest.update({
      where: { id },
      data: { status: 'active' },
      include: {
        session: true,
      },
    });

    return this.transformQuest(updated);
  }

  /**
   * Завершить квест
   */
  async complete(id: string, evidenceId?: string) {
    const quest = await this.prisma.quest.findUnique({
      where: { id },
    });

    if (!quest) {
      throw new NotFoundException(`Quest ${id} not found`);
    }

    // Обновляем статус
    const updated = await this.prisma.quest.update({
      where: { id },
      data: {
        status: 'done',
        completed_at: new Date(),
      },
      include: {
        session: true,
      },
    });

    // Начисляем XP на связанные узлы
    if (quest.linked_nodes && quest.linked_nodes.length > 0) {
      const reward = parseRewardJson(quest.reward_json);
      const xpPerNode = reward?.skill_xp || 50;

      // Используем userId из квеста для обновления пользовательского дерева
      const userId = quest.userId;

      for (const nodeId of quest.linked_nodes) {
        try {
          await this.treeService.updateNodeProgress(nodeId, xpPerNode, userId);
        } catch (error) {
          // Игнорируем ошибки, если узел не найден
          console.warn(`Failed to update node ${nodeId} for user ${userId}:`, error);
        }
      }
    }

    return this.transformQuest(updated);
  }

  /**
   * Обновить статус квеста
   */
  async updateStatus(id: string, status: 'active' | 'backlog' | 'done' | 'archived') {
    const quest = await this.prisma.quest.findUnique({
      where: { id },
    });

    if (!quest) {
      throw new NotFoundException(`Quest ${id} not found`);
    }

    // Проверка лимита активных квестов
    if (status === 'active') {
      const activeCount = await this.prisma.quest.count({
        where: { status: 'active' },
      });

      if (activeCount >= 5 && quest.status !== 'active') {
        throw new BadRequestException('Maximum 5 active quests allowed');
      }
    }

    const updated = await this.prisma.quest.update({
      where: { id },
      data: { status },
      include: {
        session: true,
      },
    });

    return this.transformQuest(updated);
  }

  /**
   * Автоматическое связывание квеста с узлами дерева
   */
  private async autoLinkNodes(text: string): Promise<string[]> {
    try {
      const tree = await this.treeService.getSemantic();
      const linkedNodes: string[] = [];
      const lowerText = text.toLowerCase();

      // Простая логика по ключевым словам
      const keywords: Record<string, string[]> = {
        node_containment: ['контейнирование', 'удержание', 'напряжение'],
        node_grounding: ['заземление', 'реальность', 'факты'],
        node_system_thinking: ['система', 'системное мышление', 'целое'],
        node_design_thinking: ['дизайн', 'проектирование', 'решение'],
        node_stress_tolerance: ['стресс', 'давление', 'выдерживание'],
        node_recovery: ['восстановление', 'отдых', 'регенерация'],
        node_ownership: ['владение', 'ответственность', 'результат'],
        node_accountability: ['подотчетность', 'последствия', 'ответ'],
        node_giving_feedback: ['обратная связь', 'давать', 'критика'],
        node_receiving_feedback: ['принимать', 'обратная связь', 'отзыв'],
        node_team_development: ['команда', 'развитие', 'рост'],
        node_organizational_culture: ['культура', 'организация', 'среда'],
      };

      for (const [nodeId, keywordsList] of Object.entries(keywords)) {
        if (keywordsList.some((keyword) => lowerText.includes(keyword))) {
          linkedNodes.push(nodeId);
        }
      }

      return linkedNodes;
    } catch {
      return [];
    }
  }

  /**
   * Трансформация квеста для ответа
   */
  /**
   * Обновить теорию квеста
   */
  async updateQuestTheory(questId: string, theory: string) {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    const criteria = parseCriteriaJson(quest.criteria_json);
    criteria.theory_and_examples = theory;

    const updated = await this.prisma.quest.update({
      where: { id: questId },
      data: {
        criteria_json: validateCriteriaJson(criteria),
      },
      include: {
        session: true,
      },
    });

    return this.transformQuest(updated);
  }

  /**
   * Найти квесты по названию или связанным узлам и обновить теорию
   */
  async updateQuestsTheoryByMapping(mapping: Array<{
    title?: string;
    linkedNodes?: string[];
    theory: string;
  }>): Promise<{ updated: number; notFound: string[] }> {
    let updated = 0;
    const notFound: string[] = [];

    for (const item of mapping) {
      let quests: any[] = [];

      if (item.title) {
        // Ищем по названию (частичное совпадение)
        quests = await this.prisma.quest.findMany({
          where: {
            title: {
              contains: item.title,
              mode: 'insensitive',
            },
          },
        });
      }

      if (quests.length === 0 && item.linkedNodes && item.linkedNodes.length > 0) {
        // Ищем по связанным узлам
        quests = await this.prisma.quest.findMany({
          where: {
            linked_nodes: {
              hasSome: item.linkedNodes,
            },
          },
        });
      }

      if (quests.length > 0) {
        for (const quest of quests) {
          const criteria = parseCriteriaJson(quest.criteria_json);
          criteria.theory_and_examples = item.theory;

          await this.prisma.quest.update({
            where: { id: quest.id },
            data: {
              criteria_json: validateCriteriaJson(criteria),
            },
          });
          updated++;
        }
      } else {
        notFound.push(item.title || item.linkedNodes?.join(', ') || 'unknown');
      }
    }

    return { updated, notFound };
  }

  /**
   * Синхронизировать квест из шаблона (обновить description, steps, criteria)
   */
  async syncQuestFromTemplate(questId: string, template: {
    description?: string;
    steps?: any[];
    criteria?: any;
  }): Promise<{ success: boolean; message: string }> {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    const updateData: any = {};

    if (template.description !== undefined) {
      updateData.description = template.description;
    }

    if (template.steps !== undefined) {
      updateData.steps_json = validateStepsJson(template.steps);
    }

    if (template.criteria !== undefined) {
      updateData.criteria_json = validateCriteriaJson(template.criteria);
    }

    await this.prisma.quest.update({
      where: { id: questId },
      data: updateData,
    });

    return { success: true, message: `Quest ${questId} synced from template` };
  }

  /**
   * Синхронизировать все квесты из шаблонов
   */
  async syncAllQuestsFromTemplates(templates: Array<{
    id: string;
    description?: string;
    steps?: any[];
    criteria?: any;
  }>): Promise<{ updated: number; notFound: string[]; errors: Array<{ id: string; error: string }> }> {
    let updated = 0;
    const notFound: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const template of templates) {
      try {
        await this.syncQuestFromTemplate(template.id, {
          description: template.description,
          steps: template.steps,
          criteria: template.criteria,
        });
        updated++;
      } catch (error: any) {
        if (error instanceof NotFoundException) {
          notFound.push(template.id);
        } else {
          errors.push({ id: template.id, error: error.message || String(error) });
        }
      }
    }

    return { updated, notFound, errors };
  }

  private transformQuest(quest: any) {
    if (!quest) {
      return null;
    }

    return {
      id: quest?.id,
      title: quest?.title,
      description: quest?.description,
      type: quest?.type,
      status: quest?.status,
      steps: quest?.steps_json,
      criteria: quest?.criteria_json,
      reward: quest?.reward_json,
      linked_nodes: quest?.linked_nodes,
      evidence_links: quest?.evidence_links_json,
      due_hint: quest?.due_hint,
      source: quest?.source,
      tags: quest?.tags,
      created_at: quest?.created_at,
      updated_at: quest?.updated_at,
      completed_at: quest?.completed_at,
      session: quest?.session || null,
    };
  }
}

