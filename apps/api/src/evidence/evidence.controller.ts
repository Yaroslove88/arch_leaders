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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDto, UpdateEvidenceDto } from '../common/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('evidence')
@Controller('evidence')
export class EvidenceController {
  constructor(@Inject(EvidenceService) private readonly evidenceService: EvidenceService) {
    if (!this.evidenceService) {
      throw new Error('EvidenceService is not injected');
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить список доказательств пользователя' })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'quest_id', required: false, type: String })
  @ApiQuery({ name: 'ability_node_id', required: false, type: String })
  @ApiQuery({ name: 'session_id', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({ name: 'offset', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Список доказательств' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 400, description: 'Неверные параметры запроса' })
  async getAll(
    @CurrentUser() user: JwtPayload,
    @Query('type') type?: string,
    @Query('quest_id') questId?: string,
    @Query('ability_node_id') abilityNodeId?: string,
    @Query('session_id') sessionId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.evidenceService.getAll(user.sub, {
      type,
      quest_id: questId,
      ability_node_id: abilityNodeId,
      session_id: sessionId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить доказательство по ID' })
  @ApiParam({ name: 'id', type: String, description: 'ID доказательства' })
  @ApiResponse({ status: 200, description: 'Доказательство найдено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Доказательство не найдено' })
  async getById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.evidenceService.getById(id, user.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать доказательство' })
  @ApiBody({ type: CreateEvidenceDto })
  @ApiResponse({ status: 201, description: 'Доказательство создано' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async create(@CurrentUser() user: JwtPayload, @Body() createEvidenceDto: CreateEvidenceDto) {
    return this.evidenceService.create(user.sub, createEvidenceDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить доказательство' })
  @ApiParam({ name: 'id', type: String, description: 'ID доказательства' })
  @ApiBody({ type: UpdateEvidenceDto })
  @ApiResponse({ status: 200, description: 'Доказательство обновлено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Доказательство не найдено' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() updateEvidenceDto: UpdateEvidenceDto) {
    return this.evidenceService.update(id, user.sub, updateEvidenceDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Удалить доказательство' })
  @ApiParam({ name: 'id', type: String, description: 'ID доказательства' })
  @ApiResponse({ status: 200, description: 'Доказательство удалено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Доказательство не найдено' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.evidenceService.delete(id, user.sub);
  }
}
