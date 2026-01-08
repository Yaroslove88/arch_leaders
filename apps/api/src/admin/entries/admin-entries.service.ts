import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminEntriesService {
  constructor(private prisma: PrismaService) {}

  async getUserEntries(
    userId: string,
    filters: {
      type?: string;
      source?: string;
      isSensitive?: boolean;
      from?: Date;
      to?: Date;
      limit?: number;
      cursor?: string;
    },
  ) {
    const where: any = { userId };

    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.source) {
      where.source = filters.source;
    }
    if (filters.isSensitive !== undefined) {
      where.is_sensitive = filters.isSensitive;
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

    const entries = await this.prisma.entry.findMany({
      where,
      select: {
        id: true,
        type: true,
        source: true,
        is_sensitive: true,
        created_at: true,
        updated_at: true,
        text_masked: true, // По умолчанию только masked
        // text (raw) только для FULL VIEW
      },
      orderBy: {
        created_at: 'desc',
      },
      take: filters.limit || 50,
      ...(filters.cursor && {
        skip: 1,
        cursor: {
          id: filters.cursor,
        },
      }),
    });

    return entries;
  }

  async getEntryById(entryId: string, viewMode: 'masked' | 'full' = 'masked') {
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            telegramUsername: true,
          },
        },
        session: {
          select: {
            id: true,
            status: true,
            created_at: true,
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    const result: any = {
      id: entry.id,
      userId: entry.userId,
      type: entry.type,
      source: entry.source,
      is_sensitive: entry.is_sensitive,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      participants: entry.participants,
      context_json: entry.context_json,
      file_ref: entry.file_ref,
      tags: entry.tags,
      user: entry.user,
      session: entry.session,
    };

    if (viewMode === 'full') {
      result.text = entry.text;
    } else {
      result.text = entry.text_masked || this.maskText(entry.text);
    }

    return result;
  }

  async rerunAnalysis(entryId: string, options?: { analysisVersion?: number; promptOverrides?: any }) {
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
      include: { session: true },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    // Создаем job для пересчета
    const job = await this.prisma.job.create({
      data: {
        queue: 'analysis',
        job_type: 'analyze_entry',
        status: 'pending',
        user_id: entry.userId,
        entity_type: 'entry',
        entity_id: entryId,
        params: {
          analysisVersion: options?.analysisVersion || 1,
          promptOverrides: options?.promptOverrides,
        },
      },
    });

    return job;
  }

  private maskText(text: string): string {
    // Простое маскирование: обрезаем до 200 символов
    if (text.length <= 200) {
      return text;
    }
    return text.substring(0, 200) + '... [masked]';
  }
}

