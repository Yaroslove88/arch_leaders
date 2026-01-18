import { Injectable, Logger } from '@nestjs/common';
import {
  AbilityState,
  AbilitySignal,
  AbilityStateSnapshot,
  AbilityStateChange,
  AbilityNodeInfo,
  ComputeNextInput,
  ComputeNextOutput,
  ApplyQuestExperienceInput,
  ApplyQuestExperienceOutput,
} from './ability-engine.types';

/**
 * Получить отображаемый прогресс из внутреннего
 * Отображаемый прогресс всегда максимум 100%
 */
export function getDisplayedProgress(internalProgress: number): number {
  return Math.min(1.0, internalProgress);
}

/**
 * Детерминированное ядро для вычисления изменений состояния способностей
 * 
 * Правила:
 * - Одинаковые входные данные = одинаковый результат
 * - Не зависит от времени выполнения
 * - Не делает запросов к БД (чистая функция)
 */
@Injectable()
export class AbilityEngine {
  private readonly logger = new Logger(AbilityEngine.name);

  /**
   * Вычислить следующее состояние на основе сигналов
   */
  computeNext(input: ComputeNextInput): ComputeNextOutput {
    this.logger.log(
      `Computing next state for user ${input.userId} with ${input.signals.length} signals`,
    );

    const changes: AbilityStateChange[] = [];
    const summary = {
      nodesUpdated: 0,
      nodesUnlocked: 0,
      nodesActivated: 0,
    };

    // Группируем сигналы по node_id
    const signalsByNode = new Map<string, AbilitySignal[]>();
    for (const signal of input.signals) {
      const existing = signalsByNode.get(signal.node_id) || [];
      existing.push(signal);
      signalsByNode.set(signal.node_id, existing);
    }

    // Обрабатываем каждый узел
    for (const [nodeId, signals] of signalsByNode) {
      const nodeInfo = input.nodeInfos.get(nodeId);
      if (!nodeInfo) {
        this.logger.warn(`Node ${nodeId} not found in nodeInfos, skipping`);
        continue;
      }

      const currentState = input.currentStates.get(nodeId) || {
        nodeId,
        state: 'locked' as AbilityState,
        progress: 0,
        internalProgress: 0,
        relevance: 0,
        storedExperience: 0,
      };

      const nextState = this.computeNodeState(
        nodeInfo,
        currentState,
        signals,
        input.currentStates,
      );

      // Проверяем, было ли изменение
      if (
        nextState.state !== currentState.state ||
        Math.abs(nextState.progress - currentState.progress) > 0.001 ||
        Math.abs(nextState.internalProgress - (currentState.internalProgress || 0)) > 0.001 ||
        Math.abs(nextState.relevance - currentState.relevance) > 0.001 ||
        Math.abs((nextState.storedExperience || 0) - (currentState.storedExperience || 0)) > 0.001
      ) {
        changes.push({
          nodeId,
          before: { ...currentState },
          after: { ...nextState },
          reason: this.generateReason(signals, currentState, nextState),
        });

        summary.nodesUpdated++;
        if (currentState.state === 'locked' && nextState.state !== 'locked') {
          summary.nodesUnlocked++;
        }
        if (currentState.state !== 'active' && nextState.state === 'active') {
          summary.nodesActivated++;
        }
      }
    }

    this.logger.log(
      `Computed ${changes.length} changes: ${summary.nodesUpdated} updated, ${summary.nodesUnlocked} unlocked, ${summary.nodesActivated} activated`,
    );

    return { changes, summary };
  }

