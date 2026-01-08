import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminPromptsService {
  constructor(private prisma: PrismaService) {}

  async getPrompts(filters: {
    purpose?: string;
    status?: string;
    q?: string;
  }) {
    const where: any = {};

    if (filters.purpose) {
      where.purpose = filters.purpose;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.q) {
      where.prompt_id = { contains: filters.q, mode: 'insensitive' };
    }

    const prompts = await this.prisma.promptRegistry.findMany({
      where,
      orderBy: [
        { prompt_id: 'asc' },
        { version: 'desc' },
      ],
    });

    // Группируем по prompt_id и берем последнюю версию каждого
    const latestByPrompt = new Map();
    for (const prompt of prompts) {
      if (!latestByPrompt.has(prompt.prompt_id)) {
        latestByPrompt.set(prompt.prompt_id, prompt);
      }
    }

    return Array.from(latestByPrompt.values());
  }

  async getPromptVersions(promptId: string) {
    return this.prisma.promptRegistry.findMany({
      where: { prompt_id: promptId },
      orderBy: {
        version: 'desc',
      },
    });
  }

  async getPromptVersion(promptId: string, version: number) {
    const prompt = await this.prisma.promptRegistry.findFirst({
      where: {
        prompt_id: promptId,
        version,
      },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt version not found');
    }

    return prompt;
  }

  async createPromptVersion(
    promptId: string,
    data: {
      template: string;
      purpose: string;
      schema?: any;
      createdByAdmin: string;
    },
  ) {
    // Получаем последнюю версию
    const lastVersion = await this.prisma.promptRegistry.findFirst({
      where: { prompt_id: promptId },
      orderBy: { version: 'desc' },
    });

    const newVersion = (lastVersion?.version || 0) + 1;

    return this.prisma.promptRegistry.create({
      data: {
        prompt_id: promptId,
        version: newVersion,
        status: 'draft',
        purpose: data.purpose,
        template: data.template,
        schema: data.schema,
        created_by_admin: data.createdByAdmin,
      },
    });
  }

  async activatePrompt(promptId: string, version: number) {
    // Деактивируем все версии этого промпта
    await this.prisma.promptRegistry.updateMany({
      where: {
        prompt_id: promptId,
        status: 'active',
      },
      data: {
        status: 'deprecated',
      },
    });

    // Активируем нужную версию
    return this.prisma.promptRegistry.updateMany({
      where: {
        prompt_id: promptId,
        version,
      },
      data: {
        status: 'active',
      },
    });
  }

  async getLlmRuns(filters: {
    userId?: string;
    sessionId?: string;
    promptId?: string;
    status?: string;
    from?: Date;
    to?: Date;
  }) {
    const where: any = {};

    if (filters.userId) {
      where.session = {
        userId: filters.userId,
      };
    }
    if (filters.sessionId) {
      where.session_id = filters.sessionId;
    }
    if (filters.promptId) {
      where.prompt_id = filters.promptId;
    }
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

    return this.prisma.llmRun.findMany({
      where,
      include: {
        session: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 100,
    });
  }
}

