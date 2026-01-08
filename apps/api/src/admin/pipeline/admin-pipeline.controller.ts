import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { JobsService } from '../../jobs/jobs.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { PipelineConfig } from '../../pipeline/pipeline.types';

@ApiTags('admin', 'pipeline')
@Controller('admin/pipeline')
export class AdminPipelineController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('recompute-entry/:entryId')
  @ApiOperation({ summary: 'Пересчитать анализ записи с определенного этапа' })
  @ApiParam({ name: 'entryId', type: String, description: 'ID записи' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fromStage: {
          type: 'string',
          enum: ['preprocess', 'extract', 'signals', 'apply', 'quests'],
          description: 'С какого этапа начать пересчет',
        },
        stagesEnabled: {
          type: 'object',
          description: 'Какие этапы включены',
        },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'Задача поставлена в очередь' })
  async recomputeEntry(
    @Param('entryId') entryId: string,
    @Body() body: { fromStage?: string; stagesEnabled?: Record<string, boolean> },
  ) {
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
      select: { id: true, userId: true },
    });

    if (!entry) {
      throw new Error(`Entry ${entryId} not found`);
    }

    const config: PipelineConfig = {
      stagesEnabled: {
        preprocess: body.stagesEnabled?.preprocess ?? true,
        extract: body.stagesEnabled?.extract ?? true,
        signals: body.stagesEnabled?.signals ?? true,
        apply: body.stagesEnabled?.apply ?? true,
        quests: body.stagesEnabled?.quests ?? true,
      },
      fromStage: body.fromStage as any,
    };

    const { id: jobId, status } = await this.jobsService.enqueue({
      jobType: 'analyze_entry',
      queue: 'analysis',
      userId: entry.userId,
      entityType: 'entry',
      entityId: entryId,
      params: { config },
      dedupeKey: `ANALYZE_ENTRY:${entryId}:${body.fromStage || 'full'}`,
    });

    return {
      status: 'accepted',
      jobId,
      message: 'Recompute job enqueued',
      checkStatus: `/jobs/${jobId}/status`,
    };
  }

  @Post('rerun-job/:jobId')
  @ApiOperation({ summary: 'Перезапустить задачу с определенного этапа' })
  @ApiParam({ name: 'jobId', type: String, description: 'ID задачи' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fromStage: {
          type: 'string',
          enum: ['preprocess', 'extract', 'signals', 'apply', 'quests'],
        },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'Задача перезапущена' })
  async rerunJob(@Param('jobId') jobId: string, @Body() body: { fromStage?: string }) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, entity_id: true, user_id: true, params: true },
    });

    if (!job || !job.entity_id) {
      throw new Error(`Job ${jobId} not found or has no entity_id`);
    }

    const existingParams = (job.params as { config?: PipelineConfig }) || {};
    const config: PipelineConfig = {
      stagesEnabled: existingParams.config?.stagesEnabled || {
        preprocess: true,
        extract: true,
        signals: true,
        apply: true,
        quests: true,
      },
      fromStage: (body.fromStage || existingParams.config?.fromStage) as any,
    };

    const { id: newJobId, status } = await this.jobsService.enqueue({
      jobType: 'analyze_entry',
      queue: 'analysis',
      userId: job.user_id || undefined,
      entityType: 'entry',
      entityId: job.entity_id,
      params: { config },
      dedupeKey: `RERUN:${jobId}:${body.fromStage || 'full'}`,
    });

    return {
      status: 'accepted',
      jobId: newJobId,
      message: 'Job rerun enqueued',
      checkStatus: `/jobs/${newJobId}/status`,
    };
  }
}

