import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminSessionsService {
  constructor(private prisma: PrismaService) {}

  async getUserSessions(
    userId: string,
    filters: {
      status?: string;
      from?: Date;
      to?: Date;
      limit?: number;
      cursor?: string;
    },
  ) {
    const where: any = { userId };

    if (filters.status) {
      where.status = filters.status;
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

    const sessions = await this.prisma.session.findMany({
      where,
      include: {
        entry: {
          select: {
            id: true,
            type: true,
            source: true,
            created_at: true,
          },
        },
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

    return sessions;
  }

  async getSessionById(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        entry: {
          select: {
            id: true,
            type: true,
            source: true,
            created_at: true,
          },
        },
        artifacts: {
          where: {
            version: {
              // Получаем последнюю версию каждого вида
            },
          },
          orderBy: {
            version: 'desc',
          },
          distinct: ['kind'],
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async getSessionArtifacts(
    sessionId: string,
    filters: {
      kind?: string;
      latest?: boolean;
      version?: number;
    },
  ) {
    const where: any = { session_id: sessionId };

    if (filters.kind) {
      where.kind = filters.kind;
    }
    if (filters.version) {
      where.version = filters.version;
    }

    let orderBy: any = { version: 'desc' };
    let take: number | undefined = undefined;

    if (filters.latest) {
      // Получаем только последние версии каждого вида
      const artifacts = await this.prisma.sessionArtifact.findMany({
        where,
        orderBy: { version: 'desc' },
      });

      // Группируем по kind и берем последнюю версию
      const latestByKind = new Map();
      for (const artifact of artifacts) {
        if (!latestByKind.has(artifact.kind)) {
          latestByKind.set(artifact.kind, artifact);
        }
      }

      return Array.from(latestByKind.values());
    }

    return this.prisma.sessionArtifact.findMany({
      where,
      orderBy,
      take,
    });
  }
}

