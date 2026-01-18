import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { SupportService } from './support.service';

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('case/opened')
  @ApiOperation({ summary: 'Записать открытие кейса' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        caseId: { type: 'string' },
        caseTitle: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Открытие записано' })
  async recordCaseOpened(@Body() body: { userId: string; caseId: string; caseTitle: string }) {
    this.supportService.recordCaseOpened(body.userId, body.caseId, body.caseTitle);
    return { success: true };
  }

  @Post('case/choice')
  @ApiOperation({ summary: 'Записать выбор в кейсе' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        caseId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Выбор записан' })
  async recordCaseChoice(@Body() body: { userId: string; caseId: string }) {
    this.supportService.recordCaseChoice(body.userId, body.caseId);
    return { success: true };
  }

  @Post('quest/started')
  @ApiOperation({ summary: 'Записать начало квеста' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        questId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Начало записано' })
  async recordQuestStarted(@Body() body: { userId: string; questId: string }) {
    this.supportService.recordQuestStarted(body.userId, body.questId);
    return { success: true };
  }

  @Post('quest/evidence')
  @ApiOperation({ summary: 'Записать добавление evidence' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        questId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Evidence записано' })
  async recordQuestEvidence(@Body() body: { userId: string; questId: string }) {
    this.supportService.recordQuestEvidence(body.userId, body.questId);
    return { success: true };
  }

  @Get(':userId/stuck')
  @ApiOperation({ summary: 'Получить застрявшие элементы' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, description: 'Список застрявших элементов' })
  async getStuckItems(@Param('userId') userId: string, @Body() body?: { caseTitles?: Record<string, string>; questTitles?: Record<string, string> }) {
    return this.supportService.getStuckItems(
      userId,
      body?.caseTitles || {},
      body?.questTitles || {}
    );
  }
}
