import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { AnalysisParserService } from './analysis-parser.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LLMModule } from '../llm/llm.module';
import { PathConfigModule } from '../config/config.module';
import { OrchestrationModule } from '../orchestration/orchestration.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    // Явно импортируем глобальные модули для правильной инициализации
    // Даже если они @Global(), явный импорт гарантирует порядок инициализации
    PrismaModule,
    LLMModule,
    PathConfigModule,
    // Используем OrchestrationModule вместо прямого импорта QuestsModule
    // Это разрывает циклическую зависимость
    OrchestrationModule,
    JobsModule,
  ],
  controllers: [SyncController],
  providers: [
    // Порядок важен: зависимости должны быть созданы первыми
    AnalysisParserService, // Зависит от LLMService (из LLMModule) и PrismaService (из PrismaModule)
    SyncService, // Зависит от AnalysisParserService
  ],
  exports: [SyncService, AnalysisParserService],
})
export class SyncModule {}

