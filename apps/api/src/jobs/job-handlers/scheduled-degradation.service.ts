import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobsService } from '../jobs.service';

/**
 * Сервис для периодического запуска задачи деградации опыта
 * Запускается ежедневно в 3:00 AM
 */
@Injectable()
export class ScheduledDegradationService {
  private readonly logger = new Logger(ScheduledDegradationService.name);

  constructor(private readonly jobsService: JobsService) {}

  /**
   * Периодическая задача деградации опыта
   * Запускается ежедневно в 3:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleScheduledDegradation() {
    this.logger.log('Scheduled degradation task triggered');

    try {
      // Добавляем задачу в очередь
      await this.jobsService.enqueue({
        jobType: 'degrade_experience',
        queue: 'default',
        priority: 0,
        dedupeKey: 'DEGRADE_EXPERIENCE_DAILY',
        maxAttempts: 3,
      });

      this.logger.log('Degradation job enqueued successfully');
    } catch (error) {
      this.logger.error('Failed to enqueue degradation job:', error);
    }
  }
}
