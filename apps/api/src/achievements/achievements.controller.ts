import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AchievementsService } from './achievements.service';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('user/:userId')
  async getUserAchievements(@Param('userId') userId: string) {
    return this.achievementsService.getUserAchievements(userId);
  }

  @Get('node/:userId/:nodeId')
  async getNodeAchievements(
    @Param('userId') userId: string,
    @Param('nodeId') nodeId: string,
  ) {
    return this.achievementsService.getNodeAchievements(userId, nodeId);
  }
}
