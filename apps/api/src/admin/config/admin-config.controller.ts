import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UseGuards,
  Req,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminConfigService } from './admin-config.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';
import { CurrentAdmin, type CurrentAdmin as CurrentAdminType } from '../common/decorators/current-admin.decorator';
import { AuditService } from '../audit/audit.service';
import { AdminAction, TargetType } from '../common/enums/admin-role.enum';
import { RequiresReason } from '../common/decorators/requires-reason.decorator';

@ApiTags('admin-config')
@Controller('admin/v1/config-sets')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
export class AdminConfigController {
  constructor(
    @Inject(AdminConfigService) private readonly adminConfigService: AdminConfigService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {
    if (!this.adminConfigService) {
      throw new InternalServerErrorException('AdminConfigService injection failed');
    }
    if (!this.auditService) {
      throw new InternalServerErrorException('AuditService injection failed');
    }
  }

  @Get()
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить список наборов конфигураций' })
  @ApiResponse({ status: 200, description: 'Список наборов конфигураций' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getConfigSets() {
    return this.adminConfigService.getConfigSets();
  }

  @Get(':config_set_id')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить набор конфигураций по ID' })
  @ApiParam({ name: 'config_set_id', type: String, description: 'ID набора конфигураций' })
  @ApiResponse({ status: 200, description: 'Набор найден' })
  @ApiResponse({ status: 404, description: 'Набор не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getConfigSetById(@Param('config_set_id') configSetId: string) {
    return this.adminConfigService.getConfigSetById(configSetId);
  }

  @Get(':config_set_id/versions')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить версии набора конфигураций' })
  @ApiParam({ name: 'config_set_id', type: String, description: 'ID набора конфигураций' })
  @ApiResponse({ status: 200, description: 'Список версий' })
  @ApiResponse({ status: 404, description: 'Набор не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getConfigVersions(@Param('config_set_id') configSetId: string) {
    return this.adminConfigService.getConfigVersions(configSetId);
  }

  @Post(':config_set_id/versions')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Создать новую версию набора конфигураций' })
  @ApiParam({ name: 'config_set_id', type: String, description: 'ID набора конфигураций' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        payload: { type: 'object' },
        comment: { type: 'string' },
      },
      required: ['payload'],
    },
  })
  @ApiResponse({ status: 201, description: 'Версия создана' })
  @ApiResponse({ status: 404, description: 'Набор не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async createConfigVersion(
    @Param('config_set_id') configSetId: string,
    @Body() body: { payload: Record<string, unknown>; comment?: string },
    @CurrentAdmin() admin: CurrentAdminType,
  ) {
    return this.adminConfigService.createConfigVersion(configSetId, {
      ...body,
      createdByAdmin: admin.id,
    });
  }

  @Post(':config_set_id/activate')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @RequiresReason()
  @ApiOperation({ summary: 'Активировать версию набора конфигураций' })
  @ApiParam({ name: 'config_set_id', type: String, description: 'ID набора конфигураций' })
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
  async activateConfigVersion(
    @Param('config_set_id') configSetId: string,
    @Body() body: { version: number; reason: string },
    @CurrentAdmin() admin: CurrentAdminType,
    @Req() req: Request,
  ) {
    await this.auditService.log({
      adminUserId: admin.id,
      action: AdminAction.ACTIVATE_CONFIG,
      targetType: TargetType.CONFIG,
      targetId: configSetId,
      reason: body.reason,
      metadata: { version: body.version },
      ip: req.ip,
    });

    return this.adminConfigService.activateConfigVersion(
      configSetId,
      body.version,
    );
  }

  @Get('users/:user_id/config')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить конфигурацию пользователя' })
  @ApiParam({ name: 'user_id', type: String, description: 'ID пользователя' })
  @ApiResponse({ status: 200, description: 'Конфигурация найдена' })
  @ApiResponse({ status: 404, description: 'Конфигурация не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getUserConfig(@Param('user_id') userId: string) {
    return this.adminConfigService.getUserConfig(userId);
  }

  @Post('users/:user_id/config/pin')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Закрепить версию конфигурации для пользователя' })
  @ApiParam({ name: 'user_id', type: String, description: 'ID пользователя' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        config_set_id: { type: 'string' },
        version: { type: 'number' },
      },
      required: ['config_set_id', 'version'],
    },
  })
  @ApiResponse({ status: 200, description: 'Версия закреплена' })
  @ApiResponse({ status: 404, description: 'Пользователь или конфигурация не найдены' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async pinUserConfigVersion(
    @Param('user_id') userId: string,
    @Body() body: { config_set_id: string; version: number },
  ) {
    return this.adminConfigService.pinUserConfigVersion(
      userId,
      body.config_set_id,
      body.version,
    );
  }
}

