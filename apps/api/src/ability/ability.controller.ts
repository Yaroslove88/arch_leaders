import { Controller, Get, Query, UseGuards, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AbilityStateService } from './ability-state.service';
import { PrismaService } from '../prisma/prisma.service';
import { TreeService } from '../tree/tree.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('ability')
export class AbilityController {
  constructor(
    private readonly abilityStateService: AbilityStateService,
    private readonly prisma: PrismaService,
    private readonly treeService: TreeService,
  ) {}

  /**
   * Получить состояния узлов пользователя
   */
  @Get('states')
  @UseGuards(JwtAuthGuard)
  async getStates(
    @CurrentUser() user: any,
    @Query('userId') userId?: string,
  ) {
    // Если userId не указан, используем ID текущего пользователя
    // JwtPayload использует 'sub' для user ID
    const currentUserId = user?.sub || user?.id;
    
    if (!currentUserId) {
      throw new UnauthorizedException('User not authenticated');
    }
    
    // Определяем целевой userId
    const targetUserId = userId || currentUserId;
    
    // Проверяем права доступа (только свой ID или админ может запрашивать чужой)
    if (userId && userId !== currentUserId && user?.role !== 'admin') {
      throw new ForbiddenException('Access denied: can only access own ability states');
    }

    // УПРОЩЕНО: Получаем данные из TreeSemantic (источник истины для xp_current и state)
    const tree = await this.treeService.getSemantic(targetUserId);
    
    // Получаем relevance и last_activity_date из UserAbilityState
    const userStates = await this.prisma.userAbilityState.findMany({
      where: { user_id: targetUserId },
      select: {
        node_id: true,
        relevance: true,
        last_activity_date: true,
      },
    });
    
    const relevanceMap = new Map(
      userStates.map(s => [s.node_id, Number(s.relevance)])
    );
    const activityMap = new Map(
      userStates.map(s => [s.node_id, s.last_activity_date])
    );

    // Вычисляем progress на лету из xp_current / xp_required
    return tree.nodes.map((node) => {
      const xpRequired = node.xp_required || 100;
      const progress = xpRequired > 0 ? Math.min(1.0, node.xp_current / xpRequired) : 0;
      
      return {
        node_id: node.node_id,
        state: node.state,
        progress, // Вычисляется на лету
        relevance: relevanceMap.get(node.node_id) || 0,
        last_activity_date: activityMap.get(node.node_id) || undefined,
      };
    });
  }
}
