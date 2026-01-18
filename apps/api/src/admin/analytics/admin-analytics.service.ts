import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers7d,
      activeUsers30d,
      totalEntries,
      totalSessions,
      totalQuests,
      completedQuests,
      totalEvidence,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { last_seen_at: { gte: weekAgo } },
      }),
      this.prisma.user.count({
        where: { last_seen_at: { gte: monthAgo } },
      }),
      this.prisma.entry.count(),
      this.prisma.session.count(),
      this.prisma.quest.count(),
      this.prisma.quest.count({ where: { status: 'done' } }),
      this.prisma.evidence.count(),
    ]);

    return {
      totalUsers,
      activeUsers7d,
      activeUsers30d,
      totalEntries,
      totalSessions,
      totalQuests,
      completedQuests,
      totalEvidence,
    };
  }

  async getDailyStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get daily stats from user_stats_daily if available
    const stats = await this.prisma.userStatsDaily.groupBy({
      by: ['date'],
      _sum: {
        entries_count: true,
        sessions_succeeded: true,
        quests_completed: true,
        evidences_count: true,
      },
      where: {
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    // Also get new user registrations per day
    const newUsers = await this.prisma.user.groupBy({
      by: ['created_at'],
      _count: true,
      where: {
        created_at: { gte: startDate },
      },
    });

    // Create a map of dates to new user counts
    const newUsersMap = new Map<string, number>();
    newUsers.forEach((item) => {
      const dateStr = item.created_at.toISOString().split('T')[0];
      const current = newUsersMap.get(dateStr) || 0;
      newUsersMap.set(dateStr, current + item._count);
    });

    // If no stats in user_stats_daily, generate from raw data
    if (stats.length === 0) {
      // Fallback: calculate from entries, sessions, quests
      const result: Array<{
        date: string;
        entries_count: number;
        sessions_succeeded: number;
        quests_completed: number;
        evidences_count: number;
        new_users: number;
      }> = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= new Date()) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        const [entries, sessions, quests, evidences] = await Promise.all([
          this.prisma.entry.count({
            where: { created_at: { gte: dayStart, lte: dayEnd } },
          }),
          this.prisma.session.count({
            where: { status: 'succeeded', created_at: { gte: dayStart, lte: dayEnd } },
          }),
          this.prisma.quest.count({
            where: { status: 'done', completed_at: { gte: dayStart, lte: dayEnd } },
          }),
          this.prisma.evidence.count({
            where: { created_at: { gte: dayStart, lte: dayEnd } },
          }),
        ]);

        const dateStr = currentDate.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          entries_count: entries,
          sessions_succeeded: sessions,
          quests_completed: quests,
          evidences_count: evidences,
          new_users: newUsersMap.get(dateStr) || 0,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    }

    return stats.map((s) => ({
      date: s.date.toISOString().split('T')[0],
      entries_count: s._sum.entries_count || 0,
      sessions_succeeded: s._sum.sessions_succeeded || 0,
      quests_completed: s._sum.quests_completed || 0,
      evidences_count: s._sum.evidences_count || 0,
      new_users: newUsersMap.get(s.date.toISOString().split('T')[0]) || 0,
    }));
  }

  async getTopActiveUsers(limit: number = 10) {
    // Get users with most entries in last 30 days
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        telegramUsername: true,
        statsRollup: {
          select: {
            entries_7d: true,
            entries_30d: true,
            quests_completed_30d: true,
            last_entry_at: true,
          },
        },
      },
      orderBy: {
        statsRollup: {
          entries_30d: 'desc',
        },
      },
      take: limit,
    });

    // Fallback if no rollup data
    if (users.every(u => !u.statsRollup)) {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const usersWithCounts = await this.prisma.user.findMany({
        select: {
          id: true,
          telegramUsername: true,
          _count: {
            select: {
              entries: true,
            },
          },
          entries: {
            where: { created_at: { gte: monthAgo } },
            select: { created_at: true },
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
        orderBy: {
          entries: {
            _count: 'desc',
          },
        },
        take: limit,
      });

      return usersWithCounts.map(u => ({
        user_id: u.id,
        telegramUsername: u.telegramUsername,
        entries_7d: 0, // Would need separate query
        entries_30d: u._count.entries,
        quests_completed_30d: 0,
        last_entry_at: u.entries[0]?.created_at?.toISOString() || null,
      }));
    }

    return users.map(u => ({
      user_id: u.id,
      telegramUsername: u.telegramUsername,
      entries_7d: u.statsRollup?.entries_7d || 0,
      entries_30d: u.statsRollup?.entries_30d || 0,
      quests_completed_30d: u.statsRollup?.quests_completed_30d || 0,
      last_entry_at: u.statsRollup?.last_entry_at?.toISOString() || null,
    }));
  }
}
