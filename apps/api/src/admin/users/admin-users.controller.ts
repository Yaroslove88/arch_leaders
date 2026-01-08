import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  UseGuards,
  Req,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminUsersService } from './admin-users.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';
import { CurrentAdmin, type CurrentAdmin as CurrentAdminType } from '../common/decorators/current-admin.decorator';
import { AuditService } from '../audit/audit.service';
import { AdminAction, TargetType } from '../common/enums/admin-role.enum';
import { RequiresReason } from '../common/decorators/requires-reason.decorator';

@ApiTags('admin-users')
@Controller('admin/v1/users')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
export class AdminUsersController {
  constructor(
    @Inject(AdminUsersService) private readonly adminUsersService: AdminUsersService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {
    if (!this.adminUsersService) {
      throw new InternalServerErrorException('AdminUsersService injection failed');
    }
    if (!this.auditService) {
      throw new InternalServerErrorException('AuditService injection failed');
    }
  }

  @Get()
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить список пользователей' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Поисковый запрос' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'created_from', required: false, type: String })
  @ApiQuery({ name: 'created_to', required: false, type: String })
  @ApiQuery({ name: 'last_seen_from', required: false, type: String })
  @ApiQuery({ name: 'last_seen_to', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Список пользователей' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getUsers(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('created_from') createdFrom?: string,
    @Query('created_to') createdTo?: string,
    @Query('last_seen_from') lastSeenFrom?: string,
    @Query('last_seen_to') lastSeenTo?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.adminUsersService.getUsers({
      q,
      status,
      createdFrom: createdFrom ? new Date(createdFrom) : undefined,
      createdTo: createdTo ? new Date(createdTo) : undefined,
      lastSeenFrom: lastSeenFrom ? new Date(lastSeenFrom) : undefined,
      lastSeenTo: lastSeenTo ? new Date(lastSeenTo) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
      sort,
      order,
    });
  }

  @Get(':user_id')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiParam({ name: 'user_id', type: String, description: 'ID пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь найден' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getUserById(@Param('user_id') userId: string) {
    return this.adminUsersService.getUserById(userId);
  }

  @Patch(':user_id')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @RequiresReason()
  @ApiOperation({ summary: 'Обновить статус пользователя' })
  @ApiParam({ name: 'user_id', type: String, description: 'ID пользователя' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        note: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({ status: 200, description: 'Пользователь обновлен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 400, description: 'Требуется причина' })
  async updateUser(
    @Param('user_id') userId: string,
    @Body() body: { status?: string; note?: string; reason: string },
    @CurrentAdmin() admin: CurrentAdminType,
    @Req() req: Request,
  ) {
    await this.auditService.log({
      adminUserId: admin.id,
      action: AdminAction.UPDATE_USER_STATUS,
      targetType: TargetType.USER,
      targetId: userId,
      reason: body.reason,
      metadata: { changes: body },
      ip: req.ip,
    });

    return this.adminUsersService.updateUser(userId, body);
  }
}