  /**
   * Вычислить состояние узла на основе сигналов
   */
  private computeNodeState(
    nodeInfo: AbilityNodeInfo,
    currentState: AbilityStateSnapshot,
    signals: AbilitySignal[],
    allStates: Map<string, AbilityStateSnapshot>,
  ): AbilityStateSnapshot {
    // Агрегируем сигналы в числовую оценку
    const signalStrength = this.aggregateSignals(signals);

    // Вычисляем новую актуальность (relevance)
    // Актуальность растет с количеством и силой сигналов
    const newRelevance = Math.min(1.0, currentState.relevance + signalStrength * 0.1);

    // Получаем текущий внутренний прогресс (или используем progress как fallback для миграции)
    const currentInternalProgress = currentState.internalProgress ?? currentState.progress;
    const currentStoredExperience = currentState.storedExperience ?? 0;

    // Вычисляем базовое приращение внутреннего прогресса
    // Внутренний прогресс неограничен и может расти бесконечно
    // Применяем множитель предварительных условий
    const prerequisiteMultiplier = this.getPrerequisiteMultiplier(
      nodeInfo,
      allStates,
    );
    const baseProgressIncrement = this.computeProgressIncrement(
      signalStrength,
      nodeInfo.level,
      currentInternalProgress,
      undefined, // сложность квеста не определена для сигналов из записей
    );
    
    // Применяем множитель предварительных условий
    const progressIncrementWithPrerequisites = baseProgressIncrement * prerequisiteMultiplier;

    // Применяем множитель по статусу узла
    const stateMultiplier = this.getStateMultiplier(currentState.state);
    const experienceToApply = progressIncrementWithPrerequisites * stateMultiplier;
    const experienceToStore = progressIncrementWithPrerequisites - experienceToApply;

    // Применяем опыт к внутреннему прогрессу
    const newInternalProgress = currentInternalProgress + experienceToApply;
    
    // Сохраняем не примененный опыт
    const newStoredExperience = currentStoredExperience + experienceToStore;

    // Если узел переходит в "активен", применяем сохраненный опыт
    let finalInternalProgress = newInternalProgress;
    let finalStoredExperience = newStoredExperience;
    
    const newDisplayedProgress = Math.min(1.0, newInternalProgress);
    const willBecomeActive = 
      currentState.state !== 'active' && 
      newDisplayedProgress >= 0.3 && 
      newRelevance >= 0.3;

    if (willBecomeActive && finalStoredExperience > 0) {
      // Применяем сохраненный опыт при переходе в "активен"
      finalInternalProgress += finalStoredExperience;
      finalStoredExperience = 0;
    }

    // Отображаемый прогресс - максимум 100%
    const finalDisplayedProgress = Math.min(1.0, finalInternalProgress);

    // Определяем новое состояние на основе отображаемого прогресса и условий разблокировки
    const newState = this.determineState(
      nodeInfo,
      currentState.state,
      finalDisplayedProgress,
      newRelevance,
      allStates,
    );

    // Обновляем lastActivityDate, если есть сигналы (активность)
    const newLastActivityDate = signals.length > 0 ? new Date() : currentState.lastActivityDate;

    return {
      nodeId: currentState.nodeId,
      state: newState,
      progress: finalDisplayedProgress,
      internalProgress: finalInternalProgress,
      relevance: newRelevance,
      storedExperience: finalStoredExperience,
      lastActivityDate: newLastActivityDate,
    };
  }

  /**
   * Агрегировать сигналы в числовую оценку силы
   */
  private aggregateSignals(signals: AbilitySignal[]): number {
    // Простая эвристика: каждый сигнал добавляет силу
    // В будущем можно добавить более сложную логику (веса, типы сигналов)
    return Math.min(1.0, signals.length * 0.2);
  }

