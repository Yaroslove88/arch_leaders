import { Controller, Get, Post, Patch, Param, Body, Query, Inject, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TreeService } from './tree.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProtectGlobalTreeGuard } from '../common/guards/protect-global-tree.guard';
import { OverwriteProtectionInterceptor } from '../common/interceptors/overwrite-protection.interceptor';
import { ApplyTreeChangeDto } from '../common/dto';

@ApiTags('tree')
@Controller('tree')
@UseInterceptors(OverwriteProtectionInterceptor)
export class TreeController {
  constructor(
    @Inject(TreeService) private readonly treeService: TreeService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {
    if (!this.treeService) {
      throw new Error('TreeService is not injected');
    }
  }

  @Get('semantic')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить семантическое дерево пользователя' })
  @ApiResponse({ status: 200, description: 'Семантическое дерево' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getSemantic(@CurrentUser() user: JwtPayload) {
    const userId = user?.sub;
    if (!userId) {
      throw new Error('User ID not found in JWT payload');
    }
    return this.treeService.getSemantic(userId);
  }

  @Get('nodes/info')
  @ApiOperation({ summary: 'Получить информацию об узлах (prerequisites и т.д.)' })
  @ApiQuery({ name: 'nodeIds', required: false, description: 'Comma-separated list of node IDs' })
  @ApiResponse({ status: 200, description: 'Информация об узлах' })
  async getNodesInfo(@Query('nodeIds') nodeIds?: string) {
    const nodeIdArray = nodeIds ? nodeIds.split(',') : [];
    
    if (nodeIdArray.length === 0) {
      // Возвращаем все узлы
      const nodes = await this.prisma.abilityNode.findMany({
        select: {
          id: true,
          prerequisites: true,
        },
      });
      
      return nodes.map((node) => ({
        node_id: node.id,
        prerequisites: node.prerequisites || [],
      }));
    }
    
    const nodes = await this.prisma.abilityNode.findMany({
      where: { id: { in: nodeIdArray } },
      select: {
        id: true,
        prerequisites: true,
      },
    });
    
    return nodes.map((node) => ({
      node_id: node.id,
      prerequisites: node.prerequisites || [],
    }));
  }

  @Get('layout')
  @ApiOperation({ summary: 'Получить layout дерево' })
  @ApiQuery({ name: 'fromRevision', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Layout дерево' })
  async getLayout(@Query('fromRevision') fromRevision?: string) {
    const revision = fromRevision ? parseInt(fromRevision, 10) : undefined;
    return this.treeService.getLayout(revision);
  }

  @Post('change')
  @UseGuards(JwtAuthGuard, ProtectGlobalTreeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Применить изменение к дереву' })
  @ApiBody({ type: ApplyTreeChangeDto })
  @ApiResponse({ status: 200, description: 'Изменение применено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Запрещено: только администраторы могут изменять глобальное дерево' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async applyChange(@Body() applyTreeChangeDto: ApplyTreeChangeDto, @CurrentUser() user: JwtPayload) {
    return this.treeService.applyChange({
      ops: applyTreeChangeDto.ops as any,
      rationale: applyTreeChangeDto.rationale,
      actor: applyTreeChangeDto.actor,
      links: applyTreeChangeDto.links ? [applyTreeChangeDto.links] : undefined,
      userId: user.sub,
    });
  }

  @Post('undo/:changeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Откатить изменение дерева' })
  @ApiParam({ name: 'changeId', type: String, description: 'ID изменения' })
  @ApiResponse({ status: 200, description: 'Изменение откачено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Изменение не найдено' })
  async undoChange(@Param('changeId') changeId: string, @CurrentUser() user: JwtPayload) {
    return this.treeService.undoChange(changeId);
  }

  @Patch('node/:nodeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить узел дерева' })
  @ApiParam({ name: 'nodeId', type: String, description: 'ID узла' })
  @ApiBody({ schema: { type: 'object', properties: { xpDelta: { type: 'number' }, patch: { type: 'object' } } } })
  @ApiResponse({ status: 200, description: 'Узел обновлен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Узел не найден' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async updateNode(
    @Param('nodeId') nodeId: string,
    @Body() body: { xpDelta?: number; patch?: Record<string, unknown> },
    @CurrentUser() user: JwtPayload,
  ) {
    if (body.xpDelta !== undefined) {
      return this.treeService.updateNodeProgress(nodeId, body.xpDelta, user.sub);
    }
    // TODO: Реализовать обновление через applyChange
    throw new Error('Not implemented');
  }
}
