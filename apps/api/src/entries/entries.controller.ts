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
  UnauthorizedException,
  UseGuards,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { EntriesService } from './entries.service';
import { CreateEntryDto } from '../common/dto/create-entry.dto';
import { UpdateEntryDto } from '../common/dto/update-entry.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('entries')
@Controller('entries')
export class EntriesController {
  constructor(@Inject(EntriesService) private readonly entriesService: EntriesService) {
    if (!this.entriesService) {
      throw new InternalServerErrorException('EntriesService injection failed');
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить список записей' })
  @ApiQuery({ name: 'type', required: false, description: 'Тип записи (situation, reflection, feedback, voice, import)' })
  @ApiQuery({ name: 'source', required: false, description: 'Источник записи (file, telegram, web)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Лимит записей' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Смещение для пагинации' })
  @ApiResponse({ status: 200, description: 'Список записей успешно получен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getAll(
    @CurrentUser() user: JwtPayload,
    @Query('type') type?: string,
    @Query('source') source?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    // Guard гарантирует, что user определен, но проверка на всякий случай
    if (!user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.entriesService.getAll(user.sub, {
      type,
      source,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить запись по ID' })
  @ApiParam({ name: 'id', description: 'UUID записи' })
  @ApiResponse({ status: 200, description: 'Запись найдена' })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.entriesService.getById(id, user.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать новую запись' })
  @ApiBody({ type: CreateEntryDto })
  @ApiResponse({ status: 201, description: 'Запись успешно создана' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async create(@Body() createEntryDto: CreateEntryDto, @CurrentUser() user: JwtPayload) {
    return this.entriesService.create(user.sub, createEntryDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить запись' })
  @ApiParam({ name: 'id', description: 'UUID записи' })
  @ApiBody({ type: UpdateEntryDto })
  @ApiResponse({ status: 200, description: 'Запись успешно обновлена' })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async update(@Param('id') id: string, @Body() updateEntryDto: UpdateEntryDto, @CurrentUser() user: JwtPayload) {
    // TODO: Реализовать метод update в сервисе с проверкой userId
    throw new Error('Method not implemented');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Удалить запись' })
  @ApiParam({ name: 'id', description: 'UUID записи' })
  @ApiResponse({ status: 200, description: 'Запись успешно удалена' })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    // TODO: Реализовать метод delete в сервисе с проверкой userId
    throw new Error('Method not implemented');
  }
}

