import { Injectable, NotFoundException, BadRequestException, Inject, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EvidenceService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    if (!this.prisma) {
      throw new InternalServerErrorException('PrismaService injection failed');
    }
  }

  /**
   * Получить все evidence пользователя
   */
  async getAll(userId: string, params?: {
    type?: string;
    quest_id?: string;
    ability_node_id?: string;
    session_id?: string;
    limit?: number;
    offset?: number;
  }) {
    if (!this.prisma?.evidence) {
      throw new InternalServerErrorException('Prisma evidence model is not available');
    }

    const where: {
      userId: string;
      type?: string;
      quest_id?: string;
      ability_node_id?: string;
      session_id?: string;
    } = { userId };

    if (params?.type) {
      where.type = params.type;
    }

    if (params?.quest_id) {
      where.quest_id = params.quest_id;
    }

    if (params?.ability_node_id) {
      where.ability_node_id = params.ability_node_id;
    }

    if (params?.session_id) {
      where.session_id = params.session_id;
    }

    const [evidences, total] = await Promise.all([
      this.prisma.evidence.findMany({
        where,
        orderBy: {
          created_at: 'desc',
        },
        take: params?.limit || 50,
        skip: params?.offset || 0,
      }),
      this.prisma.evidence.count({ where }),
    ]);

    return {
      evidences: evidences.map((e) => this.transformEvidence(e)),
      total,
      limit: params?.limit || 50,
      offset: params?.offset || 0,
    };
  }

  /**
   * Получить evidence по ID
   */
  async getById(id: string, userId: string) {
    if (!this.prisma?.evidence) {
      throw new InternalServerErrorException('Prisma evidence model is not available');
    }

    const evidence = await this.prisma.evidence.findUnique({
      where: { id },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence with ID ${id} not found`);
    }

    // Проверяем, что evidence принадлежит пользователю
    if (evidence.userId !== userId) {
      throw new ForbiddenException('Access denied to this evidence');
    }

    return this.transformEvidence(evidence);
  }

  /**
   * Создать новое evidence
   */
  async create(userId: string, data: {
    type: 'situation' | 'observation' | 'reflection' | 'feedback' | 'external_feedback';
    text: string;
    quest_id?: string;
    ability_node_id?: string;
    session_id?: string;
    tags?: string[];
  }) {
    if (!this.prisma?.evidence) {
      throw new InternalServerErrorException('Prisma evidence model is not available');
    }

    if (!data.text || data.text.trim().length === 0) {
      throw new BadRequestException('Text is required');
    }

    if (data.text.length > 10000) {
      throw new BadRequestException('Text too long. Maximum length is 10000 characters');
    }

    // Валидация типа
    const validTypes = ['situation', 'observation', 'reflection', 'feedback', 'external_feedback'];
    if (!validTypes.includes(data.type)) {
      throw new BadRequestException(
        `Invalid type. Must be one of: ${validTypes.join(', ')}`
      );
    }

    // Проверяем связи, если указаны
    if (data.quest_id && this.prisma?.quest) {
      const quest = await this.prisma.quest.findUnique({
        where: { id: data.quest_id },
      });
      if (!quest) {
        throw new NotFoundException(`Quest with ID ${data.quest_id} not found`);
      }
      // Проверяем, что quest принадлежит пользователю
      if (quest.userId !== userId) {
        throw new ForbiddenException('Quest does not belong to user');
      }
    }

    if (data.session_id && this.prisma?.session) {
      const session = await this.prisma.session.findUnique({
        where: { id: data.session_id },
      });
      if (!session) {
        throw new NotFoundException(`Session with ID ${data.session_id} not found`);
      }
      // Проверяем, что session принадлежит пользователю
      if (session.userId !== userId) {
        throw new ForbiddenException('Session does not belong to user');
      }
    }

    // Маппим external_feedback на feedback для Prisma (если schema не поддерживает external_feedback)
    const prismaType = data.type === 'external_feedback' ? 'feedback' : data.type;

    const evidence = await this.prisma.evidence.create({
      data: {
        type: prismaType,
        text: data.text,
        user: { connect: { id: userId } },
        quest_id: data.quest_id || null,
        ability_node_id: data.ability_node_id || null,
        session_id: data.session_id || null,
        tags: data.tags || [],
      },
    });

    return this.transformEvidence(evidence);
  }

  /**
   * Обновить evidence
   */
  async update(id: string, userId: string, data: {
    text?: string;
    tags?: string[];
  }) {
    if (!this.prisma?.evidence) {
      throw new InternalServerErrorException('Prisma evidence model is not available');
    }

    const evidence = await this.prisma.evidence.findUnique({
      where: { id },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence with ID ${id} not found`);
    }

    // Проверяем, что evidence принадлежит пользователю
    if (evidence.userId !== userId) {
      throw new ForbiddenException('Access denied to this evidence');
    }

    const updateData: { text?: string; tags?: string[] } = {};

    if (data.text !== undefined) {
      if (data.text.trim().length === 0) {
        throw new BadRequestException('Text cannot be empty');
      }
      if (data.text.length > 10000) {
        throw new BadRequestException('Text too long. Maximum length is 10000 characters');
      }
      updateData.text = data.text;
    }

    if (data.tags !== undefined) {
      updateData.tags = data.tags;
    }

    const updated = await this.prisma.evidence.update({
      where: { id },
      data: updateData,
    });

    return this.transformEvidence(updated);
  }

  /**
   * Удалить evidence
   */
  async delete(id: string, userId: string) {
    if (!this.prisma?.evidence) {
      throw new InternalServerErrorException('Prisma evidence model is not available');
    }

    const evidence = await this.prisma.evidence.findUnique({
      where: { id },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence with ID ${id} not found`);
    }

    // Проверяем, что evidence принадлежит пользователю
    if (evidence.userId !== userId) {
      throw new ForbiddenException('Access denied to this evidence');
    }

    await this.prisma.evidence.delete({
      where: { id },
    });

    return { success: true, message: `Evidence ${id} deleted` };
  }

  /**
   * Трансформация evidence для ответа
   */
  private transformEvidence(evidence: {
    id: string;
    type: string;
    text: string;
    quest_id: string | null;
    ability_node_id: string | null;
    session_id: string | null;
    tags: string[];
    created_at: Date;
    updated_at: Date;
  } | null) {
    if (!evidence) {
      return null;
    }

    return {
      id: evidence.id,
      type: evidence.type,
      text: evidence.text,
      quest_id: evidence.quest_id,
      ability_node_id: evidence.ability_node_id,
      session_id: evidence.session_id,
      tags: evidence.tags,
      created_at: evidence.created_at,
      updated_at: evidence.updated_at,
    };
  }
}