  /**
   * Вычислить приращение прогресса
   * Работает с внутренним прогрессом (может быть > 1.0)
   * @param signalStrength - сила сигналов (0-1)
   * @param nodeLevel - уровень узла (basic, mid, advanced, master)
   * @param currentInternalProgress - текущий внутренний прогресс
   * @param questDifficulty - сложность квеста/кейса (опционально, для соответствия сложности)
   */
  private computeProgressIncrement(
    signalStrength: number,
    nodeLevel: string,
    currentInternalProgress: number,
    questDifficulty?: 'basic' | 'intermediate' | 'advanced',
  ): number {
    // Базовое приращение зависит от силы сигналов
    let increment = signalStrength * 0.05;

    // Корректируем в зависимости от уровня узла
    // Базовые узлы получают больше опыта, продвинутые меньше
    const levelMultiplier: Record<string, number> = {
      basic: 1.0,    // 100% эффективность
      mid: 0.8,      // 80% эффективность
      advanced: 0.6,  // 60% эффективность
      master: 0.4,    // 40% эффективность
    };

    increment *= levelMultiplier[nodeLevel] || 1.0;

    // Применяем соответствие сложности квеста/кейса и узла
    if (questDifficulty) {
      const difficultyMatchMultiplier = this.getDifficultyMatchMultiplier(
        questDifficulty,
        nodeLevel,
      );
      increment *= difficultyMatchMultiplier;
    }

    // Замедляем рост при высоком отображаемом прогрессе (убывающая отдача)
    // Используем отображаемый прогресс для расчета замедления
    const displayedProgress = Math.min(1.0, currentInternalProgress);
    
    // Убывающая отдача по отображаемому прогрессу
    if (displayedProgress >= 0.8) {
      increment *= 0.5; // 80-100%: половина эффективности (приближение к интеграции)
    }

    // Дополнительное замедление для сверх-интеграции (внутренний прогресс > 100%)
    // Только для мастер-узлов может превышать 100%
    if (currentInternalProgress > 1.0) {
      // Убывающая отдача выше 100%
      if (currentInternalProgress >= 2.0) {
        increment *= 0.1; // 200%+: минимальная эффективность (10%)
      } else if (currentInternalProgress >= 1.2) {
        increment *= 0.25; // 120-200%: четверть эффективности (25%)
      } else {
        increment *= 0.5; // 100-120%: половина эффективности (50%)
      }
    }

    return increment;
  }

  /**
   * Получить множитель соответствия сложности квеста/кейса и уровня узла
   * Базовые квесты → Базовые/Средние узлы: 100%
   * Базовые квесты → Продвинутые/Мастер-узлы: 25% (убывающая отдача)
   * Продвинутые квесты → Базовые узлы: 100% (но ограничено максимумом узла)
   * Продвинутые квесты → Продвинутые/Мастер-узлы: 100%
   */
  private getDifficultyMatchMultiplier(
    questDifficulty: 'basic' | 'intermediate' | 'advanced',
    nodeLevel: string,
  ): number {
    const DIFFICULTY_MATCH: Record<string, Record<string, number>> = {
      basic: {
        basic: 1.0,    // 100% - полное соответствие
        mid: 1.0,      // 100% - полное соответствие
        advanced: 0.25, // 25% - убывающая отдача
        master: 0.25,   // 25% - убывающая отдача
      },
      intermediate: {
        basic: 1.0,    // 100% - можно использовать для базовых узлов
        mid: 1.0,      // 100% - полное соответствие
        advanced: 1.0,  // 100% - полное соответствие
        master: 0.5,   // 50% - частичное соответствие
      },
      advanced: {
        basic: 1.0,    // 100% - можно использовать для базовых узлов
        mid: 1.0,      // 100% - можно использовать
        advanced: 1.0, // 100% - полное соответствие
        master: 1.0,   // 100% - полное соответствие
      },
    };

    return DIFFICULTY_MATCH[questDifficulty]?.[nodeLevel] ?? 1.0;
  }

