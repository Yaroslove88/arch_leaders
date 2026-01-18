import { Injectable, NotFoundException, BadRequestException, Inject, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TreeService } from '../tree/tree.service';
import { AbilityStateService } from '../ability/ability-state.service';
import { Prisma } from '@prisma/client';
import {
  parseStepsJson,
  parseCriteriaJson,
  parseRewardJson,
  validateStepsJson,
  validateCriteriaJson,
  validateRewardJson,
} from '../common/mappers/quest.mapper';
import { CreateQuestDto, UpdateQuestDto } from '../common/dto';

interface EvidenceLink {
  evidence_id: string;
  type: string;
}

@Injectable()
export class QuestsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TreeService) private readonly treeService: TreeService,
    @Inject(AbilityStateService) private readonly abilityStateService: AbilityStateService,
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
        evidence_links_json: (createDto.evidence_links && createDto.evidence_links.length > 0) ? (createDto.evidence_links as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
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
  async update(id: string, updateDto: UpdateQuestDto) {
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
  async activate(id: string, userId?: string) {
    const quest = await this.prisma.quest.findUnique({
      where: { id },
    });

    if (!quest) {
      throw new NotFoundException(`Quest ${id} not found`);
    }

    // Проверяем лимит активных квестов (5) для конкретного пользователя
    const activeCount = await this.prisma.quest.count({
      where: {
        status: 'active',
        ...(userId ? { userId } : { userId: quest.userId }),
      },
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
   * Новая система: проверяет наличие рефлексии и начисляет Base XP + Reflection XP
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

    // Начисляем опыт на связанные узлы через новую систему опыта
    if (quest.linked_nodes && quest.linked_nodes.length > 0) {
      const userId = quest.userId;

      // Проверяем наличие рефлексии (Evidence с типом 'reflection' для этого квеста)
      // Минимальная длина: 300 символов согласно PRD
      const MIN_REFLECTION_LENGTH = 300;

      const reflectionEvidence = await this.prisma.evidence.findFirst({
        where: {
          quest_id: id,
          userId: userId,
          type: 'reflection',
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      const hasReflection =
        reflectionEvidence &&
        reflectionEvidence.text &&
        reflectionEvidence.text.trim().length >= MIN_REFLECTION_LENGTH;

      // Определяем награды на основе типа квеста
      const rewardMap: Record<string, { baseXp: number; reflectionXp: number }> = {
        micro: { baseXp: 20, reflectionXp: 80 },
        weekly: { baseXp: 40, reflectionXp: 160 },
        story: { baseXp: 60, reflectionXp: 240 },
        'in-person': { baseXp: 100, reflectionXp: 400 },
      };

      const questReward = rewardMap[quest.type] || { baseXp: 20, reflectionXp: 80 };

      // Если рефлексии нет или слишком короткая → только Base XP
      const baseXp = questReward.baseXp;
      const reflectionXp = hasReflection ? questReward.reflectionXp : 0;

      // Определяем сложность квеста на основе типа
      // micro -> basic, weekly -> intermediate, story/in-person -> advanced
      const questDifficultyMap: Record<string, 'basic' | 'intermediate' | 'advanced'> = {
        micro: 'basic',
        weekly: 'intermediate',
        story: 'advanced',
        'in-person': 'advanced',
      };
      const questDifficulty = questDifficultyMap[quest.type] || 'basic';

      for (const nodeId of quest.linked_nodes) {
        try {
          // Применяем опыт через новую систему (Base XP + Reflection XP)
          await this.abilityStateService.applyQuestExperience(
            userId,
            nodeId,
            baseXp,
            reflectionXp,
            questDifficulty,
          );
        } catch (error) {
          // Игнорируем ошибки, если узел не найден
          console.warn(`Failed to apply experience to node ${nodeId} for user ${userId}:`, error);
        }
      }

      // Если рефлексии нет, логируем для информативности
      if (!hasReflection) {
        console.log(
          `Quest ${id} completed without reflection. Only base XP (${baseXp}) awarded. Total possible: ${baseXp + questReward.reflectionXp}`,
        );
      }
    }

    return this.transformQuest(updated);
  }

  /**
   * Обновить статус квеста
   */
  async updateStatus(id: string, status: 'active' | 'backlog' | 'done' | 'archived', userId?: string) {
    const quest = await this.prisma.quest.findUnique({
      where: { id },
    });

    if (!quest) {
      throw new NotFoundException(`Quest ${id} not found`);
    }

    // Проверка лимита активных квестов для конкретного пользователя
    if (status === 'active') {
      const activeCount = await this.prisma.quest.count({
        where: {
          status: 'active',
          ...(userId ? { userId } : { userId: quest.userId }),
        },
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
   * Получить завершенные квесты по узлу
   */
  async getCompletedByNode(nodeId: string, userId?: string): Promise<{ quests: any[]; count: number }> {
    if (!this.prisma?.quest) {
      throw new InternalServerErrorException('Prisma quest model is not available');
    }

    const where: any = {
      status: 'done',
      linked_nodes: {
        has: nodeId,
      },
    };

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
      orderBy: { completed_at: 'desc' },
    });

    return {
      quests: quests.map((q) => this.transformQuest(q)),
      count: quests.length,
    };
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
        // Ищем по названию (частичное совпадение) только базовые квесты
        quests = await this.prisma.quest.findMany({
          where: {
            title: {
              contains: item.title,
              mode: 'insensitive',
            },
            source: 'base_template', // ⚠️ ЗАЩИТА: Ищем только базовые квесты
          },
        });
      }

      if (quests.length === 0 && item.linkedNodes && item.linkedNodes.length > 0) {
        // Ищем по связанным узлам только базовые квесты
        quests = await this.prisma.quest.findMany({
          where: {
            linked_nodes: {
              hasSome: item.linkedNodes,
            },
            source: 'base_template', // ⚠️ ЗАЩИТА: Ищем только базовые квесты
          },
        });
      }

      if (quests.length > 0) {
        for (const quest of quests) {
          // Дополнительная проверка (на случай, если фильтр не сработал)
          if (quest.source && quest.source !== 'base_template') {
            // Пропускаем пользовательские квесты
            continue;
          }

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
   * ⚠️ ЗАЩИТА: Обновляет только квесты с source='base_template'
   */
  async syncQuestFromTemplate(questId: string, template: {
    description?: string;
    steps?: any[];
    criteria?: any;
  }): Promise<{ success: boolean; message: string }> {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
      select: {
        id: true,
        source: true,
      },
    });

    if (!quest) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    // Защита: обновляем только базовые квесты (source='base_template')
    if (quest.source !== 'base_template') {
      throw new ForbiddenException(
        `Cannot sync quest ${questId}: only base quests (source='base_template') can be synced from templates. ` +
        `This quest has source='${quest.source || 'null'}'.`,
      );
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

    // Парсим JSON поля через мапперы для правильной структуры данных
    const steps = parseStepsJson(quest?.steps_json);
    const criteria = parseCriteriaJson(quest?.criteria_json);
    const reward = parseRewardJson(quest?.reward_json);

    return {
      id: quest?.id,
      title: quest?.title,
      description: quest?.description,
      type: quest?.type,
      status: quest?.status,
      steps: steps,
      criteria: criteria,
      reward: reward,
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

