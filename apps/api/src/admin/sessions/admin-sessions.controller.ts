import { Controller, Get, Param, Query, UseGuards, Inject, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AdminSessionsService } from './admin-sessions.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';

@ApiTags('admin-sessions')
@Controller('admin/v1')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
export class AdminSessionsController {
  constructor(@Inject(AdminSessionsService) private readonly adminSessionsService: AdminSessionsService) {
    if (!this.adminSessionsService) {
      throw new InternalServerErrorException('AdminSessionsService injection failed');
    }
  }

  @Get('users/:user_id/sessions')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить сессии пользователя' })
  @ApiParam({ name: 'user_id', type: String, description: 'ID пользователя' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Список сессий' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getUserSessions(
    @Param('user_id') userId: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.adminSessionsService.getUserSessions(userId, {
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  @Get('sessions/:session_id')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить сессию по ID' })
  @ApiParam({ name: 'session_id', type: String, description: 'ID сессии' })
  @ApiResponse({ status: 200, description: 'Сессия найдена' })
  @ApiResponse({ status: 404, description: 'Сессия не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getSessionById(@Param('session_id') sessionId: string) {
    return this.adminSessionsService.getSessionById(sessionId);
  }

  @Get('sessions/:session_id/artifacts')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить артефакты сессии' })
  @ApiParam({ name: 'session_id', type: String, description: 'ID сессии' })
  @ApiQuery({ name: 'kind', required: false, type: String })
  @ApiQuery({ name: 'latest', required: false, type: String })
  @ApiQuery({ name: 'version', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Список артефактов' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getSessionArtifacts(
    @Param('session_id') sessionId: string,
    @Query('kind') kind?: string,
    @Query('latest') latest?: string,
    @Query('version') version?: string,
  ) {
    return this.adminSessionsService.getSessionArtifacts(sessionId, {
      kind,
      latest: latest === 'true',
      version: version ? parseInt(version, 10) : undefined,
    });
  }
}

