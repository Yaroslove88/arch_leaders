import { Controller, Get, Post, Param, Body, Inject, InternalServerErrorException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CasesService, CaseProgressResponse } from './cases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('cases')
@Controller('cases')
export class CasesController {
  constructor(@Inject(CasesService) private readonly casesService: CasesService) {
    if (!this.casesService) {
      throw new InternalServerErrorException('CasesService injection failed');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Получить все интерактивные кейсы' })
  @ApiResponse({ status: 200, description: 'Список кейсов' })
  async getAllCases() {
    return this.casesService.getAllCases();
  }

  // Специфичные роуты должны быть ПЕРЕД параметризованными
  @Get('progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить прогресс кейсов пользователя' })
  @ApiResponse({ status: 200, description: 'Прогресс кейсов' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getCaseProgress(@CurrentUser() user: JwtPayload) {
    return this.casesService.getCaseProgress(user.sub);
  }

  @Post('progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Сохранить прогресс кейсов (deprecated - используйте /solve)' })
  @ApiBody({ description: 'Прогресс кейсов', type: Object })
  @ApiResponse({ status: 200, description: 'Прогресс сохранён' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async saveCaseProgress(@CurrentUser() user: JwtPayload, @Body() progress: CaseProgressResponse) {
    // Deprecated: прогресс теперь сохраняется автоматически через /solve
    return { success: true, message: 'Progress synced from database. Use /solve endpoint to save progress.' };
  }

  @Get('by-node/:nodeId')
  @ApiOperation({ summary: 'Получить кейсы для узла' })
  @ApiParam({ name: 'nodeId', type: String, description: 'ID узла' })
  @ApiResponse({ status: 200, description: 'Список кейсов для узла' })
  @ApiResponse({ status: 404, description: 'Узел не найден' })
  async getCasesByNode(@Param('nodeId') nodeId: string) {
    return this.casesService.getCasesByNode(nodeId);
  }

  @Get('by-branch/:branchId')
  @ApiOperation({ summary: 'Получить кейсы для ветки' })
  @ApiParam({ name: 'branchId', type: String, description: 'ID ветки' })
  @ApiResponse({ status: 200, description: 'Список кейсов для ветки' })
  @ApiResponse({ status: 404, description: 'Ветка не найдена' })
  async getCasesByBranch(@Param('branchId') branchId: string) {
    return this.casesService.getCasesByBranch(branchId);
  }

  @Get('cache/clear')
  @ApiOperation({ summary: 'Очистить кеш кейсов (для разработки)' })
  @ApiResponse({ status: 200, description: 'Кеш очищен' })
  async clearCache() {
    this.casesService.clearCache();
    return { message: 'Cache cleared' };
  }

  @Get(':id/availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить информацию о доступности кейса' })
  @ApiParam({ name: 'id', type: String, description: 'ID кейса' })
  @ApiResponse({ 
    status: 200, 
    description: 'Информация о доступности кейса',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean' },
        reason: { type: 'string' },
        requirements: {
          type: 'object',
          properties: {
            questsRequired: { type: 'number' },
            questsCompleted: { type: 'number' },
            progressRequired: { type: 'number' },
            currentProgress: { type: 'number' },
            nodeState: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Кейс не найден' })
  async getCaseAvailability(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.casesService.getCaseAvailability(id, user.sub);
  }

  // Параметризованные роуты должны быть ПОСЛЕ специфичных
  @Get(':id')
  @ApiOperation({ summary: 'Получить кейс по ID' })
  @ApiParam({ name: 'id', type: String, description: 'ID кейса' })
  @ApiResponse({ status: 200, description: 'Кейс найден' })
  @ApiResponse({ status: 404, description: 'Кейс не найден' })
  async getCase(@Param('id') id: string) {
    return this.casesService.getCase(id);
  }

  @Post(':id/solve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отметить кейс как решённый' })
  @ApiParam({ name: 'id', type: String, description: 'ID кейса' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        selectedOption: { type: 'string', description: 'Выбранный вариант (A, B, C, D)' },
        skillUsed: { type: 'string', description: 'Использованный навык' },
        smImpact: { type: 'object', description: 'Влияние на SM метрики' },
      } 
    } 
  })
  @ApiResponse({ status: 200, description: 'Кейс отмечен как решённый' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Кейс не найден' })
  async markCaseAsSolved(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body?: { selectedOption?: string; skillUsed?: string; smImpact?: Record<string, number> },
  ) {
    return this.casesService.markCaseAsSolved(id, user.sub, body?.selectedOption, body?.skillUsed);
  }

  @Get('patterns')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить анализ паттернов решений' })
  @ApiResponse({ status: 200, description: 'Анализ паттернов' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getPatternAnalysis(@CurrentUser() user: JwtPayload) {
    return this.casesService.getPatternAnalysis(user.sub);
  }

  @Get('attempts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить все попытки прохождения кейсов' })
  @ApiResponse({ status: 200, description: 'Список попыток' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getCaseAttempts(@CurrentUser() user: JwtPayload) {
    return this.casesService.getCaseAttempts(user.sub);
  }
}
