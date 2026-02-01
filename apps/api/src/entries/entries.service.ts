import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntriesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Получить все записи
   * @param userId ID пользователя (обязательно)
   * @param type Фильтр по типу (situation, reflection, feedback, voice, import)
   * @param source Фильтр по источнику (file, telegram, web)
   * @param limit Лимит записей
   * @param offset Смещение для пагинации
   */
  async getAll(userId: string, params?: {
    type?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const where: any = {
        userId, // Фильтруем по пользователю
      };

      if (params?.type) {
        where.type = params.type;
      }

      if (params?.source) {
        where.source = params.source;
      }

      const [entries, total] = await Promise.all([
        this.prisma.entry.findMany({
          where,
          include: {
            session: {
              select: {
                id: true,
                status: true,
                summary: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          take: params?.limit || 50,
          skip: params?.offset || 0,
        }),
        this.prisma.entry.count({ where }),
      ]);

      return {
        entries,
        total,
        limit: params?.limit || 50,
        offset: params?.offset || 0,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Получить запись по ID
   */
  async getById(id: string, userId: string) {
    try {
      const entry = await this.prisma.entry.findUnique({
        where: { id },
        include: {
          session: true,
        },
      });

      if (!entry) {
        throw new NotFoundException(`Entry with ID ${id} not found`);
      }

      // Проверяем, что запись принадлежит пользователю
      if (entry.userId !== userId) {
        throw new NotFoundException(`Entry with ID ${id} not found`);
      }

      return entry;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Создать новую запись
   */
  async create(userId: string, data: {
    type: string;
    source: string;
    text: string;
    participants?: string[];
    context_json?: any;
    file_ref?: string;
    tags?: string[];
  }) {
    try {
      // Валидация базовых полей
      if (!data.type || !data.source || !data.text) {
        throw new BadRequestException('Missing required fields: type, source, text');
      }

      // Валидация типа
      const validTypes = ['situation', 'reflection', 'feedback', 'voice', 'import'];
      if (!validTypes.includes(data.type)) {
        throw new BadRequestException(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
      }

      // Валидация источника
      const validSources = ['file', 'telegram', 'web'];
      if (!validSources.includes(data.source)) {
        throw new BadRequestException(`Invalid source. Must be one of: ${validSources.join(', ')}`);
      }

      const entry = await this.prisma.entry.create({
        data: {
          userId, // Привязываем к пользователю
          type: data.type,
          source: data.source,
          text: data.text,
          participants: data.participants || [],
          context_json: data.context_json || {},
          file_ref: data.file_ref,
          tags: data.tags || [],
        },
      });

      return entry;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Обновить запись (только владелец)
   */
  async update(
    id: string,
    userId: string,
    data: {
      type?: string;
      source?: string;
      text?: string;
      participants?: string[];
      context_json?: any;
      file_ref?: string;
      tags?: string[];
    },
  ) {
    const entry = await this.prisma.entry.findUnique({ where: { id } });
    if (!entry || entry.userId !== userId) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    const updateData: Record<string, any> = {};

    if (data.type !== undefined) {
      const validTypes = ['situation', 'reflection', 'feedback', 'voice', 'import'];
      if (!validTypes.includes(data.type)) {
        throw new BadRequestException(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
      }
      updateData.type = data.type;
    }

    if (data.source !== undefined) {
      const validSources = ['file', 'telegram', 'web'];
      if (!validSources.includes(data.source)) {
        throw new BadRequestException(`Invalid source. Must be one of: ${validSources.join(', ')}`);
      }
      updateData.source = data.source;
    }

    if (data.text !== undefined) {
      if (!data.text.trim()) {
        throw new BadRequestException('Text cannot be empty');
      }
      updateData.text = data.text;
    }

    if (data.participants !== undefined) {
      updateData.participants = data.participants;
    }

    if (data.context_json !== undefined) {
      updateData.context_json = data.context_json;
    }

    if (data.file_ref !== undefined) {
      updateData.file_ref = data.file_ref;
    }

    if (data.tags !== undefined) {
      updateData.tags = data.tags;
    }

    return this.prisma.entry.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Удалить запись (только владелец)
   */
  async delete(id: string, userId: string) {
    const entry = await this.prisma.entry.findUnique({ where: { id } });
    if (!entry || entry.userId !== userId) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    await this.prisma.entry.delete({ where: { id } });
    return { message: 'Entry deleted' };
  }
}
