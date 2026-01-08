import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAbilitiesService {
  constructor(private prisma: PrismaService) {}

  async getUserAbilities(
    userId: string,
    filters: {
      state?: string;
      branch?: string;
      changedFrom?: Date;
      changedTo?: Date;
    },
  ) {
    const where: any = { user_id: userId };

    if (filters.state) {
      where.state = filters.state;
    }
    if (filters.branch) {
      where.node = {
        branch: filters.branch,
      };
    }
    if (filters.changedFrom || filters.changedTo) {
      where.last_updated_at = {};
      if (filters.changedFrom) {
        where.last_updated_at.gte = filters.changedFrom;
      }
      if (filters.changedTo) {
        where.last_updated_at.lte = filters.changedTo;
      }
    }

    const abilities = await this.prisma.userAbilityState.findMany({
      where,
      include: {
        node: true,
      },
      orderBy: {
        last_updated_at: 'desc',
      },
    });

    return abilities;
  }

  async getUserAbility(userId: string, nodeId: string) {
    const ability = await this.prisma.userAbilityState.findFirst({
      where: {
        user_id: userId,
        node_id: nodeId,
      },
      include: {
        node: true,
      },
    });

    if (!ability) {
      throw new NotFoundException('Ability state not found');
    }

    // Получаем последние change_log для этого узла
    const changeLogs = await this.prisma.changeLog.findMany({
      where: {
        userId,
        entity_type: 'node',
        entity_id: nodeId,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 10,
    });

    return {
      ...ability,
      changeLogs,
    };
  }
}

