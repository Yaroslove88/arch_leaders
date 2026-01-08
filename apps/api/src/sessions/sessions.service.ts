import { Injectable, NotFoundException, BadRequestException, Inject, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto, UpdateSessionDto } from '../common/dto';
import {
  validateInsightsJson,
  validateFocusJson,
  validateAbilitySignalsJson,
  parseInsightsJson,
  parseFocusJson,
  parseAbilitySignalsJson,
} from '../common/mappers/session.mapper';

@Injectable()
export class SessionsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    if (!this.prisma) {
      throw new InternalServerErrorException('PrismaService injection failed');
    }
  }

  /**
   * Получить все сессии пользователя
   */
  async getAll(userId: string, params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    if (!this.prisma?.session) {
      throw new InternalServerErrorException('Prisma session model is not available');
    }

    const where: any = {
      userId, // Фильтруем по пользователю
    };

    if (params?.status) {
      where.status = params.status;
    }

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
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
          quests: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: params?.limit || 50,
        skip: params?.offset || 0,
      }),
      this.prisma.session.count({ where }),
    ]);

    return {
      sessions: sessions.map((s) => this.transformSession(s)),
      total,
      limit: params?.limit || 50,
      offset: params?.offset || 0,
    };
  }

  /**
   * Получить сессию по ID
   */
  async getById(id: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        entry: true,
        quests: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    // Проверяем, что сессия принадлежит пользователю
    if (session.userId !== userId) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return this.transformSession(session);
  }

  /**
   * Получить сессию по entry_id
   */
  async getByEntryId(entryId: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { entry_id: entryId },
      include: {
        entry: true,
        quests: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Session for entry ${entryId} not found`);
    }

    // Проверяем, что сессия принадлежит пользователю
    if (session.userId !== userId) {
      throw new NotFoundException(`Session for entry ${entryId} not found`);
    }
    // findUnique проверяется явно - это нормально для проверки существования и прав доступа

    return this.transformSession(session);
  }

  /**
   * Создать новую сессию
   */
  async create(userId: string, data: CreateSessionDto) {
    // Проверяем, что entry существует и принадлежит пользователю
    const entry = await this.prisma.entry.findUnique({
      where: { id: data.entry_id },
    });

    if (!entry) {
      throw new NotFoundException(`Entry with ID ${data.entry_id} not found`);
    }

    // Проверяем, что entry принадлежит пользователю
    if (entry.userId !== userId) {
      throw new NotFoundException(`Entry with ID ${data.entry_id} not found`);
    }

    // Проверяем, что для этого entry еще нет сессии
    const existingSession = await this.prisma.session.findUnique({
      where: { entry_id: data.entry_id },
    });

    if (existingSession) {
      throw new BadRequestException(`Session for entry ${data.entry_id} already exists`);
    }

    const session = await this.prisma.session.create({
      data: {
        user: { connect: { id: userId } },
        entry: { connect: { id: data.entry_id } },
        summary: data.summary,
        insights_json: validateInsightsJson(data.insights_json || []),
        focus_json: validateFocusJson(data.focus_json || []),
        themes: data.themes || [],
        patterns: data.patterns || [],
        tensions: data.tensions || [],
        ability_signals_json: validateAbilitySignalsJson(data.ability_signals_json || []),
        status: data.status || 'pending',
      },
      include: {
        entry: true,
        quests: true,
      },
    });

    return this.transformSession(session);
  }

  /**
   * Обновить сессию
   */
  async update(id: string, userId: string, data: UpdateSessionDto) {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    // Проверяем, что сессия принадлежит пользователю
    if (session.userId !== userId) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    const updateData: any = {};

    if (data.summary !== undefined) {
      updateData.summary = data.summary;
    }

    if (data.insights_json !== undefined) {
      updateData.insights_json = validateInsightsJson(data.insights_json);
    }

    if (data.focus_json !== undefined) {
      updateData.focus_json = validateFocusJson(data.focus_json);
    }

    if (data.themes !== undefined) {
      updateData.themes = data.themes;
    }

    if (data.patterns !== undefined) {
      updateData.patterns = data.patterns;
    }

    if (data.tensions !== undefined) {
      updateData.tensions = data.tensions;
    }

    if (data.ability_signals_json !== undefined) {
      updateData.ability_signals_json = validateAbilitySignalsJson(data.ability_signals_json);
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'succeeded' && !session.completed_at) {
        updateData.completed_at = new Date();
      }
    }

    if (data.analysis_error !== undefined) {
      updateData.analysis_error = data.analysis_error;
    }

    const updated = await this.prisma.session.update({
      where: { id },
      data: updateData,
      include: {
        entry: true,
        quests: true,
      },
    });

    return this.transformSession(updated);
  }

  /**
   * Удалить сессию
   */
  async delete(id: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    // Проверяем, что сессия принадлежит пользователю
    if (session.userId !== userId) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    await this.prisma.session.delete({
      where: { id },
    });

    return { success: true, message: `Session ${id} deleted` };
  }

  /**
   * Трансформация session для ответа
   */
  private transformSession(session: any) {
    if (!session) {
      return null;
    }

    return {
      id: session?.id,
      entry_id: session?.entry_id,
      summary: session?.summary,
      insights_json: session?.insights_json,
      focus_json: session?.focus_json,
      themes: session?.themes,
      patterns: session?.patterns,
      tensions: session?.tensions,
      ability_signals_json: session?.ability_signals_json,
      status: session?.status,
      analysis_error: session?.analysis_error,
      created_at: session?.created_at,
      updated_at: session?.updated_at,
      completed_at: session?.completed_at,
      entry: session?.entry || null,
      quests: session?.quests || [],
    };
  }
}

