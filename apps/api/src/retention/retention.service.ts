import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UserRetention {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  activityDates: string[]; // YYYY-MM-DD format
}

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Записать активность пользователя
   */
  async recordActivity(userId: string, activityType: 'case' | 'quest' | 'entry' | 'trace' | 'any' = 'any'): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Получаем или создаём запись retention
    let retention = await this.prisma.userRetention.findUnique({
      where: { user_id: userId },
    });

    if (!retention) {
      retention = await this.prisma.userRetention.create({
        data: {
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          last_activity_at: new Date(today),
          activity_dates: [today],
        },
      });
    } else {
      // Добавляем дату активности, если её ещё нет
      const activityDates = retention.activity_dates || [];
      if (!activityDates.includes(today)) {
        activityDates.push(today);
        activityDates.sort(); // Сортируем для удобства
      }

      // Обновляем последнюю активность
      await this.prisma.userRetention.update({
        where: { user_id: userId },
        data: {
          last_activity_at: new Date(today),
          activity_dates: activityDates,
        },
      });
    }

    // Пересчитываем серию
    await this.recalculateStreak(userId);
    
    this.logger.log(`Activity recorded for user ${userId}: ${activityType} on ${today}`);
  }

  /**
   * Пересчитать серию пользователя
   */
  private async recalculateStreak(userId: string): Promise<void> {
    const retention = await this.prisma.userRetention.findUnique({
      where: { user_id: userId },
    });

    if (!retention || !retention.activity_dates || retention.activity_dates.length === 0) {
      return;
    }

    // Сортируем даты
    const sortedDates = [...retention.activity_dates].sort();
    
    // Подсчитываем текущую серию (последние последовательные дни)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Проверяем с сегодня назад
    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      if (sortedDates.includes(checkDateStr)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Подсчитываем самую длинную серию
    let longestStreak = 1;
    let tempStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    // Обновляем в базе
    await this.prisma.userRetention.update({
      where: { user_id: userId },
      data: {
        current_streak: currentStreak,
        longest_streak: Math.max(longestStreak, retention.longest_streak),
      },
    });
  }

  /**
   * Получить данные о ретеншене пользователя
   */
  async getUserRetention(userId: string): Promise<UserRetention> {
    const retention = await this.prisma.userRetention.findUnique({
      where: { user_id: userId },
    });

    if (!retention) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        activityDates: [],
      };
    }

    // Пересчитываем перед возвратом
    await this.recalculateStreak(userId);
    
    // Получаем обновлённые данные
    const updated = await this.prisma.userRetention.findUnique({
      where: { user_id: userId },
    });

    return {
      currentStreak: updated?.current_streak || 0,
      longestStreak: updated?.longest_streak || 0,
      lastActivityDate: updated?.last_activity_at || null,
      activityDates: updated?.activity_dates || [],
    };
  }

  /**
   * Проверить, под угрозой ли серия (1 день до сброса)
   */
  async isStreakAtRisk(userId: string): Promise<boolean> {
    const retention = await this.getUserRetention(userId);
    if (retention.currentStreak === 0) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    // Если вчера была активность, но сегодня ещё нет - серия под угрозой
    const hadActivityYesterday = retention.activityDates.includes(yesterdayStr);
    const hasActivityToday = retention.activityDates.includes(todayStr);

    return hadActivityYesterday && !hasActivityToday && retention.currentStreak > 0;
  }

  /**
   * Проверить, сколько дней без активности
   */
  async getDaysWithoutActivity(userId: string): Promise<number> {
    const retention = await this.getUserRetention(userId);
    if (!retention.lastActivityDate) {
      return 0; // Пользователь новый, активности ещё не было
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActivity = new Date(retention.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - lastActivity.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
}
