import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PeriodMetrics,
  DailyStats,
  MetricsRequest,
  MetricsSummary,
} from './metrics.types';

/**
 * Сервис для расчёта метрик Core Loop
 * 
 * Ключевые метрики:
 * - Core Loop completion rate: % от Entry до Evidence
 * - Time to first result: среднее время от Entry до первого Evidence
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить метрики за период
   */
  async getPeriodMetrics(
    userId: string,
    request: MetricsRequest = {},
  ): Promise<PeriodMetrics> {
    const days = request.days || 7;
    const endDate = request.endDate || new Date();
    const startDate = request.startDate || new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Получаем данные из UserStatsDaily
    const dailyStats = await this.prisma.userStatsDaily.findMany({
      where: {
        user_id: userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Агрегируем данные
    const components = dailyStats.reduce(
      (acc, stat) => ({
        entries: acc.entries + stat.entries_count,
        sessions: acc.sessions + stat.sessions_succeeded,
        quests: acc.quests + stat.quests_completed,
        evidences: acc.evidences + stat.evidences_count,
      }),
      { entries: 0, sessions: 0, quests: 0, evidences: 0 },
    );

    // Core Loop метрики
    // Started = sessions (анализ выполнен)
    // Completed = evidences (результат зафиксирован)
    const started = components.sessions;
    const completed = components.evidences;
    const completionRate = started > 0 ? Math.round((completed / started) * 100) : 0;

    // Получаем данные о дереве (из ChangeLog)
    const treeChanges = await this.prisma.changeLog.count({
      where: {
        userId: userId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return {
      period: {
        start: startDate,
        end: endDate,
        days,
      },
      coreLoop: {
        started,
        completed,
        completionRate,
        // avgTimeToFirstResult рассчитывается отдельно при необходимости
      },
      components,
      tree: {
        nodesUpdated: treeChanges,
        totalXpGained: 0, // Требует дополнительной логики
        nodesUnlocked: 0, // Требует дополнительной логики
      },
    };
  }

  /**
   * Получить сводку метрик для dashboard
   */
  async getMetricsSummary(userId: string): Promise<MetricsSummary> {
    const now = new Date();
    
    // Текущая неделя (последние 7 дней)
    const thisWeek = await this.getPeriodMetrics(userId, { days: 7 });
    
    // Прошлая неделя
    const lastWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const lastWeek = await this.getPeriodMetrics(userId, {
      startDate: lastWeekStart,
      endDate: lastWeekEnd,
    });

    // Рассчитываем тренды
    const calcTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      thisWeek,
      lastWeek,
      trend: {
        completionRate: calcTrend(thisWeek.coreLoop.completionRate, lastWeek.coreLoop.completionRate),
        entries: calcTrend(thisWeek.components.entries, lastWeek.components.entries),
        evidences: calcTrend(thisWeek.components.evidences, lastWeek.components.evidences),
      },
    };
  }

  /**
   * Получить ежедневную статистику
   */
  async getDailyStats(userId: string, days: number = 30): Promise<DailyStats[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const stats = await this.prisma.userStatsDaily.findMany({
      where: {
        user_id: userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return stats.map((s) => ({
      date: s.date.toISOString().split('T')[0],
      entriesCount: s.entries_count,
      sessionsSucceeded: s.sessions_succeeded,
      questsCompleted: s.quests_completed,
      evidencesCount: s.evidences_count,
    }));
  }

  /**
   * Обновить ежедневную статистику (вызывается из других сервисов)
   */
  async incrementDailyStat(
    userId: string,
    field: 'entries_count' | 'sessions_succeeded' | 'quests_completed' | 'evidences_count',
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.userStatsDaily.upsert({
      where: {
        user_id_date: {
          user_id: userId,
          date: today,
        },
      },
      create: {
        user_id: userId,
        date: today,
        [field]: 1,
      },
      update: {
        [field]: {
          increment: 1,
        },
      },
    });
  }
}
