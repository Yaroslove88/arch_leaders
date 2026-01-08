import { Controller, Get, Param, Query, UseGuards, Inject, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAbilitiesService } from './admin-abilities.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';

@ApiTags('admin-abilities')
@Controller('admin/v1')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
export class AdminAbilitiesController {
  constructor(@Inject(AdminAbilitiesService) private readonly adminAbilitiesService: AdminAbilitiesService) {
    if (!this.adminAbilitiesService) {
      throw new InternalServerErrorException('AdminAbilitiesService injection failed');
    }
  }

  @Get('users/:user_id/abilities')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить способности пользователя' })
  @ApiParam({ name: 'user_id', type: String, description: 'ID пользователя' })
  @ApiQuery({ name: 'state', required: false, type: String })
  @ApiQuery({ name: 'branch', required: false, type: String })
  @ApiQuery({ name: 'changed_from', required: false, type: String })
  @ApiQuery({ name: 'changed_to', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Список способностей' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getUserAbilities(
    @Param('user_id') userId: string,
    @Query('state') state?: string,
    @Query('branch') branch?: string,
    @Query('changed_from') changedFrom?: string,
    @Query('changed_to') changedTo?: string,
  ) {
    return this.adminAbilitiesService.getUserAbilities(userId, {
      state,
      branch,
      changedFrom: changedFrom ? new Date(changedFrom) : undefined,
      changedTo: changedTo ? new Date(changedTo) : undefined,
    });
  }

  @Get('users/:user_id/abilities/:node_id')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATOR)
  @ApiOperation({ summary: 'Получить способность пользователя по узлу' })
  @ApiParam({ name: 'user_id', type: String, description: 'ID пользователя' })
  @ApiParam({ name: 'node_id', type: String, description: 'ID узла' })
  @ApiResponse({ status: 200, description: 'Способность найдена' })
  @ApiResponse({ status: 404, description: 'Способность не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getUserAbility(
    @Param('user_id') userId: string,
    @Param('node_id') nodeId: string,
  ) {
    return this.adminAbilitiesService.getUserAbility(userId, nodeId);
  }
}

