import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  validateStepsJson,
  validateCriteriaJson,
  validateRewardJson,
} from '../common/mappers/quest.mapper';

/**
 * DTO для создания квеста через репозиторий
 */
export interface CreateQuestData {
  userId: string;
  title: string;
  description: string;
  type: 'micro' | 'weekly' | 'story' | 'in-person';
  status?: 'backlog' | 'active' | 'completed' | 'failed' | 'archived';
  steps?: unknown;
  criteria: unknown;
  reward?: unknown;
  linked_nodes?: string[];
  evidence_links?: unknown[];
  due_hint?: string;
  source?: string;
  tags?: string[];
  session_id?: string;
}

/**
 * Репозиторий для работы с квестами (инфраструктурный слой)
 * Инкапсулирует работу с Prisma
 */
@Injectable()
export class QuestRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Найти квест по ID
   */
  async findById(id: string) {
    return this.prisma.quest.findUnique({
      where: { id },
      include: {
        session: true,
      },
    });
  }

  /**
   * Создать несколько квестов
   */
  async createMany(quests: CreateQuestData[]) {
    const data = quests.map((quest) => ({
      userId: quest.userId,
      title: quest.title,
      description: quest.description,
      type: quest.type,
      status: quest.status || 'backlog',
      steps_json: validateStepsJson(quest.steps || []),
      criteria_json: validateCriteriaJson(quest.criteria),
      reward_json: validateRewardJson(quest.reward) || Prisma.JsonNull,
      linked_nodes: quest.linked_nodes || [],
      evidence_links_json: (quest.evidence_links || []) as Prisma.InputJsonValue,
      due_hint: quest.due_hint || null,
      source: quest.source || null,
      tags: quest.tags || [],
      session_id: quest.session_id || null,
    }));

    return this.prisma.quest.createMany({
      data,
    });
  }

  /**
   * Обновить статус квеста
   */
  async updateStatus(id: string, status: 'active' | 'backlog' | 'completed' | 'failed' | 'archived') {
    return this.prisma.quest.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Получить список квестов для пользователя
   */
  async listForUser(
    userId: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: Prisma.QuestWhereInput = {
      userId,
    };

    if (options?.status) {
      where.status = options.status as any;
    }

    const [quests, total] = await Promise.all([
      this.prisma.quest.findMany({
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
        take: options?.limit,
        skip: options?.offset,
      }),
      this.prisma.quest.count({ where }),
    ]);

    return { quests, total };
  }

  /**
   * Получить активные квесты (для управления лимитом)
   */
  async findActiveQuests(limit?: number) {
    return this.prisma.quest.findMany({
      where: { status: 'active' },
      orderBy: { created_at: 'asc' },
      take: limit,
    });
  }

  /**
   * Подсчитать активные квесты
   */
  async countActiveQuests() {
    return this.prisma.quest.count({
      where: { status: 'active' },
    });
  }
}

