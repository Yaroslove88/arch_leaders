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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d62f3774-e975-44dd-84db-681709a5074c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H-E',location:'apps/api/src/common/health/health.controller.ts:check',message:'Health check called',data:{},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    try {
      // Проверяем подключение к БД
      await this.prisma.$queryRaw`SELECT 1`;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d62f3774-e975-44dd-84db-681709a5074c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H-E',location:'apps/api/src/common/health/health.controller.ts:db_ok',message:'Health DB query ok',data:{},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d62f3774-e975-44dd-84db-681709a5074c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H-E',location:'apps/api/src/common/health/health.controller.ts:db_err',message:'Health DB query failed',data:{error:error instanceof Error ? error.message : 'unknown'},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