  /**
   * Определить новое состояние узла
   * 
   * ВАЖНО: Определяем статус на основе отображаемого прогресса (0-100%),
   * а не внутреннего прогресса, чтобы статусы всегда соответствовали видимому прогрессу
   */
  private determineState(
    nodeInfo: AbilityNodeInfo,
    currentState: AbilityState,
    displayedProgress: number, // отображаемый прогресс (0-1.0, максимум 100%)
    newRelevance: number,
    allStates: Map<string, AbilityStateSnapshot>,
  ): AbilityState {
    // Определяем статус на основе отображаемого прогресса (приоритет над текущим состоянием)
    // Это гарантирует, что статус всегда соответствует видимому прогрессу

    // 1. Интегрирован: отображаемый прогресс >= 100% (1.0)
    if (displayedProgress >= 1.0) {
      return 'integrated';
    }

    // 2. Разблокирован: отображаемый прогресс >= 70% (0.7)
    if (displayedProgress >= 0.7) {
      return 'unlocked';
    }

    // 3. Активен: отображаемый прогресс >= 30% (0.3) и актуальность >= 30% (0.3)
    // Актуальность >= 30% требуется только для перехода из "Доступен" в "Активен"
    if (displayedProgress >= 0.3 && newRelevance >= 0.3) {
      return 'active';
    }

    // 4. Доступен: узел разблокирован (выполнены условия разблокировки)
    if (this.checkUnlockConditions(nodeInfo, allStates, displayedProgress)) {
      return 'available';
    }

    // 5. Заблокирован: не выполнены условия разблокировки
    return 'locked';
  }

  /**
   * Проверить условия разблокировки узла
   * Использует отображаемый прогресс для проверки условий
   */
  private checkUnlockConditions(
    nodeInfo: AbilityNodeInfo,
    allStates: Map<string, AbilityStateSnapshot>,
    displayedProgress: number, // отображаемый прогресс (0-1.0)
  ): boolean {
    // Сначала проверяем prerequisites (предварительные условия)
    if (nodeInfo.prerequisites && nodeInfo.prerequisites.length > 0) {
      const prerequisitesMet = this.checkPrerequisites(
        nodeInfo.prerequisites,
        allStates,
      );
      // Если prerequisites выполнены, узел разблокирован
      if (prerequisitesMet) {
        return true;
      }
      // Если prerequisites не выполнены, проверяем базовый прогресс как альтернативу
    }

    // Если есть условия в nodeInfo.conditions (legacy), проверяем их
    if (nodeInfo.conditions) {
      // TODO: Реализовать проверку условий из conditions
      // Пока возвращаем true если прогресс достаточен
      return displayedProgress >= 0.1;
    }

    // По умолчанию: базовые узлы разблокируются легко, продвинутые требуют больше
    // Используем отображаемый прогресс для проверки
    const threshold: Record<string, number> = {
      basic: 0.05,
      mid: 0.15,
      advanced: 0.25,
      master: 0.35,
    };

    return displayedProgress >= (threshold[nodeInfo.level] || 0.1);
  }

  /**
   * Проверить, выполнены ли предварительные условия (prerequisites)
   * ВАЖНО: Узлы 2 уровня разблокируются только когда prerequisite узлы достигли состояния 'unlocked' или 'integrated'
   * (не просто 'available' или 'active')
   */
  private checkPrerequisites(
    prerequisiteIds: string[],
    allStates: Map<string, AbilityStateSnapshot>,
  ): boolean {
    if (prerequisiteIds.length === 0) {
      return true;
    }

    // Проверяем, что все prerequisite узлы разблокированы (unlocked или integrated)
    for (const prerequisiteId of prerequisiteIds) {
      const prerequisiteState = allStates.get(prerequisiteId);
      // Если prerequisite узел не найден или не разблокирован, условие не выполнено
      if (!prerequisiteState || 
          prerequisiteState.state === 'locked' || 
          prerequisiteState.state === 'available' || 
          prerequisiteState.state === 'active') {
        return false;
      }
      // Только 'unlocked' или 'integrated' считаются разблокированными для prerequisites
    }

    return true;
  }

