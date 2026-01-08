import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminQuestsService {
  constructor(private prisma: PrismaService) {}

  async getUserQuests(
    userId: string,
    filters: {
      status?: string;
      type?: string;
      branch?: string;
      linkedNode?: string;
      from?: Date;
      to?: Date;
      limit?: number;
      cursor?: string;
    },
  ) {
    const where: any = { userId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.branch) {
      where.branch = filters.branch;
    }
    if (filters.linkedNode) {
      where.linked_nodes = { has: filters.linkedNode };
    }
    if (filters.from || filters.to) {
      where.created_at = {};
      if (filters.from) {
        where.created_at.gte = filters.from;
      }
      if (filters.to) {
        where.created_at.lte = filters.to;
      }
    }

    const quests = await this.prisma.quest.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      take: filters.limit || 50,
      ...(filters.cursor && {
        skip: 1,
        cursor: {
          id: filters.cursor,
        },
      }),
    });

    return quests;
  }

  async getQuestById(questId: string) {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            telegramUsername: true,
          },
        },
        session: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!quest) {
      throw new NotFoundException('Quest not found');
    }

    return quest;
  }

  async overrideQuest(
    questId: string,
    action: 'force_complete' | 'force_fail' | 'archive' | 'reactivate',
  ) {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      throw new NotFoundException('Quest not found');
    }

    const updateData: any = {};

    switch (action) {
      case 'force_complete':
        updateData.status = 'completed';
        updateData.completed_at = new Date();
        break;
      case 'force_fail':
        updateData.status = 'failed';
        break;
      case 'archive':
        updateData.status = 'archived';
        break;
      case 'reactivate':
        updateData.status = 'active';
        updateData.activated_at = new Date();
        break;
    }

    return this.prisma.quest.update({
      where: { id: questId },
      data: updateData,
    });
  }

  async regenerateQuests(
    userId: string,
    mode: 'append' | 'replace_backlog' | 'replace_all_non_completed',
  ) {
    // Создаем job для регенерации квестов
    const job = await this.prisma.job.create({
      data: {
        queue: 'quests',
        job_type: 'regenerate_quests',
        status: 'pending',
        user_id: userId,
        entity_type: 'user',
        entity_id: userId,
        params: {
          mode,
        },
      },
    });

    return job;
  }
}

