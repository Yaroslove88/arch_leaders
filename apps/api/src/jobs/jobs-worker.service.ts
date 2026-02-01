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
        await this.handleRecomputeUser(job);
        break;

      case 'reembed_entry':
        await this.handleReembedEntry(job);
        break;

      case 'regenerate_quests':
        await this.handleRegenerateQuests(job);
        break;

      case 'send_telegram':
        await this.handleSendTelegram(job);
        break;

      case 'backfill':
        await this.handleBackfill(job);
        break;

      case 'degrade_experience':
        await this.degradeExperienceHandler.handle();
        break;

      default:
        throw new Error(`Unknown job type: ${job.jobType}`);
    }
  }

  /**
   * Временный обработчик send_telegram
   * Пока нет полноценной интеграции, просто логируем и помечаем задачу успешной,
   * чтобы очередь не застревала.
   */
  private async handleSendTelegram(job: ClaimedJob): Promise<void> {
    this.logger.warn(`send_telegram handler is stubbed; job ${job.id} will be marked as succeeded`);
    // В дальнейшем здесь можно вызвать Telegram сервис/бот
    return;
  }

  private async handleRecomputeUser(job: ClaimedJob): Promise<void> {
    this.logger.warn(`recompute_user handler stubbed; job ${job.id} skipped`);
    return;
  }

  private async handleReembedEntry(job: ClaimedJob): Promise<void> {
    this.logger.warn(`reembed_entry handler stubbed; job ${job.id} skipped`);
    return;
  }

  private async handleRegenerateQuests(job: ClaimedJob): Promise<void> {
    this.logger.warn(`regenerate_quests handler stubbed; job ${job.id} skipped`);
    return;
  }

  private async handleBackfill(job: ClaimedJob): Promise<void> {
    this.logger.warn(`backfill handler stubbed; job ${job.id} skipped`);
    return;
  }
}
