import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PathConfigService } from '../config/path-config.service';
import { AnalysisParserService } from './analysis-parser.service';
import { JobsService } from '../jobs/jobs.service';
import { readFile, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pathConfig: PathConfigService,
    private readonly analysisParser: AnalysisParserService,
    private readonly jobsService: JobsService,
  ) {
    // Проверяем инициализацию в конструкторе
    if (!this.analysisParser) {
      this.logger.error('❌ AnalysisParserService is not available. This is a critical error.');
      throw new Error('AnalysisParserService must be initialized. Check that LLMModule is properly imported.');
    }
    this.logger.log('✅ SyncService initialized with AnalysisParserService');
  }

  /**
   * Получить путь к папке ситуаций
   */
  private getSituationsRootPath(): string | null {
    return this.pathConfig.getSituationsRootPath();
  }

  /**
   * Получить статус синхронизации
   */
  getSyncStatus(): { situations_path: string | null; has_path: boolean } {
    const situationsPath = this.getSituationsRootPath();
    return {
      situations_path: situationsPath,
      has_path: situationsPath !== null,
    };
  }

  /**
   * Синхронизировать файлы ситуаций (Entry)
   */
  async syncEntries(): Promise<{
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  }> {
    const situationsRootPath = this.getSituationsRootPath();
    if (!situationsRootPath) {
      this.logger.warn('⚠️ Папка "Лидерство/Ситуации" не найдена');
      return { created: 0, updated: 0, skipped: 0, errors: 0 };
    }

    const stats = { created: 0, updated: 0, skipped: 0, errors: 0 };

    try {
      // Читаем все .md файлы из папки
      const files = (await readdir(situationsRootPath))
        .filter((f) => f.endsWith('.md') && !f.includes('Шаблон'));

      this.logger.log(`📊 Найдено файлов ситуаций: ${files.length}`);

      for (const file of files) {
        try {
          const filePath = path.resolve(situationsRootPath, file);
          const fileContent = await readFile(filePath, 'utf-8');
          const fileStats = await stat(filePath);

          // Проверяем, существует ли Entry с таким file_ref
          const existingEntry = await this.prisma.entry.findFirst({
            where: {
              file_ref: filePath,
            },
          });

          let entry;
          if (existingEntry) {
            // Обновляем существующий Entry
            entry = await this.prisma.entry.update({
              where: { id: existingEntry.id },
              data: {
                text: fileContent,
                updated_at: fileStats.mtime,
              },
            });
          } else {
            // Для системных записей используем первого пользователя или создаем системного
            // В будущем можно добавить системного пользователя или передавать userId через параметры
            const firstUser = await this.prisma.user.findFirst({
              select: { id: true },
            });
            
            if (!firstUser) {
              this.logger.warn(`⚠️ No users found, skipping entry creation for ${filePath}`);
              stats.skipped++;
              continue;
            }

            // Создаем новый Entry
            entry = await this.prisma.entry.create({
              data: {
                user: { connect: { id: firstUser.id } },
                type: 'situation',
                source: 'file',
                text: fileContent,
                file_ref: filePath,
                participants: [],
                tags: [],
              },
            });
          }

          if (entry.created_at.getTime() === entry.updated_at.getTime()) {
            stats.created++;
            this.logger.log(`✅ Created entry: ${entry.id}`);
          } else {
            stats.updated++;
            this.logger.log(`🔄 Updated entry: ${entry.id}`);
          }
        } catch (error) {
          stats.errors++;
          this.logger.error(`❌ Error processing file ${file}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('❌ Error reading situations directory:', error);
      stats.errors++;
    }

    this.logger.log(
      `📊 Sync complete: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped, ${stats.errors} errors`,
    );

    return stats;
  }

  /**
   * Запустить анализ для Entry (асинхронно через job queue)
   * Возвращает jobId для отслеживания статуса
   */
  async analyzeEntry(entryId: string): Promise<{ jobId: string; status: string }> {
    this.logger.log(`🔍 Enqueueing analysis job for entry ${entryId}`);

    // Проверяем, что entry существует
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
      select: { id: true, userId: true },
    });

    if (!entry) {
      throw new Error(`Entry ${entryId} not found`);
    }

    // Создаем dedupeKey для идемпотентности
    const dedupeKey = `ANALYZE_ENTRY:${entryId}`;

    // Добавляем задачу в очередь
    const { id: jobId, status } = await this.jobsService.enqueue({
      jobType: 'analyze_entry',
      queue: 'analysis',
      userId: entry.userId,
      entityType: 'entry',
      entityId: entryId,
      dedupeKey,
      priority: 0,
    });

    this.logger.log(`✅ Analysis job enqueued: ${jobId} (status: ${status})`);

    return { jobId, status };
  }

  /**
   * Получить статус анализа (для обратной совместимости)
   * @deprecated Используйте JobsService.getStatus напрямую
   */
  async getAnalysisStatus(entryId: string) {
    const session = await this.prisma.session.findUnique({
      where: { entry_id: entryId },
      select: {
        id: true,
        status: true,
        created_at: true,
        completed_at: true,
      },
    });

    return session;
  }

  /**
   * Синхронизировать и проанализировать все новые entries
   */
  async syncAndAnalyze(): Promise<{
    synced: any;
    analyzed: number;
    errors: number;
  }> {
    // 1. Синхронизация файлов
    const syncResult = await this.syncEntries();

    // 2. Анализ новых entries без сессий
    const entriesWithoutSessions = await this.prisma.entry.findMany({
      where: {
        session: null,
      },
      take: 10, // Ограничиваем количество для первого запуска
    });

    let analyzed = 0;
    let errors = 0;

    for (const entry of entriesWithoutSessions) {
      try {
        await this.analyzeEntry(entry.id);
        analyzed++;
      } catch (error) {
        errors++;
        this.logger.error(`Failed to analyze entry ${entry.id}:`, error);
      }
    }

    return {
      synced: syncResult,
      analyzed,
      errors,
    };
  }
}

