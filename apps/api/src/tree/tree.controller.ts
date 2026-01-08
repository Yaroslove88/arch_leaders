import { Controller, Get, Post, Patch, Param, Body, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { TreeService } from './tree.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApplyTreeChangeDto } from '../common/dto';

@ApiTags('tree')
@Controller('tree')
export class TreeController {
  constructor(@Inject(TreeService) private readonly treeService: TreeService) {
    if (!this.treeService) {
      throw new Error('TreeService is not injected');
    }
  }

  @Get('semantic')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить семантическое дерево пользователя' })
  @ApiResponse({ status: 200, description: 'Семантическое дерево' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getSemantic(@CurrentUser('sub') userId?: string) {
    return this.treeService.getSemantic(userId);
  }

  @Get('layout')
  @ApiOperation({ summary: 'Получить layout дерево' })
  @ApiBody({ schema: { type: 'object', properties: { fromRevision: { type: 'number' } } }, required: false })
  @ApiResponse({ status: 200, description: 'Layout дерево' })
  async getLayout(@Body() body?: { fromRevision?: number }) {
    return this.treeService.getLayout(body?.fromRevision);
  }

  @Post('change')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Применить изменение к дереву' })
  @ApiBody({ type: ApplyTreeChangeDto })
  @ApiResponse({ status: 200, description: 'Изменение применено' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async applyChange(@Body() applyTreeChangeDto: ApplyTreeChangeDto, @CurrentUser('sub') userId?: string) {
    return this.treeService.applyChange({
      ops: applyTreeChangeDto.ops,
      rationale: applyTreeChangeDto.rationale,
      actor: applyTreeChangeDto.actor,
      links: applyTreeChangeDto.links,
      userId,
    });
  }

  @Post('undo/:changeId')
  @ApiOperation({ summary: 'Откатить изменение дерева' })
  @ApiParam({ name: 'changeId', type: String, description: 'ID изменения' })
  @ApiResponse({ status: 200, description: 'Изменение откачено' })
  @ApiResponse({ status: 404, description: 'Изменение не найдено' })
  async undoChange(@Param('changeId') changeId: string) {
    return this.treeService.undoChange(changeId);
  }

  @Patch('node/:nodeId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить узел дерева' })
  @ApiParam({ name: 'nodeId', type: String, description: 'ID узла' })
  @ApiBody({ schema: { type: 'object', properties: { xpDelta: { type: 'number' }, patch: { type: 'object' } } } })
  @ApiResponse({ status: 200, description: 'Узел обновлен' })
  @ApiResponse({ status: 404, description: 'Узел не найден' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async updateNode(
    @Param('nodeId') nodeId: string,
    @Body() body: { xpDelta?: number; patch?: Record<string, unknown> },
    @CurrentUser('sub') userId?: string,
  ) {
    if (body.xpDelta !== undefined) {
      return this.treeService.updateNodeProgress(nodeId, body.xpDelta, userId);
    }
    // TODO: Реализовать обновление через applyChange
    throw new Error('Not implemented');
  }
}

