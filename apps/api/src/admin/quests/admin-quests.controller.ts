import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminQuestsService } from './admin-quests.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';
import { CurrentAdmin, type CurrentAdmin as CurrentAdminType } from '../common/decorators/current-admin.decorator';
import { AuditService } from '../audit/audit.service';
import { AdminAction, TargetType } from '../common/enums/admin-role.enum';
import { RequiresReason } from '../common/decorators/requires-reason.decorator';

@ApiTags('admin-quests')
@Controller('admin/v1')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
export class AdminQuestsController {
  constructor(
    @Inject(AdminQuestsService) private readonly adminQuestsService: AdminQuestsService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {
    if (!this.adminQuestsService) {
      throw new InternalServerErrorException('AdminQuestsService injection failed');
    }
    if (!this.auditService) {
      throw new InternalServerErrorException('AuditService injection failed');
    }
  }

  @Get('users/:user_id/quests')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить квесты пользователя' })
  @ApiParam({ name: 'user_id', type: String, description: 'ID пользователя' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'branch', required: false, type: String })
  @ApiQuery({ name: 'linked_node', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Список квестов' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getUserQuests(
    @Param('user_id') userId: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('branch') branch?: string,
    @Query('linked_node') linkedNode?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.adminQuestsService.getUserQuests(userId, {
      status,
      type,
      branch,
      linkedNode,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  @Get('quests/:quest_id')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить квест по ID' })
  @ApiParam({ name: 'quest_id', type: String, description: 'ID квеста' })
  @ApiResponse({ status: 200, description: 'Квест найден' })
  @ApiResponse({ status: 404, description: 'Квест не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getQuestById(@Param('quest_id') questId: string) {
    return this.adminQuestsService.getQuestById(questId);
  }

  @Post('quests/:quest_id/override')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @RequiresReason()
  @ApiOperation({ summary: 'Переопределить статус квеста' })
  @ApiParam({ name: 'quest_id', type: String, description: 'ID квеста' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['force_complete', 'force_fail', 'archive', 'reactivate'] },
        reason: { type: 'string' },
      },
      required: ['action', 'reason'],
    },
  })
  @ApiResponse({ status: 200, description: 'Квест переопределен' })
  @ApiResponse({ status: 404, description: 'Квест не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 400, description: 'Требуется причина' })
  async overrideQuest(
    @Param('quest_id') questId: string,
    @Body() body: { action: 'force_complete' | 'force_fail' | 'archive' | 'reactivate'; reason: string },
    @CurrentAdmin() admin: CurrentAdminType,
    @Req() req: Request,
  ) {
    await this.auditService.log({
      adminUserId: admin.id,
      action: AdminAction.OVERRIDE_QUEST,
      targetType: TargetType.QUEST,
      targetId: questId,
      reason: body.reason,
      metadata: { action: body.action },
      ip: req.ip,
    });

    return this.adminQuestsService.overrideQuest(
      questId,
      body.action,
    );
  }

  @Post('users/:user_id/quests/regenerate')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @RequiresReason()
  @ApiOperation({ summary: 'Регенерировать квесты пользователя' })
  @ApiParam({ name: 'user_id', type: String, description: 'ID пользователя' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['append', 'replace_backlog', 'replace_all_non_completed'] },
        reason: { type: 'string' },
      },
      required: ['mode', 'reason'],
    },
  })
  @ApiResponse({ status: 200, description: 'Квесты регенерированы' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 400, description: 'Требуется причина' })
  async regenerateQuests(
    @Param('user_id') userId: string,
    @Body() body: { mode: 'append' | 'replace_backlog' | 'replace_all_non_completed'; reason: string },
    @CurrentAdmin() admin: CurrentAdminType,
    @Req() req: Request,
  ) {
    await this.auditService.log({
      adminUserId: admin.id,
      action: AdminAction.REGENERATE_QUESTS,
      targetType: TargetType.USER,
      targetId: userId,
      reason: body.reason,
      metadata: { mode: body.mode },
      ip: req.ip,
    });

    return this.adminQuestsService.regenerateQuests(
      userId,
      body.mode,
    );
  }
}

