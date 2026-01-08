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
import { AdminPromptsService } from './admin-prompts.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';
import { CurrentAdmin, type CurrentAdmin as CurrentAdminType } from '../common/decorators/current-admin.decorator';
import { AuditService } from '../audit/audit.service';
import { AdminAction, TargetType } from '../common/enums/admin-role.enum';
import { RequiresReason } from '../common/decorators/requires-reason.decorator';

@ApiTags('admin-prompts')
@Controller('admin/v1/prompts')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
export class AdminPromptsController {
  constructor(
    @Inject(AdminPromptsService) private readonly adminPromptsService: AdminPromptsService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {
    if (!this.adminPromptsService) {
      throw new InternalServerErrorException('AdminPromptsService injection failed');
    }
    if (!this.auditService) {
      throw new InternalServerErrorException('AuditService injection failed');
    }
  }

  @Get()
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить список промптов' })
  @ApiQuery({ name: 'purpose', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Поисковый запрос' })
  @ApiResponse({ status: 200, description: 'Список промптов' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getPrompts(
    @Query('purpose') purpose?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ) {
    return this.adminPromptsService.getPrompts({ purpose, status, q });
  }

  @Get(':prompt_id/versions')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить версии промпта' })
  @ApiParam({ name: 'prompt_id', type: String, description: 'ID промпта' })
  @ApiResponse({ status: 200, description: 'Список версий' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getPromptVersions(@Param('prompt_id') promptId: string) {
    return this.adminPromptsService.getPromptVersions(promptId);
  }

  @Get(':prompt_id/versions/:version')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить конкретную версию промпта' })
  @ApiParam({ name: 'prompt_id', type: String, description: 'ID промпта' })
  @ApiParam({ name: 'version', type: String, description: 'Версия промпта' })
  @ApiResponse({ status: 200, description: 'Версия найдена' })
  @ApiResponse({ status: 404, description: 'Версия не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getPromptVersion(
    @Param('prompt_id') promptId: string,
    @Param('version') version: string,
  ) {
    return this.adminPromptsService.getPromptVersion(
      promptId,
      parseInt(version, 10),
    );
  }

  @Post(':prompt_id/versions')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Создать новую версию промпта' })
  @ApiParam({ name: 'prompt_id', type: String, description: 'ID промпта' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        template: { type: 'string' },
        purpose: { type: 'string' },
        schema: { type: 'object' },
      },
      required: ['template', 'purpose'],
    },
  })
  @ApiResponse({ status: 201, description: 'Версия создана' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async createPromptVersion(
    @Param('prompt_id') promptId: string,
    @Body() body: { template: string; purpose: string; schema?: Record<string, unknown> },
    @CurrentAdmin() admin: CurrentAdminType,
  ) {
    return this.adminPromptsService.createPromptVersion(promptId, {
      ...body,
      createdByAdmin: admin.id,
    });
  }

  @Post(':prompt_id/activate')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @RequiresReason()
  @ApiOperation({ summary: 'Активировать версию промпта' })
  @ApiParam({ name: 'prompt_id', type: String, description: 'ID промпта' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        version: { type: 'number' },
        reason: { type: 'string' },
      },
      required: ['version', 'reason'],
    },
  })
  @ApiResponse({ status: 200, description: 'Версия активирована' })
  @ApiResponse({ status: 404, description: 'Версия не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 400, description: 'Требуется причина' })
  async activatePrompt(
    @Param('prompt_id') promptId: string,
    @Body() body: { version: number; reason: string },
    @CurrentAdmin() admin: CurrentAdminType,
    @Req() req: Request,
  ) {
    await this.auditService.log({
      adminUserId: admin.id,
      action: AdminAction.ACTIVATE_PROMPT,
      targetType: TargetType.PROMPT,
      targetId: promptId,
      reason: body.reason,
      metadata: { version: body.version },
      ip: req.ip,
    });

    return this.adminPromptsService.activatePrompt(promptId, body.version);
  }

  @Get('llm-runs')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить запуски LLM' })
  @ApiQuery({ name: 'user_id', required: false, type: String })
  @ApiQuery({ name: 'session_id', required: false, type: String })
  @ApiQuery({ name: 'prompt_id', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Список запусков' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getLlmRuns(
    @Query('user_id') userId?: string,
    @Query('session_id') sessionId?: string,
    @Query('prompt_id') promptId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminPromptsService.getLlmRuns({
      userId,
      sessionId,
      promptId,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }
}

