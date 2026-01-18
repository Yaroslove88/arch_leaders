import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export type JobType =
  | 'analyze_entry'
  | 'recompute_user'
  | 'reembed_entry'
  | 'regenerate_quests'
  | 'send_telegram'
  | 'backfill'
  | 'degrade_experience';

export type JobStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface EnqueueJobParams {
  jobType: JobType;
  queue?: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  priority?: number;
  params?: unknown;
  scheduledFor?: Date;
  dedupeKey?: string; // Для идемпотентности
  maxAttempts?: number;
}

export interface ClaimedJob {
  id: string;
  jobType: JobType;
  queue: string;
  userId: string | null;
  entityType: string | null;
  entityId: string | null;
  params: Prisma.JsonValue | null;
  attempt: number;
  maxAttempts: number;
}

/**
 * Сервис для работы с очередью задач (DB-backed queue)
 */
@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Добавить задачу в очередь
   * Если задача с таким dedupeKey уже существует и не завершена - вернет существующую
   */
  async enqueue(params: EnqueueJobParams): Promise<{ id: string; status: JobStatus }> {
    const {
      jobType,
      queue = 'default',
      userId,
      entityType,
      entityId,
      priority = 0,
      params: jobParams,
      scheduledFor,
      dedupeKey,
      maxAttempts = 3,
    } = params;

    // Проверяем идемпотентность через dedupeKey
    if (dedupeKey) {
      const existing = await this.prisma.job.findFirst({
        where: { dedupe_key: dedupeKey },
      });

      if (existing) {
        // Если задача еще не завершена - возвращаем существующую
        if (existing.status === 'pending' || existing.status === 'running') {
          this.logger.log(
            `Job with dedupeKey ${dedupeKey} already exists (id: ${existing.id}, status: ${existing.status})`,
          );
          return { id: existing.id, status: existing.status as JobStatus };
        }

        // Если задача завершена - можно создать новую (или вернуть существующую, в зависимости от логики)
        // Для анализа - обычно не создаем дубликат, если уже был успешный анализ
        if (existing.status === 'succeeded' && jobType === 'analyze_entry') {
          this.logger.log(`Job with dedupeKey ${dedupeKey} already succeeded, returning existing`);
          return { id: existing.id, status: existing.status as JobStatus };
        }
      }
    }

    const job = await this.prisma.job.create({
      data: {
        queue,
        job_type: jobType,
        status: 'pending',
        user_id: userId || null,
        entity_type: entityType || null,
        entity_id: entityId || null,
        priority,
        params: jobParams ? (jobParams as Prisma.InputJsonValue) : Prisma.JsonNull,
        scheduled_for: scheduledFor || null,
        dedupe_key: dedupeKey || null,
        attempt: 0,
        max_attempts: maxAttempts,
      },
    });

    this.logger.log(`Enqueued job ${job.id} (type: ${jobType}, queue: ${queue})`);

    return { id: job.id, status: job.status as JobStatus };
  }

  /**
   * Атомарно забрать следующую задачу из очереди (claim)
   * Использует optimistic locking через attempt
   */
  async claimNext(queue: string = 'default'): Promise<ClaimedJob | null> {
    // Используем транзакцию для атомарности
    return this.prisma.$transaction(async (tx) => {
      // Находим самую старую pending задачу
      const job = await tx.job.findFirst({
        where: {
          queue,
          status: 'pending',
          OR: [
            { scheduled_for: null },
            { scheduled_for: { lte: new Date() } },
          ],
        },
        orderBy: [
          { priority: 'desc' },
          { created_at: 'asc' },
        ],
      });

      if (!job) {
        return null;
      }

      // Атомарно обновляем статус на running
      const updated = await tx.job.update({
        where: { id: job.id },
        data: {
          status: 'running',
          started_at: new Date(),
          attempt: job.attempt + 1,
        },
      });

      return {
        id: updated.id,
        jobType: updated.job_type as JobType,
        queue: updated.queue,
        userId: updated.user_id,
        entityType: updated.entity_type,
        entityId: updated.entity_id,
        params: updated.params,
        attempt: updated.attempt,
        maxAttempts: updated.max_attempts,
      };
    });
  }

  /**
   * Пометить задачу как выполненную
   */
  async complete(jobId: string, result?: unknown): Promise<void> {
    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'succeeded',
        finished_at: new Date(),
        params: result ? (result as Prisma.InputJsonValue) : undefined,
      },
    });

    this.logger.log(`Job ${jobId} completed`);
  }

  /**
   * Пометить задачу как проваленную
   */
  async fail(jobId: string, error: Error | string, retryable: boolean = true): Promise<void> {
    const errorData = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      retryable,
      timestamp: new Date().toISOString(),
    };

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      this.logger.error(`Job ${jobId} not found for fail`);
      return;
    }

    const shouldRetry = retryable && job.attempt < job.max_attempts;

    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: shouldRetry ? 'pending' : 'failed',
        finished_at: new Date(),
        error: errorData as Prisma.InputJsonValue,
        // Если будет retry - сбрасываем started_at для следующей попытки
        started_at: shouldRetry ? null : undefined,
      },
    });

    if (shouldRetry) {
      this.logger.warn(`Job ${jobId} failed (attempt ${job.attempt}/${job.max_attempts}), will retry`);
    } else {
      this.logger.error(`Job ${jobId} failed permanently after ${job.attempt} attempts`);
    }
  }

  /**
   * Отменить задачу
   */
  async cancel(jobId: string): Promise<void> {
    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'cancelled',
        finished_at: new Date(),
      },
    });

    this.logger.log(`Job ${jobId} cancelled`);
  }

  /**
   * Получить статус задачи
   */
  async getStatus(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        job_type: true,
        status: true,
        attempt: true,
        max_attempts: true,
        started_at: true,
        finished_at: true,
        error: true,
      },
    });

    if (!job) {
      return null;
    }

    return {
      id: job.id,
      jobType: job.job_type,
      status: job.status,
      attempt: job.attempt,
      maxAttempts: job.max_attempts,
      startedAt: job.started_at,
      finishedAt: job.finished_at,
      error: job.error,
    };
  }
}

