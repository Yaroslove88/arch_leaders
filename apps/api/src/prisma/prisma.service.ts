import { Injectable, OnModuleInit, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d62f3774-e975-44dd-84db-681709a5074c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H-C',location:'apps/api/src/prisma/prisma.service.ts:onModuleInit',message:'Prisma onModuleInit: connecting',data:{},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    // Не блокируем запуск API: подключение к БД может занять время/быть временно недоступным.
    void this.$connect()
      .then(() => {
        this.logger.log('✅ Prisma connected to database');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d62f3774-e975-44dd-84db-681709a5074c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H-C',location:'apps/api/src/prisma/prisma.service.ts:onModuleInit_ok',message:'Prisma connected',data:{},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      })
      .catch((error) => {
        this.logger.error('❌ Failed to connect to database:', error);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d62f3774-e975-44dd-84db-681709a5074c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H-C',location:'apps/api/src/prisma/prisma.service.ts:onModuleInit_err',message:'Prisma connect failed (continuing startup)',data:{error:error instanceof Error ? error.message : 'unknown'},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }
}

