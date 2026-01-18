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
}

