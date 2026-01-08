import { Module } from '@nestjs/common';
import { AdminPipelineController } from './admin-pipeline.controller';
import { JobsModule } from '../../jobs/jobs.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [JobsModule, PrismaModule],
  controllers: [AdminPipelineController],
})
export class AdminPipelineModule {}

