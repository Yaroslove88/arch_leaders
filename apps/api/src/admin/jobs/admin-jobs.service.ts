import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminJobsService {
  constructor(private prisma: PrismaService) {}

  async getJobs(filters: {
    status?: string;
    jobType?: string;
    userId?: string;
    entityType?: string;
    entityId?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    cursor?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.jobType) {
      where.job_type = filters.jobType;
    }
    if (filters.userId) {
      where.user_id = filters.userId;
    }
    if (filters.entityType) {
      where.entity_type = filters.entityType;
    }
    if (filters.entityId) {
      where.entity_id = filters.entityId;
    }
    if (filters.from || filters.to) {
      where.created_at = {};
      if (filters.from) {
        where.created_at.gte = filters.from;
      }
      if (filters.to) {
        where.created_at.lte = filters.to;
      }
    }

    const orderBy: any = {};
    const sortField = filters.sort || 'created_at';
    orderBy[sortField] = filters.order || 'desc';

    const jobs = await this.prisma.job.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            telegramUsername: true,
          },
        },
      },
      orderBy,
      take: filters.limit || 50,
      ...(filters.cursor && {
        skip: 1,
        cursor: {
          id: filters.cursor,
        },
      }),
    });

    return jobs;
  }

  async getJobById(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            telegramUsername: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async retryJob(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status === 'running') {
      throw new Error('Job is already running');
    }

    return this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'pending',
        attempt: 0,
        error: Prisma.JsonNull,
      },
    });
  }

  async cancelJob(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status === 'succeeded' || job.status === 'failed') {
      throw new Error('Cannot cancel completed job');
    }

    return this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'cancelled',
      },
    });
  }
}

