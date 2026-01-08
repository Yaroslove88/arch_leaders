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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDto, UpdateEvidenceDto } from '../common/dto';

@ApiTags('evidence')
@Controller('evidence')
export class EvidenceController {
  constructor(@Inject(EvidenceService) private readonly evidenceService: EvidenceService) {
    if (!this.evidenceService) {
      throw new Error('EvidenceService is not injected');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Получить список доказательств' })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'quest_id', required: false, type: String })
  @ApiQuery({ name: 'ability_node_id', required: false, type: String })
  @ApiQuery({ name: 'session_id', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({ name: 'offset', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Список доказательств' })
  @ApiResponse({ status: 400, description: 'Неверные параметры запроса' })
  async getAll(
    @Query('type') type?: string,
    @Query('quest_id') questId?: string,
    @Query('ability_node_id') abilityNodeId?: string,
    @Query('session_id') sessionId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.evidenceService.getAll({
      type,
      quest_id: questId,
      ability_node_id: abilityNodeId,
      session_id: sessionId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить доказательство по ID' })
  @ApiParam({ name: 'id', type: String, description: 'ID доказательства' })
  @ApiResponse({ status: 200, description: 'Доказательство найдено' })
  @ApiResponse({ status: 404, description: 'Доказательство не найдено' })
  async getById(@Param('id') id: string) {
    return this.evidenceService.getById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать доказательство' })
  @ApiBody({ type: CreateEvidenceDto })
  @ApiResponse({ status: 201, description: 'Доказательство создано' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async create(@Body() createEvidenceDto: CreateEvidenceDto) {
    return this.evidenceService.create(createEvidenceDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить доказательство' })
  @ApiParam({ name: 'id', type: String, description: 'ID доказательства' })
  @ApiBody({ type: UpdateEvidenceDto })
  @ApiResponse({ status: 200, description: 'Доказательство обновлено' })
  @ApiResponse({ status: 404, description: 'Доказательство не найдено' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async update(@Param('id') id: string, @Body() updateEvidenceDto: UpdateEvidenceDto) {
    return this.evidenceService.update(id, updateEvidenceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Удалить доказательство' })
  @ApiParam({ name: 'id', type: String, description: 'ID доказательства' })
  @ApiResponse({ status: 200, description: 'Доказательство удалено' })
  @ApiResponse({ status: 404, description: 'Доказательство не найдено' })
  async delete(@Param('id') id: string) {
    return this.evidenceService.delete(id);
  }
}

