import { Controller, Post, Body, Get, UseGuards, Inject, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';

@ApiTags('admin-auth')
@Controller('admin/v1/auth')
export class AdminAuthController {
  constructor(@Inject(AdminAuthService) private readonly adminAuthService: AdminAuthService) {
    if (!this.adminAuthService) {
      throw new InternalServerErrorException('AdminAuthService injection failed');
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Вход администратора' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        telegramUsername: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
      },
      required: ['password'],
    },
  })
  @ApiResponse({ status: 200, description: 'Успешная аутентификация' })
  @ApiResponse({ status: 401, description: 'Неверные учетные данные' })
  async login(@Body() loginDto: { telegramUsername?: string; email?: string; password: string }) {
    return this.adminAuthService.login(loginDto);
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить информацию о текущем администраторе' })
  @ApiResponse({ status: 200, description: 'Информация об администраторе' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getMe(@CurrentAdmin() admin: { id: string }) {
    if (!admin?.id) {
      throw new InternalServerErrorException('Admin not found in request');
    }
    return this.adminAuthService.getMe(admin.id);
  }
}

