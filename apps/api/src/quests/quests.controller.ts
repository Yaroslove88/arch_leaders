import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Inject, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { QuestsService } from './quests.service';
import { QuestGenerationService } from './quest-generation.service';
import { CreateQuestDto, UpdateQuestDto } from '../common/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProtectBaseQuestsGuard } from '../common/guards/protect-base-quests.guard';
import { OverwriteProtectionInterceptor } from '../common/interceptors/overwrite-protection.interceptor';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('quests')
@Controller('quests')
@UseInterceptors(OverwriteProtectionInterceptor)
export class QuestsController {
  constructor(
    @Inject(QuestsService) private readonly questsService: QuestsService,
    @Inject(QuestGenerationService) private readonly questGenerationService: QuestGenerationService,
  ) {
    if (!this.questsService) {
      throw new Error('QuestsService is not injected');
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить список квестов пользователя' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Список квестов' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getAll(@Query('status') status?: string, @CurrentUser() user?: JwtPayload) {
    return this.questsService.getAll(status as any, user?.sub);
  }

  @Get('completed-by-node/:nodeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить завершенные квесты по узлу' })
  @ApiParam({ name: 'nodeId', type: String, description: 'ID узла' })
  @ApiResponse({ status: 200, description: 'Список завершенных квестов' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getCompletedByNode(@Param('nodeId') nodeId: string, @CurrentUser() user?: JwtPayload) {
    return this.questsService.getCompletedByNode(nodeId, user?.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить квест по ID' })
  @ApiParam({ name: 'id', type: String, description: 'ID квеста' })
  @ApiResponse({ status: 200, description: 'Квест найден' })
  @ApiResponse({ status: 404, description: 'Квест не найден' })
  async getById(@Param('id') id: string) {
    return this.questsService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать квест' })
  @ApiBody({ type: CreateQuestDto })
  @ApiResponse({ status: 201, description: 'Квест создан' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async create(@Body() createQuestDto: CreateQuestDto, @CurrentUser() user?: JwtPayload) {
    return this.questsService.create(createQuestDto, user?.sub);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, ProtectBaseQuestsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить квест' })
  @ApiParam({ name: 'id', type: String, description: 'ID квеста' })
  @ApiBody({ type: UpdateQuestDto })
  @ApiResponse({ status: 200, description: 'Квест обновлен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Запрещено: базовые квесты могут изменять только администраторы' })
  @ApiResponse({ status: 404, description: 'Квест не найден' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async update(@Param('id') id: string, @Body() updateQuestDto: UpdateQuestDto, @CurrentUser() user?: JwtPayload) {
    return this.questsService.update(id, updateQuestDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ProtectBaseQuestsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить квест' })
  @ApiParam({ name: 'id', type: String, description: 'ID квеста' })
  @ApiResponse({ status: 200, description: 'Квест удален' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Запрещено: базовые квесты могут удалять только администраторы' })
  @ApiResponse({ status: 404, description: 'Квест не найден' })
  async delete(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.questsService.delete(id);
  }

  @Post(':id/activate')
  @UseGuards(JwtAuthGuard, ProtectBaseQuestsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Активировать квест' })
  @ApiParam({ name: 'id', type: String, description: 'ID квеста' })
  @ApiResponse({ status: 200, description: 'Квест активирован' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Запрещено: базовые квесты могут активировать только владельцы' })
  @ApiResponse({ status: 404, description: 'Квест не найден' })
  async activate(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.questsService.activate(id, user?.sub);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard, ProtectBaseQuestsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Завершить квест' })
  @ApiParam({ name: 'id', type: String, description: 'ID квеста' })
  @ApiBody({ schema: { type: 'object', properties: { evidence: { type: 'string' } } }, required: false })
  @ApiResponse({ status: 200, description: 'Квест завершен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Запрещено: базовые квесты могут завершать только владельцы' })
  @ApiResponse({ status: 404, description: 'Квест не найден' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async complete(@Param('id') id: string, @Body() body?: { evidence?: string }, @CurrentUser() user?: JwtPayload) {
    return this.questsService.complete(id, body?.evidence);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, ProtectBaseQuestsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить статус квеста' })
  @ApiParam({ name: 'id', type: String, description: 'ID квеста' })
  @ApiBody({ schema: { type: 'object', properties: { status: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Статус обновлен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Запрещено: базовые квесты могут изменять только администраторы' })
  @ApiResponse({ status: 404, description: 'Квест не найден' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }, @CurrentUser() user?: JwtPayload) {
    return this.questsService.updateStatus(id, body.status as any, user?.sub);
  }

  @Post('generate/:sessionId')
  @ApiOperation({ summary: 'Сгенерировать квесты из сессии' })
  @ApiParam({ name: 'sessionId', type: String, description: 'ID сессии' })
  @ApiResponse({ status: 200, description: 'Квесты сгенерированы' })
  @ApiResponse({ status: 404, description: 'Сессия не найдена' })
  async generateFromSession(@Param('sessionId') sessionId: string) {
    const count = await this.questGenerationService.generateQuestsFromSession(sessionId);
    return { generated: count, message: `Generated ${count} quests from session` };
  }

  @Post('manage-limit')
  @ApiOperation({ summary: 'Управление лимитом активных квестов' })
  @ApiResponse({ status: 200, description: 'Лимит обработан' })
  async manageLimit() {
    // Управление лимитом теперь происходит автоматически через orchestration
    // Этот endpoint можно использовать для ручного управления, если нужно
    const activeQuests = await this.questsService.getAll('active');
    const activeCount = activeQuests.count;
    
    if (activeCount <= 5) {
      return { archived: 0, message: `Active quests count (${activeCount}) is within limit` };
    }
    
    // В будущем можно добавить метод в QuestsService для управления лимитом
    return { archived: 0, message: `Manual limit management not yet implemented. Use orchestration.` };
  }

  @Post(':id/theory')
  @UseGuards(JwtAuthGuard, ProtectBaseQuestsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить теорию квеста' })
  @ApiParam({ name: 'id', type: String, description: 'ID квеста' })
  @ApiBody({ schema: { type: 'object', properties: { theory: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Теория обновлена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Запрещено: базовые квесты могут изменять только администраторы' })
  @ApiResponse({ status: 404, description: 'Квест не найден' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async updateTheory(@Param('id') id: string, @Body() body: { theory: string }, @CurrentUser() user?: JwtPayload) {
    return this.questsService.updateQuestTheory(id, body.theory);
  }

  @Post('update-theories-from-mapping')
  @UseGuards(JwtAuthGuard) // Этот метод должен работать только с базовыми квестами, проверка на уровне сервиса
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить теории квестов из маппинга (только базовые квесты)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              linkedNodes: { type: 'array', items: { type: 'string' } },
              theory: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Теории обновлены' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async updateTheoriesFromMapping(@Body() body: { mapping: Array<{ title?: string; linkedNodes?: string[]; theory: string }> }, @CurrentUser() user?: JwtPayload) {
    // Метод updateQuestsTheoryByMapping должен проверять source='base_template' на уровне сервиса
    return this.questsService.updateQuestsTheoryByMapping(body.mapping);
  }

  @Post('sync-from-templates')
  @UseGuards(JwtAuthGuard) // Этот метод используется скриптом sync-base-quests.ts, защита на уровне сервиса
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Синхронизировать квесты из шаблонов (только базовые квесты, source=base_template)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              steps: { type: 'array' },
              criteria: { type: 'object' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Квесты синхронизированы' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async syncFromTemplates(@Body() body: { templates: Array<{ id: string; description?: string; steps?: Array<Record<string, unknown>>; criteria?: Record<string, unknown> }> }, @CurrentUser() user?: JwtPayload) {
    // Метод syncAllQuestsFromTemplates должен обновлять только source='base_template' (как в sync-base-quests.ts)
    return this.questsService.syncAllQuestsFromTemplates(body.templates);
  }
}

