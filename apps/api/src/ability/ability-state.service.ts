import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AbilityEngine } from './ability-engine.service';
import {
  AbilityStateSnapshot,
  AbilityNodeInfo,
  AbilityStateChange,
} from './ability-engine.types';
import type { AbilitySignal as SessionAbilitySignal } from '../common/schemas/session.schema';
import type { AbilitySignal } from './ability-engine.types';

/**
 * Сервис для работы с состоянием способностей пользователя
 * Интегрирует AbilityEngine с БД
 */
@Injectable()
export class AbilityStateService {
  private readonly logger = new Logger(AbilityStateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityEngine: AbilityEngine,
  ) {}

  /**
   * Применить изменения состояния на основе сигналов
   */
  async applySignals(
    userId: string,
    signals: SessionAbilitySignal[],
  ): Promise<{
    changes: AbilityStateChange[];
    changeLogId?: string;
  }> {
    this.logger.log(`Applying ${signals.length} signals for user ${userId}`);

    // Загружаем текущие состояния
    const currentStates = await this.loadCurrentStates(userId);

    // Загружаем информацию об узлах
    const nodeInfos = await this.loadNodeInfos(signals.map((s) => s.node_id));

    // Преобразуем SessionAbilitySignal в AbilitySignal
    const engineSignals: AbilitySignal[] = signals.map((s) => ({
      node_id: s.node_id,
      signal: s.signal,
    }));

    // Вычисляем изменения через AbilityEngine
    const result = this.abilityEngine.computeNext({
      userId,
      signals: engineSignals,
      currentStates,
      nodeInfos,
    });

    // Применяем изменения к БД
    if (result.changes.length > 0) {
      const changeLogId = await this.applyChangesToDatabase(userId, result.changes);
      return { changes: result.changes, changeLogId };
    }

    return { changes: [] };
  }

  /**
   * Загрузить текущие состояния узлов пользователя
   */
  private async loadCurrentStates(
    userId: string,
  ): Promise<Map<string, AbilityStateSnapshot>> {
    const states = await this.prisma.userAbilityState.findMany({
      where: { user_id: userId },
      select: {
        node_id: true,
        state: true,
        progress: true,
        relevance: true,
      },
    });

    const map = new Map<string, AbilityStateSnapshot>();
    for (const state of states) {
      map.set(state.node_id, {
        nodeId: state.node_id,
        state: state.state as any,
        progress: Number(state.progress),
        relevance: Number(state.relevance),
      });
    }

    return map;
  }

  /**
   * Загрузить информацию об узлах
   */
  private async loadNodeInfos(nodeIds: string[]): Promise<Map<string, AbilityNodeInfo>> {
    if (nodeIds.length === 0) {
      return new Map();
    }

    const nodes = await this.prisma.abilityNode.findMany({
      where: { id: { in: nodeIds } },
      select: {
        id: true,
        branch: true,
        title: true,
        description: true,
        level: true,
        conditions: true,
      },
    });

    const map = new Map<string, AbilityNodeInfo>();
    for (const node of nodes) {
      map.set(node.id, {
        id: node.id,
        branch: node.branch,
        title: node.title,
        description: node.description,
        level: node.level as any,
        conditions: node.conditions as unknown,
      });
    }

    return map;
  }

