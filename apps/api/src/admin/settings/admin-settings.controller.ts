import {
  Controller,
  Get,
  UseGuards,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminSettingsService } from './admin-settings.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';

@ApiTags('admin-settings')
@Controller('admin/v1/settings')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
export class AdminSettingsController {
  constructor(
    @Inject(AdminSettingsService) private readonly adminSettingsService: AdminSettingsService,
  ) {
    if (!this.adminSettingsService) {
      throw new InternalServerErrorException('AdminSettingsService injection failed');
    }
  }

  @Get()
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Получить системные настройки' })
  @ApiResponse({ status: 200, description: 'Системные настройки' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async getSettings() {
    return this.adminSettingsService.getSystemSettings();
  }

  @Get('api-keys')
  @ApiBearerAuth()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Получить список API ключей (маскированные)' })
  @ApiResponse({ status: 200, description: 'Список API ключей' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async getApiKeys() {
    return this.adminSettingsService.getApiKeys();
  }
}
