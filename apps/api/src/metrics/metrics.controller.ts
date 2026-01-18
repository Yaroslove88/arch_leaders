import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MetricsService } from './metrics.service';

/**
 * Metrics Controller
 * API для получения метрик Core Loop
 */
@ApiTags('metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Получить сводку метрик
   */
  @Get('summary')
  @ApiOperation({
    summary: 'Сводка метрик',
    description: 'Возвращает метрики за текущую и прошлую неделю с трендами',
  })
  @ApiResponse({
    status: 200,
    description: 'Метрики получены успешно',
    schema: {
      type: 'object',
      properties: {
        thisWeek: { type: 'object' },
        lastWeek: { type: 'object' },
        trend: {
          type: 'object',
          properties: {
            completionRate: { type: 'number' },
            entries: { type: 'number' },
            evidences: { type: 'number' },
          },
        },
      },
    },
  })
  async getSummary(@Request() req: any) {
    return this.metricsService.getMetricsSummary(req.user.id);
  }

  /**
   * Получить метрики за период
   */
  @Get('period')
  @ApiOperation({
    summary: 'Метрики за период',
    description: 'Возвращает метрики Core Loop за указанный период',
  })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Количество дней (default: 7)' })
  @ApiResponse({
    status: 200,
    description: 'Метрики получены успешно',
  })
  async getPeriod(
    @Request() req: any,
    @Query('days') days?: string,
  ) {
    return this.metricsService.getPeriodMetrics(req.user.id, {
      days: days ? parseInt(days, 10) : 7,
    });
  }

  /**
   * Получить ежедневную статистику
   */
  @Get('daily')
  @ApiOperation({
    summary: 'Ежедневная статистика',
    description: 'Возвращает статистику по дням для графиков',
  })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Количество дней (default: 30)' })
  @ApiResponse({
    status: 200,
    description: 'Статистика получена успешно',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          entriesCount: { type: 'number' },
          sessionsSucceeded: { type: 'number' },
          questsCompleted: { type: 'number' },
          evidencesCount: { type: 'number' },
        },
      },
    },
  })
  async getDaily(
    @Request() req: any,
    @Query('days') days?: string,
  ) {
    return this.metricsService.getDailyStats(req.user.id, days ? parseInt(days, 10) : 30);
  }
}
