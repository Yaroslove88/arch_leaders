import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LLMModule } from '../llm/llm.module';
import { OrchestrationModule } from '../orchestration/orchestration.module';
import { AbilityEngineModule } from '../ability/ability-engine.module';

/**
 * Модуль для staged pipeline анализа
 */
@Module({
  imports: [PrismaModule, LLMModule, OrchestrationModule, AbilityEngineModule],
  providers: [PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}

