import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, UpdateSessionDto } from '../common/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('sessions')
@Controller('sessions')
export class SessionsController {
  constructor(@Inject(SessionsService) private readonly sessionsService: SessionsService) {
    if (!this.sessionsService) {
      throw new Error('SessionsService is not injected');
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить список сессий пользователя' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({ name: 'offset', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Список сессий' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.sessionsService.getAll(user.sub, {
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить сессию по ID' })
  @ApiParam({ name: 'id', type: String, description: 'ID сессии' })
  @ApiResponse({ status: 200, description: 'Сессия найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Сессия не найдена' })
  async getById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.sessionsService.getById(id, user.sub);
  }

  @Get('entry/:entryId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить сессию по ID записи' })
  @ApiParam({ name: 'entryId', type: String, description: 'ID записи' })
  @ApiResponse({ status: 200, description: 'Сессия найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Сессия не найдена' })
  async getByEntryId(@Param('entryId') entryId: string, @CurrentUser() user: JwtPayload) {
    return this.sessionsService.getByEntryId(entryId, user.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать сессию' })
  @ApiBody({ type: CreateSessionDto })
  @ApiResponse({ status: 201, description: 'Сессия создана' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async create(@Body() createSessionDto: CreateSessionDto, @CurrentUser() user: JwtPayload) {
    return this.sessionsService.create(user.sub, createSessionDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить сессию' })
  @ApiParam({ name: 'id', type: String, description: 'ID сессии' })
  @ApiBody({ type: UpdateSessionDto })
  @ApiResponse({ status: 200, description: 'Сессия обновлена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Сессия не найдена' })
  async update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto, @CurrentUser() user: JwtPayload) {
    return this.sessionsService.update(id, user.sub, updateSessionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Удалить сессию' })
  @ApiParam({ name: 'id', type: String, description: 'ID сессии' })
  @ApiResponse({ status: 200, description: 'Сессия удалена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Сессия не найдена' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.sessionsService.delete(id, user.sub);
  }
}

