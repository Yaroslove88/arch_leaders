import { Injectable, Logger } from '@nestjs/common';

export interface StuckQuest {
  questId: string;
  questTitle: string;
  daysStuck: number;
  lastActivity?: Date;
}

export interface StuckCase {
  caseId: string;
  caseTitle: string;
  minutesStuck: number;
  openedAt: Date;
}

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  
  // Трекинг открытых кейсов (в продакшене заменить на БД)
  private openCases: Record<string, { caseId: string; openedAt: Date; userId: string }> = {};
  
  // Трекинг активных квестов (в продакшене заменить на БД)
  private activeQuests: Record<string, { questId: string; startedAt: Date; lastEvidenceAt?: Date; userId: string }> = {};

  /**
   * Записать открытие кейса
   */
  recordCaseOpened(userId: string, caseId: string, caseTitle: string): void {
    const key = `${userId}:${caseId}`;
    this.openCases[key] = {
      caseId,
      openedAt: new Date(),
      userId,
    };
    this.logger.log(`Case ${caseId} opened by user ${userId}`);
  }

  /**
   * Записать выбор в кейсе (пользователь не застрял)
   */
  recordCaseChoice(userId: string, caseId: string): void {
    const key = `${userId}:${caseId}`;
    delete this.openCases[key];
    this.logger.log(`Case ${caseId} choice made by user ${userId}`);
  }

  /**
   * Записать начало квеста
   */
  recordQuestStarted(userId: string, questId: string): void {
    const key = `${userId}:${questId}`;
    this.activeQuests[key] = {
      questId,
      startedAt: new Date(),
      userId,
    };
    this.logger.log(`Quest ${questId} started by user ${userId}`);
  }

  /**
   * Записать добавление evidence к квесту
   */
  recordQuestEvidence(userId: string, questId: string): void {
    const key = `${userId}:${questId}`;
    if (this.activeQuests[key]) {
      this.activeQuests[key].lastEvidenceAt = new Date();
    }
    this.logger.log(`Quest ${questId} evidence added by user ${userId}`);
  }

  /**
   * Проверить застрявшие кейсы
   */
  getStuckCases(userId: string, caseTitles: Record<string, string>): StuckCase[] {
    const stuck: StuckCase[] = [];
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    Object.entries(this.openCases).forEach(([key, data]) => {
      if (data.userId === userId && data.openedAt < fiveMinutesAgo) {
        const minutesStuck = Math.floor((now.getTime() - data.openedAt.getTime()) / (1000 * 60));
        stuck.push({
          caseId: data.caseId,
          caseTitle: caseTitles[data.caseId] || data.caseId,
          minutesStuck,
          openedAt: data.openedAt,
        });
      }
    });

    return stuck;
  }

  /**
   * Проверить застрявшие квесты
   */
  getStuckQuests(userId: string, questTitles: Record<string, string>): StuckQuest[] {
    const stuck: StuckQuest[] = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    Object.entries(this.activeQuests).forEach(([key, data]) => {
      if (data.userId === userId) {
        const lastActivity = data.lastEvidenceAt || data.startedAt;
        if (lastActivity < sevenDaysAgo) {
          const daysStuck = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
          stuck.push({
            questId: data.questId,
            questTitle: questTitles[data.questId] || data.questId,
            daysStuck,
            lastActivity,
          });
        }
      }
    });

    return stuck;
  }

  /**
   * Получить все застрявшие элементы
   */
  getStuckItems(userId: string, caseTitles: Record<string, string>, questTitles: Record<string, string>): {
    stuckCases: StuckCase[];
    stuckQuests: StuckQuest[];
  } {
    return {
      stuckCases: this.getStuckCases(userId, caseTitles),
      stuckQuests: this.getStuckQuests(userId, questTitles),
    };
  }
}
