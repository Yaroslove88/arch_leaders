import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { JobsService, type ClaimedJob } from './jobs.service';
import { AnalyzeEntryHandler } from './job-handlers/analyze-entry.handler';
import { DegradeExperienceHandler } from './job-handlers/degrade-experience.handler';

/**
 * Воркер для обработки очереди задач
 * Периодически проверяет очередь и обрабатывает задачи
 */
@Injectable()
export class JobsWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsWorkerService.name);
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private readonly pollInterval = 5000; // 5 секунд
  private readonly queues = ['default', 'analysis', 'high-priority'];

  constructor(
    private readonly jobsService: JobsService,
    private readonly analyzeEntryHandler: AnalyzeEntryHandler,
    private readonly degradeExperienceHandler: DegradeExperienceHandler,
  ) {}

  onModuleInit() {
    this.logger.log('🚀 Starting JobsWorker...');
    this.start();
  }

  onModuleDestroy() {
    this.logger.log('🛑 Stopping JobsWorker...');
    this.stop();
  }

  /**
   * Запустить воркер
   */
  start() {
    if (this.isRunning) {
      this.logger.warn('Worker is already running');
      return;
    }

    this.isRunning = true;
    this.logger.log(`Worker started, polling every ${this.pollInterval}ms`);

    // Обрабатываем задачи сразу при старте
    this.processQueues();

    // Затем периодически
    this.intervalId = setInterval(() => {
      this.processQueues();
    }, this.pollInterval);
  }

  /**
   * Остановить воркер
   */
  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.logger.log('Worker stopped');
  }

  /**
   * Обработать все очереди
   */
  private async processQueues() {
    if (!this.isRunning) {
      return;
    }

    for (const queue of this.queues) {
      try {
        await this.processQueue(queue);
      } catch (error) {
        this.logger.error(`Error processing queue ${queue}:`, error);
      }
    }
  }

  /**
   * Обработать одну очередь
   */
  private async processQueue(queue: string) {
    // Забираем задачу из очереди
    const job = await this.jobsService.claimNext(queue);

    if (!job) {
      return; // Нет задач в очереди
    }

    this.logger.log(`Processing job ${job.id} (type: ${job.jobType}, queue: ${queue})`);

    try {
      // Выбираем обработчик по типу задачи
      await this.handleJob(job);

      // Помечаем как выполненную
      await this.jobsService.complete(job.id);
    } catch (error) {
      // Помечаем как проваленную (с возможностью retry)
      const retryable = error instanceof Error && !error.message.includes('FATAL');
      await this.jobsService.fail(job.id, error instanceof Error ? error : new Error(String(error)), retryable);
    }
  }

  /**
   * Обработать задачу по типу
   */
  private async handleJob(job: ClaimedJob): Promise<void> {
    switch (job.jobType) {
      case 'analyze_entry':
        await this.analyzeEntryHandler.handle(job);
        break;

      case 'recompute_user':
        // TODO: реализовать в PR8
        throw new Error('recompute_user handler not implemented yet');

      case 'reembed_entry':
        // TODO: реализовать позже
        throw new Error('reembed_entry handler not implemented yet');

      case 'regenerate_quests':
        // TODO: реализовать позже
        throw new Error('regenerate_quests handler not implemented yet');

      case 'send_telegram':
        // TODO: реализовать позже
        throw new Error('send_telegram handler not implemented yet');

      case 'backfill':
        // TODO: реализовать позже
        throw new Error('backfill handler not implemented yet');

      case 'degrade_experience':
        await this.degradeExperienceHandler.handle();
        break;

      default:
        throw new Error(`Unknown job type: ${job.jobType}`);
    }
  }
}

