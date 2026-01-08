import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Inject,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PathConfigService } from '../config/path-config.service';
import { readFile, access } from 'fs/promises';
import * as crypto from 'crypto';

/**
 * Типы для дерева способностей
 */
export interface AbilityNode {
  node_id: string;
  name: string;
  description: string;
  branch_id: string;
  tier: 'basic' | 'intermediate' | 'advanced';
  state: 'locked' | 'available' | 'active' | 'unlocked' | 'integrated';
  unlock_conditions: any;
  integration_level: 'Novice' | 'Integrated' | 'Embodied';
  xp_required: number;
  xp_current: number;
}

export interface AbilityEdge {
  edge_id: string;
  from_node: string;
  to_node: string;
  type: string;
}

export interface AbilityBranch {
  branch_id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface SemanticTree {
  tree_id: string;
  semantic_version: string;
  tree_revision: number;
  branches: AbilityBranch[];
  nodes: AbilityNode[];
  edges: AbilityEdge[];
}

export type ChangeOp =
  | { op: 'node.create'; node: AbilityNode }
  | { op: 'node.update'; node_id: string; patch: Partial<AbilityNode> }
  | { op: 'node.delete'; node_id: string }
  | { op: 'edge.create'; edge: AbilityEdge }
  | { op: 'edge.delete'; edge_id: string }
  | { op: 'branch.create'; branch: AbilityBranch }
  | { op: 'branch.update'; branch_id: string; patch: Partial<AbilityBranch> }
  | { op: 'branch.delete'; branch_id: string };

@Injectable()
export class TreeService {
  private readonly logger = new Logger(TreeService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PathConfigService) private readonly pathConfig: PathConfigService,
  ) {
    // Валидация инжекции зависимостей
    if (!this.prisma) {
      this.logger.error('PrismaService is not injected!');
      throw new InternalServerErrorException('PrismaService injection failed');
    }
    if (!this.pathConfig) {
      this.logger.error('PathConfigService is not injected!');
      throw new InternalServerErrorException('PathConfigService injection failed');
    }
  }

  /**
   * Получает путь к seed файлу
   */
  private getSeedPath(): string {
    return this.pathConfig.getSeedPath();
  }

