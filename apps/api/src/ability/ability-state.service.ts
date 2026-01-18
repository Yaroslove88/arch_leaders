import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AbilityEngine } from './ability-engine.service';
import { AchievementsService } from '../achievements/achievements.service';
import { TreeService } from '../tree/tree.service';
import {
  AbilityState,
  AbilityStateSnapshot,
  AbilityNodeInfo,
  AbilityStateChange,
} from './ability-engine.types';
import type { AbilitySignal as SessionAbilitySignal } from '../common/schemas/session.schema';
import type { AbilitySignal } from './ability-engine.types';

/**
 * Сервис для работы с состоянием способностей пользователя
 * УПРОЩЕННАЯ ВЕРСИЯ: Использует только xp_current/xp_required из TreeSemantic
 */
@Injectable()
export class AbilityStateService {
  private readonly logger = new Logger(AbilityStateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityEngine: AbilityEngine,
    private readonly achievementsService: AchievementsService,
    @Inject(TreeService) private readonly treeService: TreeService,
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
   * Источник истины: UserAbilityState (progress/state), структура: seed/tree (xp_required)
   */
  private async loadCurrentStates(
    userId: string,
  ): Promise<Map<string, AbilityStateSnapshot>> {
    // Структура дерева (глобальная) — источник xp_required/prerequisites
    const tree = await this.treeService.getSemantic();

    // Пользовательские данные — источник state/progress/internal_progress/stored_experience/relevance
    const userStates = await this.prisma.userAbilityState.findMany({
      where: { user_id: userId },
      select: {
        node_id: true,
        state: true,
        progress: true,
        internal_progress: true,
        stored_experience: true,
        relevance: true,
        last_activity_date: true,
      },
    });

    const stateMap = new Map(
      userStates.map((s) => [s.node_id, { ...s }]),
    );

    // Нормализатор статуса по прогрессу (авто-переход при 100%)
    const deriveStateFromProgress = (
      progress: number,
      relevance: number,
      current: AbilityState,
    ): AbilityState => {
      if (progress >= 1.0) return 'integrated';
      if (progress >= 0.7) return 'unlocked';
      if (progress >= 0.3 && relevance >= 0.3) return 'active';
      if (current === 'available' || current === 'active' || current === 'unlocked') {
        return current;
      }
      return 'available';
    };

    const map = new Map<string, AbilityStateSnapshot>();
    for (const node of tree.nodes) {
      const xpRequired = node.xp_required || 100;
      const dbState = stateMap.get(node.node_id);
      const internalProgress = Number(dbState?.internal_progress ?? dbState?.progress ?? 0);
      const storedExperience = Number(dbState?.stored_experience ?? 0);
      const displayedProgress = xpRequired > 0 ? Math.min(1.0, internalProgress) : 0;
      const relevance = Number(dbState?.relevance ?? 0);
      const normalizedState = deriveStateFromProgress(displayedProgress, relevance, (dbState?.state as any) || 'locked');

      map.set(node.node_id, {
        nodeId: node.node_id,
        state: normalizedState,
        progress: displayedProgress,
        internalProgress,
        relevance,
        storedExperience,
        lastActivityDate: dbState?.last_activity_date || undefined,
      });
    }

    return map;
  }

  /**
   * Загрузить информацию об узлах
   * Использует fallback на дефолтные значения если узел не найден в AbilityNode
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
        prerequisites: true,
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
        prerequisites: node.prerequisites || [],
      });
    }

    // Fallback: для узлов, не найденных в AbilityNode, создаём дефолтную информацию
    // Это позволяет системе работать даже если таблица ability_nodes пуста
    for (const nodeId of nodeIds) {
      if (!map.has(nodeId)) {
        this.logger.warn(`Node ${nodeId} not found in AbilityNode table, using fallback info`);
        
        // Определяем branch и level на основе node_id
        const branchMap: Record<string, string> = {
          'node_grounding_point': 'branch_subjectivity',
          'node_self_regulation': 'branch_subjectivity',
          'node_role_differentiation': 'branch_subjectivity',
          'node_scenario_analysis': 'branch_subjectivity',
          'node_subject_in_system': 'branch_subjectivity',
          'node_decision_authorship': 'branch_subjectivity',
          'node_architecture_coupling': 'branch_architectural_thinking',
          'node_field_of_differences': 'branch_architectural_thinking',
          'node_system_thinking': 'branch_architectural_thinking',
          'node_scenario_thinking': 'branch_architectural_thinking',
          'node_form_assembly': 'branch_architectural_thinking',
          'node_containment': 'branch_architectural_thinking',
          'node_thinking_through_form': 'branch_architectural_thinking',
          'node_personal_resilience': 'branch_resilience',
          'node_weak_zone_diagnosis': 'branch_resilience',
          'node_recovery_skills': 'branch_resilience',
          'node_emotional_work': 'branch_resilience',
          'node_cognitive_maturity': 'branch_resilience',
          'node_role_energy': 'branch_resilience',
          'node_responsibility_as_form': 'branch_responsibility',
          'node_responsibility_sag_diagnosis': 'branch_responsibility',
          'node_delegation_as_coupling': 'branch_responsibility',
          'node_upper_field_work': 'branch_responsibility',
          'node_leader_liberation': 'branch_responsibility',
          'node_shared_leadership': 'branch_responsibility',
          'node_psychological_ownership': 'branch_responsibility',
          'node_collective_efficacy': 'branch_responsibility',
          'node_feedback_types': 'branch_feedback',
          'node_language_of_differences': 'branch_feedback',
          'node_feedback_through_vulnerability': 'branch_feedback',
          'node_feedforward': 'branch_feedback',
          'node_rede_model': 'branch_feedback',
          'node_mirror_holder': 'branch_feedback',
          'node_maturity_environment': 'branch_maturity_environment',
          'node_subjectivity_transfer': 'branch_maturity_environment',
          'node_scene_holding': 'branch_maturity_environment',
          'node_institutionalization': 'branch_maturity_environment',
          'node_vertical_development': 'branch_maturity_environment',
          'node_ddo': 'branch_maturity_environment',
          'node_mature_parting': 'branch_maturity_environment',
        };

        // Определяем уровень на основе xp_required (0 = basic, 200 = mid, 500 = advanced, 1000 = master)
        const levelMap: Record<string, string> = {
          'node_grounding_point': 'basic',
          'node_architecture_coupling': 'basic',
          'node_personal_resilience': 'basic',
          'node_responsibility_as_form': 'basic',
          'node_feedback_types': 'basic',
          'node_maturity_environment': 'basic',
          'node_decision_authorship': 'master',
          'node_thinking_through_form': 'master',
          'node_role_energy': 'master',
          'node_collective_efficacy': 'master',
          'node_mirror_holder': 'master',
          'node_mature_parting': 'master',
        };

        map.set(nodeId, {
          id: nodeId,
          branch: branchMap[nodeId] || 'branch_subjectivity',
          title: nodeId.replace('node_', '').replace(/_/g, ' '),
          description: '',
          level: (levelMap[nodeId] || 'mid') as any,
          conditions: null,
          prerequisites: [],
        });
      }
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
            internalProgress: c.before.internalProgress ?? c.before.progress,
            relevance: c.before.relevance,
            storedExperience: c.before.storedExperience ?? 0,
          })),
        } as any,
        after: {
          changes: changes.map((c) => ({
            nodeId: c.nodeId,
            state: c.after.state,
            progress: c.after.progress,
            internalProgress: c.after.internalProgress ?? c.after.progress,
            relevance: c.after.relevance,
            storedExperience: c.after.storedExperience ?? 0,
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
        // УПРОЩЕНО: Обновляем только state и relevance
        // progress/internal_progress/stored_experience больше не используются
        // Прогресс вычисляется на лету из TreeSemantic (xp_current / xp_required)
        await this.prisma.userAbilityState.update({
          where: {
            user_id_node_id: {
              user_id: userId,
              node_id: change.nodeId,
            },
          },
          data: {
            // State синхронизируется из TreeSemantic (источник истины)
            state: change.after.state,
            relevance: change.after.relevance,
            last_activity_date: change.after.lastActivityDate || existing.last_activity_date,
            last_updated_at: new Date(),
          },
        });
      } else {
        // Создаем новую запись
        // УПРОЩЕНО: Не сохраняем progress/internal_progress/stored_experience
        try {
          await this.prisma.userAbilityState.create({
            data: {
              user_id: userId,
              node_id: change.nodeId,
              state: change.after.state,
              relevance: change.after.relevance,
              last_activity_date: change.after.lastActivityDate || new Date(),
              last_updated_at: new Date(),
            },
          });
        } catch (error) {
          throw error;
        }
      }
    }

    this.logger.log(
      `Applied ${changes.length} state changes for user ${userId}, changeLogId: ${changeLog.id}`,
    );

    return changeLog.id;
  }

  /**
   * Применить опыт от квеста/кейса к узлу
   * Новая система: Base XP + Reflection XP с упрощенной формулой
   * @param userId - ID пользователя
   * @param nodeId - ID узла
   * @param baseXp - базовый опыт за выполнение квеста
   * @param reflectionXp - опыт за рефлексию (0 если рефлексии нет)
   * @param questDifficulty - сложность квеста/кейса (опционально)
   */
  async applyQuestExperience(
    userId: string,
    nodeId: string,
    baseXp: number,
    reflectionXp: number,
    questDifficulty?: 'basic' | 'intermediate' | 'advanced',
  ): Promise<{
    changes: AbilityStateChange[];
    changeLogId?: string;
  }> {
    const totalXp = baseXp + reflectionXp;
    const reflectionText = reflectionXp > 0 ? ` (${baseXp} base + ${reflectionXp} reflection)` : ` (${baseXp} base, no reflection)`;
    this.logger.log(
      `Applying ${totalXp} XP${reflectionText} from quest/case to node ${nodeId} for user ${userId}`,
    );

    // Получаем текущее состояние узла и информацию об узле
    const tree = await this.treeService.getSemantic(userId);
    const treeNode = tree.nodes.find((n) => n.node_id === nodeId);
    if (!treeNode) {
      this.logger.warn(`Node ${nodeId} not found in tree for user ${userId}`);
      return { changes: [] };
    }

    const nodeInfos = await this.loadNodeInfos([nodeId]);
    const nodeInfo = nodeInfos.get(nodeId);
    if (!nodeInfo) {
      this.logger.warn(`Node info ${nodeId} not found for user ${userId}`);
      return { changes: [] };
    }

    const xpRequired = treeNode.xp_required || 100;
    const xpCurrent = treeNode.xp_current || 0;
    const beforeProgress = xpRequired > 0 ? Math.min(1.0, xpCurrent / xpRequired) : 0;
    const beforeState = treeNode.state || 'locked';

    // Новая упрощенная формула: (Base XP + Reflection XP) × Node Level Multiplier × State Multiplier
    // Node Level Multiplier
    const nodeLevelMultipliers: Record<string, number> = {
      basic: 1.0,
      mid: 0.8,
      advanced: 0.6,
      master: 0.4,
    };
    const nodeLevelMultiplier = nodeLevelMultipliers[nodeInfo.level] || 1.0;

    // State Multiplier (новые значения)
    const stateMultipliers: Record<string, number> = {
      locked: 0.0,
      available: 0.7,
      active: 1.0,
      unlocked: 0.8,
      integrated: 0.6,
    };
    const stateMultiplier = stateMultipliers[beforeState] || 1.0;

    // Вычисляем итоговый XP с множителями
    let appliedXp = totalXp * nodeLevelMultiplier * stateMultiplier;

    // Если узел locked, XP копится, но не применяется (сохраняется для применения после разблокировки)
    if (beforeState === 'locked') {
      // XP сохраняется, но не применяется сейчас
      // В будущем можно добавить storedExperience, но для упрощения пока игнорируем
      appliedXp = 0;
      this.logger.log(`Node ${nodeId} is locked. XP will be applied after unlock.`);
    }

    // Обновляем xp_current в TreeSemantic (автоматически обновит состояние)
    const updatedNode = await this.treeService.updateNodeProgress(nodeId, appliedXp, userId);

    // Вычисляем финальный прогресс
    const finalXpRequired = updatedNode.xp_required || 100;
    const finalXpCurrent = updatedNode.xp_current || 0;
    const afterProgress = finalXpRequired > 0 ? Math.min(1.0, finalXpCurrent / finalXpRequired) : 0;
    const afterState = updatedNode.state || beforeState;

    // Получаем relevance из UserAbilityState
    const userState = await this.prisma.userAbilityState.findUnique({
      where: { user_id_node_id: { user_id: userId, node_id: nodeId } },
      select: { relevance: true },
    });
    const relevance = userState ? Number(userState.relevance) : 0;

    // Создаем изменение для обратной совместимости
    const change: AbilityStateChange = {
      nodeId,
      before: {
        nodeId,
        state: beforeState as any,
        progress: beforeProgress,
        internalProgress: beforeProgress,
        relevance,
        storedExperience: 0,
      },
      after: {
        nodeId,
        state: afterState as any,
        progress: afterProgress,
        internalProgress: afterProgress,
        relevance,
        storedExperience: 0,
      },
      reason: reflectionXp > 0
        ? `Applied ${totalXp} XP${reflectionText} × ${nodeLevelMultiplier} (node level) × ${stateMultiplier} (state) = ${appliedXp.toFixed(1)} XP`
        : `Applied ${totalXp} XP${reflectionText} × ${nodeLevelMultiplier} (node level) × ${stateMultiplier} (state) = ${appliedXp.toFixed(1)} XP (no reflection, only base XP)`,
    };

    // Синхронизируем состояние с UserAbilityState
    await this.syncStateToUserAbilityState(userId, nodeId, updatedNode.state);

    // Проверяем и выдаем ачивки
    // Используем xp_current / xp_required для вычисления прогресса (может быть > 1.0 для ачивок)
    const progressForAchievements = xpRequired > 0 ? updatedNode.xp_current / xpRequired : 0;
    if (progressForAchievements > 0) {
      try {
        await this.achievementsService.checkAndAwardAchievements(
          userId,
          nodeId,
          progressForAchievements, // Может быть > 1.0 для ачивок выше 100%
        );
      } catch (error) {
        this.logger.warn(`Failed to check achievements for node ${nodeId}:`, error);
      }
    }

    return { changes: [change] };
  }

  /**
   * Синхронизировать состояние с UserAbilityState
   */
  private async syncStateToUserAbilityState(userId: string, nodeId: string, state: string) {
    try {
      const existing = await this.prisma.userAbilityState.findUnique({
        where: {
          user_id_node_id: {
            user_id: userId,
            node_id: nodeId,
          },
        },
      });

      if (existing) {
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
      } else {
        await this.prisma.userAbilityState.create({
          data: {
            user_id: userId,
            node_id: nodeId,
            state,
            relevance: 0,
            last_updated_at: new Date(),
          },
        });
      }
    } catch (error: any) {
      this.logger.warn(`Failed to sync state to UserAbilityState for node ${nodeId}: ${error.message}`);
    }
  }

  /**
   * Обновить дату последней активности для узла
   * УПРОЩЕНО: Не сохраняем progress/internal_progress/stored_experience
   */
  private async updateLastActivityDate(userId: string, nodeId: string): Promise<void> {
    // Получаем текущее состояние из TreeSemantic
    const tree = await this.treeService.getSemantic(userId);
    const node = tree.nodes.find(n => n.node_id === nodeId);
    const currentState = node?.state || 'locked';
    
    await this.prisma.userAbilityState.upsert({
      where: {
        user_id_node_id: {
          user_id: userId,
          node_id: nodeId,
        },
      },
      update: {
        last_activity_date: new Date(),
      },
      create: {
        user_id: userId,
        node_id: nodeId,
        state: currentState,
        relevance: 0,
        last_activity_date: new Date(),
      },
    });
  }
}

