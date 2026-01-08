import { Controller, Get, Query, UseGuards, Inject, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';

@ApiTags('admin-audit')
@Controller('admin/v1/audit-log')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
export class AdminAuditController {
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {
    if (!this.auditService) {
      throw new InternalServerErrorException('AuditService injection failed');
    }
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить журнал аудита' })
  @ApiQuery({ name: 'admin_user_id', required: false, type: String, description: 'ID администратора' })
  @ApiQuery({ name: 'action', required: false, type: String, description: 'Тип действия' })
  @ApiQuery({ name: 'target_type', required: false, type: String, description: 'Тип цели' })
  @ApiQuery({ name: 'target_id', required: false, type: String, description: 'ID цели' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'Начало периода' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'Конец периода' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Лимит записей' })
  @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Курсор пагинации' })
  @ApiResponse({ status: 200, description: 'Журнал аудита' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getAuditLogs(
    @Query('admin_user_id') adminUserId?: string,
    @Query('action') action?: string,
    @Query('target_type') targetType?: string,
    @Query('target_id') targetId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.auditService.getLogs({
      adminUserId,
      action,
      targetType,
      targetId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }
}

