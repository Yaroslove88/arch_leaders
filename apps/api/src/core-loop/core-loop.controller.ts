import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoreLoopService } from './core-loop.service';
import {
  CoreLoopProcessRequest,
  CoreLoopProcessResponse,
  CoreLoopCompleteRequest,
  CoreLoopCompleteResponse,
} from './core-loop.types';

/**
 * Core Loop Controller
 * Unified API для полного цикла: Ситуация → Анализ → Квест → Evidence → Tree Update
 * 
 * @see docs/DECISION_LOGIC.md
 * @see projects/leadership-architect-docs/core-loop-design.md
 */
@ApiTags('core-loop')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('core-loop')
export class CoreLoopController {
  constructor(private readonly coreLoopService: CoreLoopService) {}

  /**
   * Обработать ситуацию через Core Loop
   * Entry -> Analysis -> Quest (optional)
   */
  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Обработать ситуацию',
    description: `
      Единый endpoint для обработки управленческой ситуации:
      1. Создаёт Entry с описанием ситуации
      2. Анализирует через LLM (themes, patterns, ability_signals)
      3. Генерирует квест на основе анализа (если generateQuest=true)
      
      Возвращает все результаты в одном ответе с rationale.
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['text'],
      properties: {
        text: {
          type: 'string',
          description: 'Описание ситуации',
          example: 'На встрече команды я предложил новый подход, но коллеги восприняли это скептически...',
        },
        type: {
          type: 'string',
          enum: ['situation', 'reflection', 'observation'],
          default: 'situation',
        },
        participants: {
          type: 'array',
          items: { type: 'string' },
          description: 'Участники ситуации',
        },
        generateQuest: {
          type: 'boolean',
          default: true,
          description: 'Генерировать квест сразу',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ситуация обработана успешно',
    schema: {
      type: 'object',
      properties: {
        entry: { type: 'object' },
        session: { type: 'object' },
        quest: { type: 'object', nullable: true },
        currentStage: { type: 'string', enum: ['analysis', 'quest'] },
      },
    },
  })
  async process(
    @Request() req: any,
    @Body() body: CoreLoopProcessRequest,
  ): Promise<CoreLoopProcessResponse> {
    return this.coreLoopService.process(req.user.id, body);
  }

  /**
   * Завершить квест с evidence
   * Evidence -> Quest Completion -> Tree Update
   */
  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Завершить квест',
    description: `
      Единый endpoint для завершения квеста:
      1. Создаёт Evidence с результатами
      2. Обновляет статус квеста на 'done'
      3. Обновляет дерево способностей (добавляет XP)
      4. Проверяет и разблокирует зависимые узлы
      
      Возвращает все изменения дерева с rationale.
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['questId', 'evidence'],
      properties: {
        questId: {
          type: 'string',
          description: 'ID квеста',
        },
        evidence: {
          type: 'object',
          required: ['what_happened', 'what_noticed'],
          properties: {
            what_happened: {
              type: 'string',
              description: 'Что произошло',
            },
            what_noticed: {
              type: 'string',
              description: 'Что заметил пользователь',
            },
            notes: {
              type: 'string',
              description: 'Дополнительные заметки',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Квест завершён успешно',
    schema: {
      type: 'object',
      properties: {
        evidence: { type: 'object' },
        questCompleted: { type: 'boolean' },
        treeChanges: { type: 'array' },
        rationale: { type: 'object' },
        currentStage: { type: 'string', enum: ['tree_update'] },
      },
    },
  })
  async complete(
    @Request() req: any,
    @Body() body: CoreLoopCompleteRequest,
  ): Promise<CoreLoopCompleteResponse> {
    return this.coreLoopService.complete(req.user.id, body);
  }
}
