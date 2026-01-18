import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminAnalyticsService } from './admin-analytics.service';

@Controller('admin/v1/analytics')
@UseGuards(AdminAuthGuard)
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  @Get('overview')
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('daily')
  async getDailyStats(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getDailyStats(daysNum);
  }

  @Get('top-users')
  async getTopActiveUsers(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getTopActiveUsers(limitNum);
  }
}
