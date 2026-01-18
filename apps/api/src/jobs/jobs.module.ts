import { Module, forwardRef } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsWorkerService } from './jobs-worker.service';
import { JobsController } from './jobs.controller';
import { AnalyzeEntryHandler } from './job-handlers/analyze-entry.handler';
import { DegradeExperienceHandler } from './job-handlers/degrade-experience.handler';
import { ScheduledDegradationService } from './job-handlers/scheduled-degradation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OrchestrationModule } from '../orchestration/orchestration.module';
import { PipelineModule } from '../pipeline/pipeline.module';
import { AbilityEngineModule } from '../ability/ability-engine.module';
import { TreeModule } from '../tree/tree.module';

/**
 * Модуль для работы с очередью задач
 */
@Module({
  imports: [PrismaModule, OrchestrationModule, PipelineModule, AbilityEngineModule, TreeModule],
  controllers: [JobsController],
  providers: [
    JobsService,
    JobsWorkerService,
    AnalyzeEntryHandler,
    DegradeExperienceHandler,
    ScheduledDegradationService,
  ],
  exports: [JobsService, JobsWorkerService],
})
export class JobsModule {}