  /**
   * Получить множитель опыта на основе предварительных условий
   * Если все prerequisites выполнены - полный опыт (1.0)
   * Если некоторые отсутствуют - уменьшенный опыт
   */
  private getPrerequisiteMultiplier(
    nodeInfo: AbilityNodeInfo,
    allStates: Map<string, AbilityStateSnapshot>,
  ): number {
    if (!nodeInfo.prerequisites || nodeInfo.prerequisites.length === 0) {
      return 1.0; // Нет prerequisites - полный опыт
    }

    // Подсчитываем, сколько prerequisites выполнено
    let metCount = 0;
    for (const prerequisiteId of nodeInfo.prerequisites) {
      const prerequisiteState = allStates.get(prerequisiteId);
      if (prerequisiteState && prerequisiteState.state !== 'locked') {
        metCount++;
      }
    }

    const totalCount = nodeInfo.prerequisites.length;
    const missingCount = totalCount - metCount;

    // Применяем множители на основе количества отсутствующих prerequisites
    const PREREQUISITE_MULTIPLIERS = {
      allMet: 1.0, // Все выполнены - полный опыт
      oneMissing: 0.5, // Один отсутствует - половина опыта
      twoMissing: 0.25, // Два отсутствуют - четверть опыта
      threeOrMoreMissing: 0.1, // Три или больше отсутствуют - минимальный опыт
    };

    if (missingCount === 0) {
      return PREREQUISITE_MULTIPLIERS.allMet;
    } else if (missingCount === 1) {
      return PREREQUISITE_MULTIPLIERS.oneMissing;
    } else if (missingCount === 2) {
      return PREREQUISITE_MULTIPLIERS.twoMissing;
    } else {
      return PREREQUISITE_MULTIPLIERS.threeOrMoreMissing;
    }
  }

  /**
   * Получить множитель опыта на основе статуса узла
   * Новая система: упрощенные множители без Diminishing Returns
   */
  private getStateMultiplier(state: AbilityState): number {
    const STATE_MULTIPLIERS: Record<AbilityState, number> = {
      locked: 0.0,        // 0% - XP копится, но не применяется
      available: 0.7,     // 70% - частичное применение
      active: 1.0,        // 100% - полная эффективность
      unlocked: 0.8,      // 80% - продолжение развития
      integrated: 0.6,    // 60% - углубленное развитие
    };

    return STATE_MULTIPLIERS[state] ?? 1.0;
  }

  /**
   * Сгенерировать причину изменения
   */
  private generateReason(
    signals: AbilitySignal[],
    before: AbilityStateSnapshot,
    after: AbilityStateSnapshot,
  ): string {
    const reasons: string[] = [];

    if (before.state !== after.state) {
      reasons.push(`State changed from ${before.state} to ${after.state}`);
    }

    if (Math.abs(after.progress - before.progress) > 0.01) {
      reasons.push(
        `Displayed progress increased from ${(before.progress * 100).toFixed(1)}% to ${(after.progress * 100).toFixed(1)}%`,
      );
    }

    if (Math.abs((after.internalProgress || 0) - (before.internalProgress || 0)) > 0.01) {
      reasons.push(
        `Internal progress: ${((before.internalProgress || 0) * 100).toFixed(1)}% → ${((after.internalProgress || 0) * 100).toFixed(1)}%`,
      );
    }

    if (signals.length > 0) {
      reasons.push(`Based on ${signals.length} ability signal(s)`);
    }

    return reasons.join('. ') || 'State updated';
  }

