import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Типы ачивок
 */
export type AchievementType = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementScope = 'node' | 'global'; // node-specific или общая ачивка

export interface Achievement {
  id: string;
  type: AchievementType;
  scope: AchievementScope;
  nodeId?: string; // для node-specific ачивок
  title: string;
  description: string;
  threshold: number; // порог внутреннего прогресса (2.0 = 200%, 3.0 = 300% и т.д.)
  icon?: string;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  nodeId?: string; // для node-specific ачивок
}

/**
 * Пороги ачивок
 */
const ACHIEVEMENT_THRESHOLDS: Record<AchievementType, number> = {
  bronze: 2.0,      // 200%
  silver: 3.0,      // 300%
  gold: 5.0,        // 500%
  platinum: 10.0,   // 1000%
};

/**
 * Сервис для работы с ачивками
 */
@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Проверить и выдать ачивки на основе внутреннего прогресса узла
   */
  async checkAndAwardAchievements(
    userId: string,
    nodeId: string,
    internalProgress: number,
  ): Promise<Achievement[]> {
    this.logger.log(
      `Checking achievements for user ${userId}, node ${nodeId}, progress: ${internalProgress * 100}%`,
    );

    const awardedAchievements: Achievement[] = [];

    // Проверяем каждый порог ачивки
    for (const [type, threshold] of Object.entries(ACHIEVEMENT_THRESHOLDS)) {
      if (internalProgress >= threshold) {
        // Проверяем, есть ли уже эта ачивка у пользователя
        const achievementId = this.getAchievementId(nodeId, type as AchievementType);
        const existing = await this.prisma.userAchievement.findUnique({
          where: {
            user_id_achievement_id: {
              user_id: userId,
              achievement_id: achievementId,
            },
          },
        });

        if (!existing) {
          // Выдаем ачивку
          await this.awardAchievement(userId, nodeId, type as AchievementType);
          
          // Загружаем информацию об ачивке
          const achievement = await this.getAchievementInfo(nodeId, type as AchievementType);
          if (achievement) {
            awardedAchievements.push(achievement);
          }
        }
      }
    }

    if (awardedAchievements.length > 0) {
      this.logger.log(
        `Awarded ${awardedAchievements.length} achievements to user ${userId} for node ${nodeId}`,
      );
    }

    return awardedAchievements;
  }

  /**
   * Выдать ачивку пользователю
   */
  private async awardAchievement(
    userId: string,
    nodeId: string,
    type: AchievementType,
  ): Promise<void> {
    const achievementId = this.getAchievementId(nodeId, type);

    // Создаем ачивку, если её еще нет
    await this.prisma.achievement.upsert({
      where: { id: achievementId },
      update: {},
      create: {
        id: achievementId,
        type,
        scope: 'node',
        node_id: nodeId,
        title: this.getAchievementTitle(nodeId, type),
        description: this.getAchievementDescription(nodeId, type),
        threshold: ACHIEVEMENT_THRESHOLDS[type],
      },
    });

    // Выдаем ачивку пользователю
    await this.prisma.userAchievement.create({
      data: {
        user_id: userId,
        achievement_id: achievementId,
        node_id: nodeId,
        unlocked_at: new Date(),
      },
    });
  }

  /**
   * Получить ID ачивки
   */
  private getAchievementId(nodeId: string, type: AchievementType): string {
    return `achievement_${nodeId}_${type}`;
  }

  /**
   * Получить информацию об ачивке
   */
  private async getAchievementInfo(
    nodeId: string,
    type: AchievementType,
  ): Promise<Achievement | null> {
    const achievementId = this.getAchievementId(nodeId, type);
    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    if (!achievement) {
      return null;
    }

    return {
      id: achievement.id,
      type: achievement.type as AchievementType,
      scope: achievement.scope as AchievementScope,
      nodeId: achievement.node_id || undefined,
      title: achievement.title,
      description: achievement.description,
      threshold: Number(achievement.threshold),
      icon: achievement.icon || undefined,
    };
  }

  /**
   * Получить заголовок ачивки
   */
  private getAchievementTitle(nodeId: string, type: AchievementType): string {
    const titles: Record<AchievementType, string> = {
      bronze: `Бронзовая ачивка: ${nodeId}`,
      silver: `Серебряная ачивка: ${nodeId}`,
      gold: `Золотая ачивка: ${nodeId}`,
      platinum: `Платиновая ачивка: ${nodeId}`,
    };
    return titles[type];
  }

  /**
   * Получить описание ачивки
   */
  private getAchievementDescription(nodeId: string, type: AchievementType): string {
    const threshold = ACHIEVEMENT_THRESHOLDS[type];
    const descriptions: Record<AchievementType, string> = {
      bronze: `Достигнут внутренний прогресс ${threshold * 100}% по узлу ${nodeId}`,
      silver: `Достигнут внутренний прогресс ${threshold * 100}% по узлу ${nodeId}`,
      gold: `Достигнут внутренний прогресс ${threshold * 100}% по узлу ${nodeId}`,
      platinum: `Достигнут внутренний прогресс ${threshold * 100}% по узлу ${nodeId}`,
    };
    return descriptions[type];
  }

  /**
   * Получить все ачивки пользователя
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { user_id: userId },
      include: {
        achievement: true,
      },
      orderBy: {
        unlocked_at: 'desc',
      },
    });

    return userAchievements.map((ua) => ({
      userId: ua.user_id,
      achievementId: ua.achievement_id,
      unlockedAt: ua.unlocked_at,
      nodeId: ua.node_id || undefined,
    }));
  }

  /**
   * Получить ачивки для конкретного узла
   */
  async getNodeAchievements(userId: string, nodeId: string): Promise<Achievement[]> {
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: {
        user_id: userId,
        node_id: nodeId,
      },
      include: {
        achievement: true,
      },
    });

    return userAchievements.map((ua) => ({
      id: ua.achievement.id,
      type: ua.achievement.type as AchievementType,
      scope: ua.achievement.scope as AchievementScope,
      nodeId: ua.achievement.node_id || undefined,
      title: ua.achievement.title,
      description: ua.achievement.description,
      threshold: Number(ua.achievement.threshold),
      icon: ua.achievement.icon || undefined,
    }));
  }
}
