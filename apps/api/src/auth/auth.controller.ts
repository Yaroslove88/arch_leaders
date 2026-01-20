import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException, Inject, Patch, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { TelegramWebAppDto } from './dto/telegram-webapp.dto';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            telegramUsername: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  @ApiResponse({ status: 409, description: 'Пользователь уже существует' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Аутентификация через Telegram username и пароль' })
  @ApiBody({ 
    type: LoginDto,
    description: 'Поддерживает apiKey (legacy) или telegramUsername + password',
    schema: {
      type: 'object',
      properties: {
        apiKey: { type: 'string', description: 'Legacy API key (опционально)' },
        telegramUsername: { type: 'string', description: 'Telegram username (без @)' },
        login: { type: 'string', description: 'Алиас для telegramUsername' },
        username: { type: 'string', description: 'Алиас для telegramUsername' },
        password: { type: 'string', description: 'Пароль пользователя' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Успешная аутентификация',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            telegramUsername: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  @ApiResponse({ status: 401, description: 'Неверные учетные данные' })
  async login(@Body() loginDto: LoginDto) {
    if (!loginDto) {
      throw new BadRequestException('Request body is missing');
    }
    
    // Валидация: либо apiKey, либо telegramUsername + password
    if (!loginDto.apiKey && (!loginDto.telegramUsername || !loginDto.password)) {
      throw new BadRequestException('Необходимо указать либо apiKey, либо telegramUsername и password');
    }
    
    return this.authService.login(loginDto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Смена пароля пользователя' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Пароль успешно изменен',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Пароль успешно изменен' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  @ApiResponse({ status: 401, description: 'Неверный текущий пароль или не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async changePassword(
    @CurrentUser() user: { sub: string },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.sub, changePasswordDto);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить список всех пользователей (только для админов)' })
  @ApiResponse({
    status: 200,
    description: 'Список пользователей',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          telegramUsername: { type: 'string' },
          role: { type: 'string' },
          created_at: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Patch('users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Изменить роль пользователя (только для админов)' })
  @ApiParam({ name: 'id', type: String, description: 'ID пользователя' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role: { type: 'string', description: 'Новая роль пользователя' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Роль пользователя успешно обновлена',
  })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async updateUserRole(
    @Param('id') userId: string,
    @Body() body: { role: string },
  ) {
    return this.authService.updateUserRole(userId, body.role);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить пользователя (только для админов)' })
  @ApiParam({ name: 'id', type: String, description: 'ID пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно удален',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async deleteUser(@Param('id') userId: string) {
    return this.authService.deleteUser(userId);
  }

  @Post('telegram')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Аутентификация через Telegram OAuth' })
  @ApiBody({ type: TelegramAuthDto })
  @ApiResponse({
    status: 200,
    description: 'Успешная аутентификация через Telegram',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            telegramUsername: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  @ApiResponse({ status: 401, description: 'Неверные данные Telegram или устаревшая подпись' })
  async loginWithTelegram(@Body() telegramAuthDto: TelegramAuthDto) {
    if (!telegramAuthDto) {
      throw new BadRequestException('Request body is missing');
    }
    
    return this.authService.loginWithTelegram(telegramAuthDto);
  }

  @Post('telegram-webapp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Аутентификация через Telegram Mini App (WebApp)' })
  @ApiBody({ type: TelegramWebAppDto })
  @ApiResponse({
    status: 200,
    description: 'Успешная аутентификация через Telegram Mini App',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            telegramUsername: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  @ApiResponse({ status: 401, description: 'Неверная подпись initData' })
  async loginWithTelegramWebApp(@Body() webAppDto: TelegramWebAppDto) {
    if (!webAppDto || !webAppDto.initData) {
      throw new BadRequestException('initData is required');
    }
    
    return this.authService.loginWithTelegramWebApp(webAppDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить данные текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Данные пользователя',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        telegramUsername: { type: 'string' },
        role: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getMe(@CurrentUser() user: { sub: string }) {
    return this.authService.findUserById(user.sub);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить свой аккаунт' })
  @ApiResponse({
    status: 200,
    description: 'Аккаунт успешно удален',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Аккаунт успешно удален' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async deleteMyAccount(@CurrentUser() user: { sub: string }) {
    return this.authService.deleteUser(user.sub);
  }
}

