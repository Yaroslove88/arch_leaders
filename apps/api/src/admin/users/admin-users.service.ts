import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async getUsers(filters: {
    q?: string;
    status?: string;
    createdFrom?: Date;
    createdTo?: Date;
    lastSeenFrom?: Date;
    lastSeenTo?: Date;
    limit?: number;
    cursor?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const where: any = {};

    if (filters.q) {
      where.OR = [
        { email: { contains: filters.q, mode: 'insensitive' } },
        { telegramUsername: { contains: filters.q, mode: 'insensitive' } },
        { id: filters.q },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.createdFrom || filters.createdTo) {
      where.created_at = {};
      if (filters.createdFrom) {
        where.created_at.gte = filters.createdFrom;
      }
      if (filters.createdTo) {
        where.created_at.lte = filters.createdTo;
      }
    }

    if (filters.lastSeenFrom || filters.lastSeenTo) {
      where.last_seen_at = {};
      if (filters.lastSeenFrom) {
        where.last_seen_at.gte = filters.lastSeenFrom;
      }
      if (filters.lastSeenTo) {
        where.last_seen_at.lte = filters.lastSeenTo;
      }
    }

    const orderBy: any = {};
    const sortField = filters.sort || 'created_at';
    orderBy[sortField] = filters.order || 'desc';

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          telegramUsername: true,
          status: true,
          role: true,
          created_at: true,
          last_seen_at: true,
          _count: {
            select: {
              entries: true,
              quests: true,
              sessions: true,
            },
          },
        },
        orderBy,
        take: filters.limit || 50,
        ...(filters.cursor && {
          skip: 1,
          cursor: {
            id: filters.cursor,
          },
        }),
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        telegramUsername: true,
        status: true,
        role: true,
        created_at: true,
        last_seen_at: true,
        _count: {
          select: {
            entries: true,
            quests: true,
            sessions: true,
            evidence: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get quest counts by status
    const [activeQuests, completedQuests] = await Promise.all([
      this.prisma.quest.count({
        where: {
          userId: userId,
          status: 'active',
        },
      }),
      this.prisma.quest.count({
        where: {
          userId: userId,
          status: 'completed',
        },
      }),
    ]);

    // Transform to User360 structure expected by frontend
    return {
      user: {
        id: user.id,
        email: user.email,
        telegramUsername: user.telegramUsername,
        status: user.status,
        role: user.role,
        created_at: user.created_at,
        last_seen_at: user.last_seen_at,
      },
      stats: {
        entries_count: user._count.entries || 0,
        sessions_count: user._count.sessions || 0,
        quests_active: activeQuests,
        quests_completed: completedQuests,
        abilities_unlocked: user._count.evidence || 0,
      },
    };
  }

  async updateUser(userId: string, data: { status?: string; note?: string }) {
    const updateData: any = {};

    if (data.status) {
      updateData.status = data.status;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        telegramUsername: true,
        status: true,
        role: true,
        created_at: true,
      },
    });

    return user;
  }

  async updateSubscription(
    userId: string,
    data: { plan: string; expires_at?: string },
  ) {
    // Получаем текущую подписку для истории
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscription_plan: true,
        subscription_expires_at: true,
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const oldPlan = currentUser.subscription_plan;

    // Обновляем подписку
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscription_plan: data.plan,
        subscription_expires_at: data.expires_at ? new Date(data.expires_at) : null,
      },
      select: {
        id: true,
        email: true,
        telegramUsername: true,
        subscription_plan: true,
        subscription_expires_at: true,
      },
    });

    return {
      user,
      old_plan: oldPlan,
      new_plan: data.plan,
    };
  }

  async getSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscription_plan: true,
        subscription_expires_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      plan: user.subscription_plan,
      expires_at: user.subscription_expires_at,
    };
  }

  async resetUserData(userId: string, scope: 'progress' | 'tree' | 'all') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const deletedCounts: Record<string, number> = {};

    // Сбросить прогресс квестов
    if (scope === 'progress' || scope === 'all') {
      const questsDeleted = await this.prisma.quest.deleteMany({
        where: { userId },
      });
      deletedCounts.quests = questsDeleted.count;
    }

    // Сбросить дерево способностей (evidence)
    if (scope === 'tree' || scope === 'all') {
      const evidenceDeleted = await this.prisma.evidence.deleteMany({
        where: { userId },
      });
      deletedCounts.evidence = evidenceDeleted.count;
    }

    // Сбросить все данные
    if (scope === 'all') {
      // Удалить сессии
      const sessionsDeleted = await this.prisma.session.deleteMany({
        where: { userId },
      });
      deletedCounts.sessions = sessionsDeleted.count;

      // Удалить записи (entries)
      const entriesDeleted = await this.prisma.entry.deleteMany({
        where: { userId },
      });
      deletedCounts.entries = entriesDeleted.count;
    }

    return {
      userId,
      scope,
      deleted: deletedCounts,
      timestamp: new Date().toISOString(),
    };
  }
}

