import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Проверка здоровья API и подключения к БД' })
  @ApiResponse({ 
    status: 200, 
    description: 'API и БД работают нормально',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-01-07T10:00:00.000Z' },
        database: { type: 'string', example: 'connected' },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Ошибка подключения к БД',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        timestamp: { type: 'string', example: '2025-01-07T10:00:00.000Z' },
        database: { type: 'string', example: 'disconnected' },
        error: { type: 'string', example: 'Connection timeout' },
      },
    },
  })
  async check() {
    try {
      // Проверяем подключение к БД
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

