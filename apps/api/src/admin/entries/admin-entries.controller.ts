import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  UnauthorizedException,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminEntriesService } from './admin-entries.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';
import { CurrentAdmin, type CurrentAdmin as CurrentAdminType } from '../common/decorators/current-admin.decorator';
import { AuditService } from '../audit/audit.service';
import { AdminAction, TargetType } from '../common/enums/admin-role.enum';
import { RequiresReason } from '../common/decorators/requires-reason.decorator';

@ApiTags('admin-entries')
@Controller('admin/v1')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
export class AdminEntriesController {
  constructor(
    @Inject(AdminEntriesService) private readonly adminEntriesService: AdminEntriesService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {
    if (!this.adminEntriesService) {
      throw new InternalServerErrorException('AdminEntriesService injection failed');
    }
    if (!this.auditService) {
      throw new InternalServerErrorException('AuditService injection failed');
    }
  }

  @Get('users/:user_id/entries')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить записи пользователя' })
  @ApiParam({ name: 'user_id', type: String, description: 'ID пользователя' })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'source', required: false, type: String })
  @ApiQuery({ name: 'is_sensitive', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Список записей' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getUserEntries(
    @Param('user_id') userId: string,
    @Query('type') type?: string,
    @Query('source') source?: string,
    @Query('is_sensitive') isSensitive?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.adminEntriesService.getUserEntries(userId, {
      type,
      source,
      isSensitive: isSensitive === 'true',
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  @Get('entries/:entry_id')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить запись по ID' })
  @ApiParam({ name: 'entry_id', type: String, description: 'ID записи' })
  @ApiQuery({ name: 'view', required: false, enum: ['masked', 'full'], description: 'Режим просмотра' })
  @ApiQuery({ name: 'reason', required: false, type: String, description: 'Причина просмотра (обязательно для full)' })
  @ApiResponse({ status: 200, description: 'Запись найдена' })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 400, description: 'Требуется причина для полного просмотра' })
  async getEntryById(
    @Param('entry_id') entryId: string,
    @CurrentAdmin() admin: CurrentAdminType,
    @Req() req: Request,
    @Query('view') view: 'masked' | 'full' = 'masked',
    @Query('reason') reason?: string,
  ) {
    if (view === 'full') {
      if (admin.role !== AdminRole.SUPER_ADMIN) {
        throw new UnauthorizedException('Only super_admin can view full entry');
      }
      if (!reason) {
        throw new BadRequestException('Reason is required for full view');
      }

      await this.auditService.log({
        adminUserId: admin.id,
        action: AdminAction.VIEW_FULL_ENTRY,
        targetType: TargetType.ENTRY,
        targetId: entryId,
        reason,
        ip: req.ip,
      });
    }

    return this.adminEntriesService.getEntryById(entryId, view);
  }

  @Post('entries/:entry_id/rerun-analysis')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @RequiresReason()
  @ApiOperation({ summary: 'Перезапустить анализ записи' })
  @ApiParam({ name: 'entry_id', type: String, description: 'ID записи' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        analysis_version: { type: 'number' },
        prompt_overrides: { type: 'object' },
        reason: { type: 'string' },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({ status: 200, description: 'Анализ перезапущен' })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 400, description: 'Требуется причина' })
  async rerunAnalysis(
    @Param('entry_id') entryId: string,
    @Body() body: { analysis_version?: number; prompt_overrides?: Record<string, unknown>; reason: string },
    @CurrentAdmin() admin: CurrentAdminType,
    @Req() req: Request,
  ) {
    await this.auditService.log({
      adminUserId: admin.id,
      action: AdminAction.RERUN_ANALYSIS,
      targetType: TargetType.ENTRY,
      targetId: entryId,
      reason: body.reason,
      metadata: { options: body },
      ip: req.ip,
    });

    return this.adminEntriesService.rerunAnalysis(entryId, {
      analysisVersion: body.analysis_version,
      promptOverrides: body.prompt_overrides,
    });
  }
}

