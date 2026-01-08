/**
 * Утилиты для работы с деревом способностей
 * Объединенный модуль для всех операций с деревом
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

export interface TreeStats {
  locked: number;
  available: number;
  active: number;
  unlocked: number;
  integrated: number;
}

export interface NodeProgress {
  id: string;
  xp: number;
  state: 'locked' | 'available' | 'active' | 'unlocked' | 'integrated';
}

export class TreeUtils {
  constructor(private prisma: PrismaClient) {}

  /**
   * Загрузить seed данные дерева
   */
  loadSeedTree(): any {
    const seedPath = path.join(__dirname, '../packages/shared/src/seed/initial-ability-tree.json');
    return JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  }

  /**
   * Найти пользователя по telegramUsername
   */
  async findUser(telegramUsername: string = 'admin') {
    return await this.prisma.user.findUnique({
      where: { telegramUsername },
      include: { treeSemantic: true },
    });
  }

  /**
   * Получить дерево пользователя
   */
  async getTree(userId: string) {
    return await this.prisma.treeSemantic.findUnique({
      where: { userId },
    });
  }

  /**
   * Создать новое дерево для пользователя
   */
  async createTree(userId: string, seedData?: any) {
    const treeData = seedData || this.loadSeedTree();
    
    return await this.prisma.treeSemantic.create({
      data: {
        id: `tree_${userId}`,
        userId,
        semantic_version: treeData.semantic_version || '1.0.0',
        tree_revision: treeData.tree_revision || 1,
        data: treeData,
      },
    });
  }

  /**
   * Обновить дерево
   */
  async updateTree(userId: string, treeData: any, incrementRevision: boolean = true) {
    const currentTree = await this.getTree(userId);
    
    return await this.prisma.treeSemantic.update({
      where: { userId },
      data: {
        semantic_version: treeData.semantic_version || currentTree?.semantic_version || '1.0.0',
        tree_revision: incrementRevision 
          ? ((currentTree?.tree_revision || 0) + 1)
          : (currentTree?.tree_revision || 1),
        data: treeData,
      },
    });
  }

  /**
   * Активировать узлы в дереве
   */
  activateNodes(
    treeData: any,
    basicNodes: string[],
    nodesWithProgress: Record<string, { xp: number }>,
  ): { unlocked: number; activated: number } {
    let unlocked = 0;
    let activated = 0;

    if (!treeData.nodes || !Array.isArray(treeData.nodes)) {
      return { unlocked, activated };
    }

    for (const node of treeData.nodes) {
      if (basicNodes.includes(node.node_id)) {
        node.state = 'unlocked';
        node.xp_current = 100;
        node.integration_level = 'Novice';
        unlocked++;
      } else {
        const progressNode = nodesWithProgress[node.node_id];
        if (progressNode) {
          const requiredXp = node.xp_required || 100;
          const progressPercent = (progressNode.xp / requiredXp) * 100;
          if (progressPercent >= 50) {
            node.state = 'unlocked';
            unlocked++;
          } else {
            node.state = 'active';
            activated++;
          }
          node.xp_current = progressNode.xp;
        }
      }
    }

    return { unlocked, activated };
  }

  /**
   * Получить статистику узлов
   */
  getTreeStats(treeData: any): TreeStats {
    const stats: TreeStats = {
      locked: 0,
      available: 0,
      active: 0,
      unlocked: 0,
      integrated: 0,
    };

    if (!treeData.nodes || !Array.isArray(treeData.nodes)) {
      return stats;
    }

    for (const node of treeData.nodes) {
      const state = node.state || 'locked';
      if (state in stats) {
        stats[state as keyof TreeStats]++;
      }
    }

    return stats;
  }

  /**
   * Проверить структуру дерева
   */
  validateTree(treeData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!treeData) {
      errors.push('Tree data is null or undefined');
      return { valid: false, errors };
    }

    if (!treeData.nodes || !Array.isArray(treeData.nodes)) {
      errors.push('Tree data missing nodes array');
    }

    if (!treeData.branches || !Array.isArray(treeData.branches)) {
      errors.push('Tree data missing branches array');
    }

    if (!treeData.edges || !Array.isArray(treeData.edges)) {
      errors.push('Tree data missing edges array');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Получить информацию о дереве
   */
  getTreeInfo(treeData: any) {
    return {
      nodes: treeData?.nodes?.length || 0,
      branches: treeData?.branches?.length || 0,
      edges: treeData?.edges?.length || 0,
      version: treeData?.semantic_version || 'N/A',
      revision: treeData?.tree_revision || 'N/A',
    };
  }
}