  /**
   * Получить семантическое дерево
   * @param userId - ID пользователя (опционально, если не указан - возвращает глобальное дерево)
   */
  async getSemantic(userId?: string): Promise<SemanticTree> {
    // Проверка инжекции PrismaService
    if (!this.prisma) {
      this.logger.error('PrismaService is not injected in TreeService');
      throw new InternalServerErrorException('PrismaService is not injected');
    }

    // Проверка доступности модели (может быть недоступна если Prisma Client не сгенерирован)
    if (!this.prisma.treeSemantic) {
      this.logger.error('Prisma treeSemantic model is not available. Run: pnpm prisma generate');
      throw new InternalServerErrorException(
        'Prisma treeSemantic model is not available. Please run: pnpm prisma generate',
      );
    }

    try {
      let treeRecord;
      
      // Если указан userId, ищем дерево пользователя
      if (userId) {
        treeRecord = await this.prisma.treeSemantic.findUnique({
          where: { userId },
        });
        this.logger.log(`Looking for user tree: userId=${userId}, found=${!!treeRecord}`);
      }
      
      // Если не нашли дерево пользователя, пробуем глобальное
      if (!treeRecord) {
        treeRecord = await this.prisma.treeSemantic.findUnique({
          where: { id: 'tree_main' },
        });
        this.logger.log(`Looking for global tree: found=${!!treeRecord}`);
      }

      if (treeRecord && treeRecord.data) {
        const data = treeRecord.data as unknown as SemanticTree;
        // Валидация структуры данных
        if (!data || typeof data !== 'object') {
          throw new InternalServerErrorException('Semantic tree data is corrupted');
        }
        this.logger.log(`✅ Found tree: userId=${treeRecord.userId || 'global'}, nodes=${data.nodes?.length || 0}`);
        return data;
      }

      // Если не нашли дерево пользователя и userId указан, создаем из seed
      if (userId) {
        this.logger.log(`Tree not found for userId=${userId}, creating from seed...`);
        const seedPath = this.getSeedPath();
        try {
          await access(seedPath);
          const content = await readFile(seedPath, 'utf-8');
          const seedData = JSON.parse(content) as SemanticTree;
          
          await this.prisma.treeSemantic.create({
            data: {
              id: `tree_user_${userId}`,
              userId,
              semantic_version: seedData.semantic_version || '1.0.0',
              tree_revision: seedData.tree_revision || 1,
              data: seedData as any,
            },
          });
          
          this.logger.log(`✅ Created user tree: nodes=${seedData.nodes?.length || 0}`);
          return seedData;
        } catch (seedError: any) {
          this.logger.error(`Failed to create user tree: ${seedError.message}`);
          // Продолжаем с глобальным деревом
        }
      }

      // Если нет в БД или revision меньше, загружаем из seed файла
      const seedPath = this.getSeedPath();
      
      try {
        await access(seedPath);
      } catch (accessError) {
        throw new NotFoundException(
          `Seed file not found at ${seedPath}. Please ensure seed file exists.`,
        );
      }

      const content = await readFile(seedPath, 'utf-8');
      let seedData: SemanticTree;
      
      try {
        seedData = JSON.parse(content) as SemanticTree;
      } catch (parseError) {
        throw new InternalServerErrorException(
          `Failed to parse seed file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        );
      }

      // Валидация seed данных
      if (!seedData || typeof seedData !== 'object') {
        throw new InternalServerErrorException('Seed file contains invalid data');
      }

      const seedRevision = seedData.tree_revision || 1;
      const dbRevision = treeRecord?.tree_revision || 0;

      // Если seed файл новее, обновляем БД
      if (seedRevision > dbRevision) {
        this.logger.log(`Updating tree from revision ${dbRevision} to ${seedRevision}`);
        try {
          await this.prisma.treeSemantic.upsert({
            where: { id: 'tree_main' },
            update: {
              tree_revision: seedRevision,
              data: seedData as any,
              userId: null, // Global tree, no user
            },
            create: {
              id: 'tree_main',
              tree_revision: seedRevision,
              data: seedData as any,
              userId: null, // Global tree, no user
            },
          });
          this.logger.log(`Tree updated successfully. Nodes: ${seedData.nodes?.length || 0}`);
        } catch (updateError: any) {
          this.logger.error(`Failed to update tree: ${updateError.message}`);
          throw new InternalServerErrorException(`Failed to update tree: ${updateError.message}`);
        }
        return seedData;
      }

      // Если seed файл не новее, но данных нет в БД, создаем
      if (!treeRecord) {
        try {
          await this.prisma.treeSemantic.create({
            data: {
              id: 'tree_main',
              tree_revision: seedRevision,
              data: seedData as any,
              userId: null, // Global tree, no user
            },
          });
          this.logger.log(`Tree created in DB. Nodes: ${seedData.nodes?.length || 0}`);
        } catch (createError: any) {
          // Если запись уже существует (race condition), просто продолжаем
          if (createError?.code !== 'P2002') {
            throw createError;
          }
        }
        return seedData;
      }

      // Если данные в БД актуальны, возвращаем их
      return treeRecord.data as unknown as SemanticTree;
    } catch (error: any) {
      // Преобразуем известные ошибки
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      
      // Логируем неизвестные ошибки
      console.error('Unexpected error in getSemantic:', error);
      
      throw new InternalServerErrorException(
        `Failed to load semantic tree: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Получить layout дерева
   */
  async getLayout(fromRevision?: number) {
    try {
      const treeRecord = await this.prisma.treeSemantic.findUnique({
        where: { id: 'tree_main' },
      });

      if (!treeRecord) {
        return {
          tree_id: 'tree_main',
          layout_version: '1.0.0',
          layout_revision: 0,
          computed_from_tree_revision: 0,
          nodes: [],
          edges: [],
          groups: [],
        };
      }

      const targetRevision = fromRevision || treeRecord.tree_revision;

      const layoutRecord = await this.prisma.treeLayout.findFirst({
        where: {
          tree_id: 'tree_main',
          computed_from_tree_revision: targetRevision,
        },
        orderBy: {
          layout_revision: 'desc',
        },
      });

      if (!layoutRecord) {
        return {
          tree_id: 'tree_main',
          layout_version: '1.0.0',
          layout_revision: 0,
          computed_from_tree_revision: targetRevision,
          nodes: [],
          edges: [],
          groups: [],
        };
      }

      return layoutRecord.data;
    } catch (error: any) {
      throw new Error(`Failed to get layout: ${error.message}`);
    }
  }

  /**
   * Генерирует уникальный ID для изменения
   */
  private generateChangeId(): string {
    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
    const random = crypto.randomBytes(4).toString('hex');
    return `chg_${dateStr}_${random}`;
  }

  /**
   * Применяет операцию изменения к дереву
   */
  private applyOperationToTree(tree: SemanticTree, op: ChangeOp): void {
    switch (op.op) {
      case 'node.create':
        if (!tree.nodes) tree.nodes = [];
        tree.nodes.push(op.node);
        break;

      case 'node.update':
        const nodeIndex = tree.nodes?.findIndex((n) => n.node_id === op.node_id);
        if (nodeIndex !== undefined && nodeIndex >= 0) {
          tree.nodes[nodeIndex] = { ...tree.nodes[nodeIndex], ...op.patch };
        }
        break;

      case 'node.delete':
        if (tree.nodes) {
          tree.nodes = tree.nodes.filter((n) => n.node_id !== op.node_id);
        }
        break;

      case 'edge.create':
        if (!tree.edges) tree.edges = [];
        tree.edges.push(op.edge);
        break;

      case 'edge.delete':
        if (tree.edges) {
          tree.edges = tree.edges.filter((e) => e.edge_id !== op.edge_id);
        }
        break;

      case 'branch.create':
        if (!tree.branches) tree.branches = [];
        tree.branches.push(op.branch);
        break;

      case 'branch.update':
        const branchIndex = tree.branches?.findIndex((b) => b.branch_id === op.branch_id);
        if (branchIndex !== undefined && branchIndex >= 0) {
          tree.branches[branchIndex] = { ...tree.branches[branchIndex], ...op.patch };
        }
        break;

      case 'branch.delete':
        if (tree.branches) {
          tree.branches = tree.branches.filter((b) => b.branch_id !== op.branch_id);
        }
        break;
    }
  }

  /**
   * Генерирует обратные операции для undo
   */
  private generateInverseOps(ops: ChangeOp[]): ChangeOp[] {
    const inverseOps: ChangeOp[] = [];

    for (let i = ops.length - 1; i >= 0; i--) {
      const op = ops[i];
      switch (op.op) {
        case 'node.create':
          inverseOps.push({ op: 'node.delete', node_id: op.node.node_id });
          break;
        case 'node.delete':
          // Нужно сохранить узел перед удалением для восстановления
          // Это упрощенная версия - в реальности нужно сохранять состояние
          break;
        case 'node.update':
          // Нужно сохранить старое состояние для восстановления
          break;
        case 'edge.create':
          inverseOps.push({ op: 'edge.delete', edge_id: op.edge.edge_id });
          break;
        case 'edge.delete':
          // Аналогично node.delete
          break;
        case 'branch.create':
          inverseOps.push({ op: 'branch.delete', branch_id: op.branch.branch_id });
          break;
        case 'branch.delete':
          // Аналогично
          break;
        case 'branch.update':
          // Аналогично node.update
          break;
      }
    }

    return inverseOps;
  }

  /**
   * Применить изменение к дереву
   */
  async applyChange(request: {
    ops: ChangeOp[];
    rationale: string;
    actor: string;
    links?: any[];
    userId?: string;
  }): Promise<{ change_id: string; tree_revision: number }> {
    // Получаем текущее дерево (пользовательское или глобальное)
    const userId = request.userId;
    const tree = await this.getSemantic(userId);

    // Применяем операции
    for (const op of request.ops) {
      this.applyOperationToTree(tree, op);
    }

    // Увеличиваем ревизию
    tree.tree_revision = (tree.tree_revision || 1) + 1;

    // Генерируем change_id
    const changeId = this.generateChangeId();

    // Генерируем обратные операции
    const inverseOps = this.generateInverseOps(request.ops);

    // Определяем ID дерева (пользовательское или глобальное)
    const treeId = userId ? `tree_user_${userId}` : 'tree_main';

    // Сохраняем в БД
    await this.prisma.$transaction(async (tx) => {
      // Обновляем дерево (пользовательское или глобальное)
      await tx.treeSemantic.upsert({
        where: { id: treeId },
        update: {
          tree_revision: tree.tree_revision,
          data: tree as any,
          userId: userId || null,
        },
        create: {
          id: treeId,
          tree_revision: tree.tree_revision,
          data: tree as any,
          userId: userId || null,
        },
      });

      // Определяем userId для ChangeLog
      // Приоритет: request.userId > actor (если это UUID) > системный пользователь
      let changeLogUserId: string;
      if (userId) {
        // Используем userId из запроса, если он есть
        changeLogUserId = userId;
      } else if (request.actor && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request.actor)) {
        // actor выглядит как UUID - возможно это userId
        const user = await tx.user.findUnique({ where: { id: request.actor } });
        if (user) {
          changeLogUserId = request.actor;
        } else {
          // Если не найден, используем системного пользователя
          const systemUser = await tx.user.findFirst({ where: { role: 'admin' } });
          changeLogUserId = systemUser?.id || (await tx.user.findFirst())?.id || '';
        }
      } else {
        // actor - строка (system, analyzer, admin), используем системного пользователя
        const systemUser = await tx.user.findFirst({ where: { role: 'admin' } });
        changeLogUserId = systemUser?.id || (await tx.user.findFirst())?.id || '';
      }

      if (!changeLogUserId) {
        throw new InternalServerErrorException('No user found for ChangeLog. Please create at least one user.');
      }

      // Определяем scope и action на основе операций
      const scope = 'system'; // ability, quest, settings, system
      const firstOp = request.ops[0];
      let action = 'apply_change'; // create, update, unlock, integrate, regenerate, undo
      
      if (firstOp?.op === 'node.create' || firstOp?.op === 'edge.create' || firstOp?.op === 'branch.create') {
        action = 'create';
      } else if (firstOp?.op === 'node.update' || firstOp?.op === 'branch.update') {
        action = 'update';
      } else if (firstOp?.op === 'node.delete' || firstOp?.op === 'edge.delete' || firstOp?.op === 'branch.delete') {
        action = 'update'; // delete это тоже update
      }

      // Создаем запись в ChangeLog
      await tx.changeLog.create({
        data: {
          change_id: changeId,
          tree_revision: tree.tree_revision,
          scope,
          action,
          actor: request.actor,
          rationale: request.rationale,
          links_json: request.links || [],
          ops_json: request.ops as any,
          inverse_ops_json: inverseOps as any,
          user: { connect: { id: changeLogUserId } },
        },
      });
    });

    // Синхронизируем изменения state с UserAbilityState (если userId указан)
    if (userId) {
      await this.syncStateChangesToUserAbilityState(userId, request.ops, tree);
    }

    return {
      change_id: changeId,
      tree_revision: tree.tree_revision,
    };
  }

  /**
   * Синхронизировать изменения state из операций с UserAbilityState
   */
  private async syncStateChangesToUserAbilityState(
    userId: string,
    ops: ChangeOp[],
    tree: SemanticTree,
  ): Promise<void> {
    for (const op of ops) {
      if (op.op === 'node.update' && op.patch?.state !== undefined) {
        const nodeId = op.node_id;
        const newState = op.patch.state as AbilityNode['state'];
        await this.syncStateToUserAbilityState(userId, nodeId, newState);
      } else if (op.op === 'node.update' && op.patch) {
        // Если обновляется узел, но state не указан явно, проверяем текущее состояние в дереве
        const nodeId = op.node_id;
        const node = tree.nodes.find((n) => n.node_id === nodeId);
        if (node) {
          await this.syncStateToUserAbilityState(userId, nodeId, node.state);
        }
      }
    }
  }

  /**
   * Откатить изменение
   * Определяет, какое дерево откатывать (глобальное или пользовательское) на основе changeLog
   */
  async undoChange(changeId: string): Promise<{ tree_revision: number }> {
    const changeLog = await this.prisma.changeLog.findUnique({
      where: { change_id: changeId },
      include: { user: true },
    });

    if (!changeLog) {
      throw new NotFoundException(`Change ${changeId} not found`);
    }

    if (!changeLog.inverse_ops_json) {
      throw new BadRequestException(`Change ${changeId} has no inverse operations`);
    }

    // Определяем userId из changeLog (может быть null для глобальных изменений)
    const userId = changeLog.user?.id || undefined;
    const tree = await this.getSemantic(userId);
    const inverseOps = changeLog.inverse_ops_json as ChangeOp[];

    // Применяем обратные операции
    for (const op of inverseOps) {
      this.applyOperationToTree(tree, op);
    }

    tree.tree_revision = (tree.tree_revision || 1) + 1;

    // Определяем ID дерева (пользовательское или глобальное)
    const treeId = userId ? `tree_user_${userId}` : 'tree_main';

    await this.prisma.treeSemantic.update({
      where: { id: treeId },
      data: {
        tree_revision: tree.tree_revision,
        data: tree as any,
        userId: userId || null,
      },
    });

    return {
      tree_revision: tree.tree_revision,
    };
  }

  /**
   * Обновить прогресс узла
   * @param nodeId ID узла
   * @param xpDelta Изменение XP
   * @param userId ID пользователя (опционально, если не указан - работает с глобальным деревом)
   */
  async updateNodeProgress(nodeId: string, xpDelta: number, userId?: string): Promise<AbilityNode> {
    const tree = await this.getSemantic(userId);
    const node = tree.nodes.find((n) => n.node_id === nodeId);

    if (!node) {
      throw new NotFoundException(`Node ${nodeId} not found`);
    }

    const newXp = Math.max(0, node.xp_current + xpDelta);
    const wasUnlocked = node.state === 'unlocked' || node.state === 'integrated';
    const isNowUnlocked = newXp >= node.xp_required;

    // Обновляем узел
    await this.applyChange({
      ops: [
        {
          op: 'node.update',
          node_id: nodeId,
          patch: {
            xp_current: newXp,
            state: isNowUnlocked ? 'unlocked' : node.state,
          },
        },
      ],
      rationale: `Updated XP for node ${nodeId}: +${xpDelta}`,
      actor: userId || 'system',
      userId,
    });

    // Получаем обновленное дерево
    const updatedTree = await this.getSemantic(userId);
    const updatedNode = updatedTree.nodes.find((n) => n.node_id === nodeId)!;

    // Синхронизируем state с UserAbilityState (если userId указан и state изменился)
    if (userId && (node.state !== updatedNode.state || isNowUnlocked)) {
      await this.syncStateToUserAbilityState(userId, nodeId, updatedNode.state);
    }

    return updatedNode;
  }

  /**
   * Синхронизировать state узла с UserAbilityState
   * TreeSemantic является источником истины для state
   */
  private async syncStateToUserAbilityState(
    userId: string,
    nodeId: string,
    state: AbilityNode['state'],
  ): Promise<void> {
    try {
      // Проверяем, существует ли запись в UserAbilityState
      const existing = await this.prisma.userAbilityState.findUnique({
        where: {
          user_id_node_id: {
            user_id: userId,
            node_id: nodeId,
          },
        },
      });

      if (existing) {
        // Обновляем только state, сохраняем progress и relevance
        await this.prisma.userAbilityState.update({
          where: {
            user_id_node_id: {
              user_id: userId,
              node_id: nodeId,
            },
          },
          data: {
            state,
            last_updated_at: new Date(),
          },
        });
        this.logger.debug(`Synced state for node ${nodeId} to UserAbilityState: ${state}`);
      } else {
        // Если записи нет, создаем с дефолтными значениями
        await this.prisma.userAbilityState.create({
          data: {
            user_id: userId,
            node_id: nodeId,
            state,
            progress: 0,
            relevance: 0,
            last_updated_at: new Date(),
          },
        });
        this.logger.debug(`Created UserAbilityState entry for node ${nodeId} with state: ${state}`);
      }
    } catch (error: any) {
      // Логируем ошибку, но не прерываем выполнение
      this.logger.warn(`Failed to sync state to UserAbilityState for node ${nodeId}: ${error.message}`);
    }
  }
}