  /**
   * Применить опыт от квеста/кейса к узлу
   * Новая упрощенная формула: (Base XP + Reflection XP) × Node Level Multiplier × State Multiplier
   */
  applyQuestExperience(
    input: ApplyQuestExperienceInput,
  ): ApplyQuestExperienceOutput {
    const { nodeId, baseXp, reflectionXp, questDifficulty, currentStates, nodeInfos } = input;

    const nodeInfo = nodeInfos.get(nodeId);
    if (!nodeInfo) {
      this.logger.warn(`Node ${nodeId} not found in nodeInfos`);
      return { change: null };
    }

    const currentState = currentStates.get(nodeId) || {
      nodeId,
      state: 'locked' as AbilityState,
      progress: 0,
      internalProgress: 0,
      relevance: 0,
      storedExperience: 0,
    };

    // Новая упрощенная формула: (Base XP + Reflection XP) × Node Level Multiplier × State Multiplier
    const totalXp = baseXp + reflectionXp;

    // Node Level Multiplier (без изменений)
    const nodeLevelMultipliers: Record<string, number> = {
      basic: 1.0,
      mid: 0.8,
      advanced: 0.6,
      master: 0.4,
    };
    const nodeLevelMultiplier = nodeLevelMultipliers[nodeInfo.level] || 1.0;

    // State Multiplier (новые значения)
    const stateMultiplier = this.getStateMultiplier(currentState.state);

    // Вычисляем итоговый XP с множителями
    const appliedXp = totalXp * nodeLevelMultiplier * stateMultiplier;

    // Если узел locked, XP сохраняется, но не применяется
    let experienceToApply = 0;
    let experienceToStore = 0;

    if (currentState.state === 'locked') {
      experienceToStore = appliedXp; // XP сохраняется для применения после разблокировки
      experienceToApply = 0;
    } else {
      experienceToApply = appliedXp;
      experienceToStore = 0;
    }

    // Конвертируем XP в приращение прогресса
    // Базовая формула: приращение = appliedXp / baseExperience
    const baseExperienceByLevel: Record<string, number> = {
      basic: 50,
      mid: 75,
      advanced: 100,
      master: 150,
    };

    const baseExperience = baseExperienceByLevel[nodeInfo.level] || 50;
    const experienceRatio = experienceToApply / baseExperience;

    // Вычисляем приращение прогресса
    const currentInternalProgress = currentState.internalProgress ?? currentState.progress;
    const currentStoredExperience = currentState.storedExperience ?? 0;

    // Базовое приращение (конвертируем опыт в приращение прогресса)
    const baseIncrement = experienceRatio * 0.05; // Базовое приращение на единицу опыта

    // Применяем опыт к внутреннему прогрессу
    const newInternalProgress = currentInternalProgress + baseIncrement;
    const newStoredExperience = currentStoredExperience + (experienceToStore / baseExperience) * 0.05;

    // Если узел переходит в "активен", применяем сохраненный опыт
    let finalInternalProgress = newInternalProgress;
    let finalStoredExperience = newStoredExperience;

    const newDisplayedProgress = Math.min(1.0, newInternalProgress);
    const newRelevance = currentState.relevance; // Актуальность не меняется от квестов

    const willBecomeActive =
      currentState.state !== 'active' &&
      newDisplayedProgress >= 0.3 &&
      newRelevance >= 0.3;

    if (willBecomeActive && finalStoredExperience > 0) {
      finalInternalProgress += finalStoredExperience;
      finalStoredExperience = 0;
    }

    const finalDisplayedProgress = Math.min(1.0, finalInternalProgress);

    // Определяем новое состояние
    const newState = this.determineState(
      nodeInfo,
      currentState.state,
      finalDisplayedProgress,
      newRelevance,
      currentStates,
    );

    const nextState: AbilityStateSnapshot = {
      nodeId,
      state: newState,
      progress: finalDisplayedProgress,
      internalProgress: finalInternalProgress,
      relevance: newRelevance,
      storedExperience: finalStoredExperience,
      lastActivityDate: new Date(), // Обновляем дату активности
    };

    // Проверяем, было ли изменение
    if (
      nextState.state !== currentState.state ||
      Math.abs(nextState.progress - currentState.progress) > 0.001 ||
      Math.abs(nextState.internalProgress - (currentState.internalProgress || 0)) > 0.001 ||
      Math.abs((nextState.storedExperience || 0) - (currentState.storedExperience || 0)) > 0.001
    ) {
      const totalXpText = reflectionXp > 0 
        ? `${totalXp} XP (${baseXp} base + ${reflectionXp} reflection)` 
        : `${totalXp} XP (${baseXp} base, no reflection)`;
      const reason = `Applied ${totalXpText} × ${nodeLevelMultiplier} (node level) × ${stateMultiplier} (state) = ${appliedXp.toFixed(1)} XP`;

      return {
        change: {
          nodeId,
          before: { ...currentState },
          after: nextState,
          reason,
        },
      };
    }

    return { change: null };
  }
}

