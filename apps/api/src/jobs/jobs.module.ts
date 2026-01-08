import { Module, forwardRef } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsWorkerService } from './jobs-worker.service';
import { JobsController } from './jobs.controller';
import { AnalyzeEntryHandler } from './job-handlers/analyze-entry.handler';
import { PrismaModule } from '../prisma/prisma.module';
import { OrchestrationModule } from '../orchestration/orchestration.module';
import { PipelineModule } from '../pipeline/pipeline.module';

/**
 * Модуль для работы с очередью задач
 */
@Module({
  imports: [PrismaModule, OrchestrationModule, PipelineModule],
  controllers: [JobsController],
  providers: [JobsService, JobsWorkerService, AnalyzeEntryHandler],
  exports: [JobsService, JobsWorkerService],
})
export class JobsModule {}

