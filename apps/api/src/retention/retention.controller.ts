import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { RetentionService, UserRetention } from './retention.service';

@ApiTags('retention')
@Controller('retention')
export class RetentionController {
  constructor(private readonly retentionService: RetentionService) {}

  @Post('activity')
  @ApiOperation({ summary: 'Записать активность пользователя' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        activityType: { type: 'string', enum: ['case', 'quest', 'entry', 'trace', 'any'] },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Активность записана' })
  async recordActivity(
    @Body() body: { userId: string; activityType?: 'case' | 'quest' | 'entry' | 'trace' | 'any' },
  ) {
    await this.retentionService.recordActivity(body.userId, body.activityType || 'any');
    return { success: true, message: 'Activity recorded' };
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Получить данные о ретеншене пользователя' })
  @ApiParam({ name: 'userId', type: String, description: 'ID пользователя' })
  @ApiResponse({ status: 200, description: 'Данные о ретеншене' })
  async getUserRetention(@Param('userId') userId: string): Promise<UserRetention> {
    return this.retentionService.getUserRetention(userId);
  }

  @Get(':userId/risk')
  @ApiOperation({ summary: 'Проверить, под угрозой ли серия' })
  @ApiParam({ name: 'userId', type: String, description: 'ID пользователя' })
  @ApiResponse({ status: 200, description: 'Статус серии' })
  async checkStreakRisk(@Param('userId') userId: string) {
    const isAtRisk = await this.retentionService.isStreakAtRisk(userId);
    const daysWithoutActivity = await this.retentionService.getDaysWithoutActivity(userId);
    return {
      isAtRisk,
      daysWithoutActivity,
      shouldRemind: daysWithoutActivity >= 3 || isAtRisk,
    };
  }
}