  /**
   * Применить изменения к БД
   */
  private async applyChangesToDatabase(
    userId: string,
    changes: AbilityStateChange[],
  ): Promise<string> {
    // Создаем ChangeLog для аудита
    const changeLog = await this.prisma.changeLog.create({
      data: {
        userId: userId,
        change_id: `ability_state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scope: 'ability',
        entity_type: 'node',
        action: 'update',
        actor: 'analyzer',
        rationale: `Updated ${changes.length} ability states based on signals`,
        before: {
          changes: changes.map((c) => ({
            nodeId: c.nodeId,
            state: c.before.state,
            progress: c.before.progress,
            relevance: c.before.relevance,
          })),
        } as any,
        after: {
          changes: changes.map((c) => ({
            nodeId: c.nodeId,
            state: c.after.state,
            progress: c.after.progress,
            relevance: c.after.relevance,
            reason: c.reason,
          })),
        } as any,
        links_json: [],
      },
    });

    // Применяем изменения через upsert
    // ВАЖНО: state синхронизируется из TreeSemantic (источник истины)
    // Здесь обновляем только progress и relevance для аналитики
    // State обновляется только для аналитических значений (active/available),
    // критичные состояния (locked/unlocked/integrated) синхронизируются из TreeSemantic
    for (const change of changes) {
      // Проверяем текущее состояние в UserAbilityState
      const existing = await this.prisma.userAbilityState.findUnique({
        where: {
          user_id_node_id: {
            user_id: userId,
            node_id: change.nodeId,
          },
        },
      });

      // Определяем, можно ли обновить state (только аналитические состояния)
      const canUpdateState = 
        change.after.state === 'active' || 
        change.after.state === 'available';

      if (existing) {
        // Обновляем progress и relevance всегда
        // State обновляем только для аналитических состояний
        await this.prisma.userAbilityState.update({
          where: {
            user_id_node_id: {
              user_id: userId,
              node_id: change.nodeId,
            },
          },
          data: {
            // Обновляем state только если это аналитическое состояние
            // locked/unlocked/integrated синхронизируются из TreeSemantic
            state: canUpdateState ? change.after.state : existing.state,
            progress: change.after.progress,
            relevance: change.after.relevance,
            last_updated_at: new Date(),
          },
        });
      } else {
        // Создаем новую запись
        // Для новых записей используем state из change, но он будет синхронизирован при следующем обновлении TreeSemantic
        await this.prisma.userAbilityState.create({
          data: {
            user_id: userId,
            node_id: change.nodeId,
            state: change.after.state,
            progress: change.after.progress,
            relevance: change.after.relevance,
            last_updated_at: new Date(),
          },
        });
      }
    }

    this.logger.log(
      `Applied ${changes.length} state changes for user ${userId}, changeLogId: ${changeLog.id}`,
    );

    return changeLog.id;
  }

  /**
   * Применить опыт от выполнения квеста/кейса к узлу способностей
   * @param userId - ID пользователя
   * @param nodeId - ID узла способностей
   * @param baseXp - базовый опыт
   * @param reflectionXp - опыт за рефлексию
   * @param difficulty - сложность квеста/кейса
   */
  async applyQuestExperience(
    userId: string,
    nodeId: string,
    baseXp: number,
    reflectionXp: number,
    difficulty: 'basic' | 'intermediate' | 'advanced',
  ): Promise<void> {
    const totalXp = baseXp + reflectionXp;
    
    // Рассчитываем прирост прогресса на основе XP и сложности
    // Базовый множитель: 1 XP = 0.001 progress (0.1%)
    // Модификатор сложности: basic=1, intermediate=1.2, advanced=1.5
    const difficultyMultiplier = 
      difficulty === 'basic' ? 1 : 
      difficulty === 'intermediate' ? 1.2 : 1.5;
    
    const progressIncrement = (totalXp * 0.001 * difficultyMultiplier);

    this.logger.log(
      `Applying ${totalXp} XP (${baseXp} base + ${reflectionXp} reflection) to node ${nodeId} for user ${userId}`,
    );

    // Получаем или создаем запись состояния
    const existing = await this.prisma.userAbilityState.findUnique({
      where: {
        user_id_node_id: {
          user_id: userId,
          node_id: nodeId,
        },
      },
    });

    if (existing) {
      // Обновляем прогресс
      const newProgress = Math.min(Number(existing.progress) + progressIncrement, 1);
      const newRelevance = Math.min(Number(existing.relevance) + 0.1, 1);
      
      await this.prisma.userAbilityState.update({
        where: {
          user_id_node_id: {
            user_id: userId,
            node_id: nodeId,
          },
        },
        data: {
          progress: newProgress,
          relevance: newRelevance,
          last_updated_at: new Date(),
        },
      });
      
      this.logger.log(
        `Updated node ${nodeId} progress: ${Number(existing.progress).toFixed(3)} -> ${newProgress.toFixed(3)}`,
      );
    } else {
      // Создаем новую запись
      await this.prisma.userAbilityState.create({
        data: {
          user_id: userId,
          node_id: nodeId,
          state: 'available',
          progress: progressIncrement,
          relevance: 0.1,
          last_updated_at: new Date(),
        },
      });
      
      this.logger.log(`Created new ability state for node ${nodeId} with progress ${progressIncrement.toFixed(3)}`);
    }
  }
}

