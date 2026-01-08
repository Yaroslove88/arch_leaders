import { Controller, Post, Param, Get, Inject, InternalServerErrorException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SyncService } from './sync.service';

@ApiTags('sync')
@Controller('sync')
export class SyncController {
  constructor(@Inject(SyncService) private readonly syncService: SyncService) {
    if (!this.syncService) {
      throw new InternalServerErrorException('SyncService injection failed');
    }
  }

  @Post('entries')
  @ApiOperation({ summary: 'Синхронизировать записи' })
  @ApiResponse({ status: 200, description: 'Синхронизация выполнена' })
  @ApiResponse({ status: 500, description: 'Ошибка синхронизации' })
  async syncEntries() {
    return this.syncService.syncEntries();
  }

  @Post('analyze/:entryId')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Проанализировать запись (асинхронно)' })
  @ApiParam({ name: 'entryId', type: String, description: 'ID записи' })
  @ApiResponse({ status: 202, description: 'Анализ поставлен в очередь' })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  @ApiResponse({ status: 500, description: 'Ошибка постановки в очередь' })
  async analyzeEntry(@Param('entryId') entryId: string) {
    const result = await this.syncService.analyzeEntry(entryId);
    // Возвращаем 202 Accepted для асинхронной обработки
    return {
      status: 'accepted',
      jobId: result.jobId,
      message: 'Analysis job enqueued',
      checkStatus: `/jobs/${result.jobId}/status`,
    };
  }

  @Post('all')
  @ApiOperation({ summary: 'Синхронизировать и проанализировать все' })
  @ApiResponse({ status: 200, description: 'Операция выполнена' })
  @ApiResponse({ status: 500, description: 'Ошибка выполнения операции' })
  async syncAndAnalyze() {
    return this.syncService.syncAndAnalyze();
  }

  @Get('status')
  @ApiOperation({ summary: 'Получить статус синхронизации' })
  @ApiResponse({ status: 200, description: 'Статус получен' })
  @ApiResponse({ status: 500, description: 'Ошибка получения статуса' })
  async getStatus() {
    // Используем метод сервиса вместо прямого доступа к приватному полю
    return this.syncService.getSyncStatus();
  }
}

