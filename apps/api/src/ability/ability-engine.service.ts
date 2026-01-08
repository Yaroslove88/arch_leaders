import { Injectable, Logger } from '@nestjs/common';
import {
  AbilityState,
  AbilitySignal,
  AbilityStateSnapshot,
  AbilityStateChange,
  AbilityNodeInfo,
  ComputeNextInput,
  ComputeNextOutput,
} from './ability-engine.types';

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
        relevance: 0,
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
        Math.abs(nextState.relevance - currentState.relevance) > 0.001
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

    // Вычисляем прогресс
    // Прогресс растет с сигналами, но зависит от уровня узла
    const progressIncrement = this.computeProgressIncrement(
      signalStrength,
      nodeInfo.level,
      currentState.progress,
    );
    const newProgress = Math.min(1.5, currentState.progress + progressIncrement);

    // Определяем новое состояние на основе прогресса и условий разблокировки
    const newState = this.determineState(
      nodeInfo,
      currentState.state,
      newProgress,
      newRelevance,
      allStates,
    );

    return {
      nodeId: currentState.nodeId,
      state: newState,
      progress: newProgress,
      relevance: newRelevance,
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
   */
  private computeProgressIncrement(
    signalStrength: number,
    level: string,
    currentProgress: number,
  ): number {
    // Базовое приращение зависит от силы сигналов
    let increment = signalStrength * 0.05;

    // Корректируем в зависимости от уровня узла
    const levelMultiplier: Record<string, number> = {
      basic: 1.0,
      mid: 0.8,
      advanced: 0.6,
      master: 0.4,
    };

    increment *= levelMultiplier[level] || 1.0;

    // Замедляем рост при высоком прогрессе (асимптотический рост)
    if (currentProgress > 0.8) {
      increment *= 0.5;
    } else if (currentProgress > 0.5) {
      increment *= 0.7;
    }

    return increment;
  }

  /**
   * Определить новое состояние узла
   */
  private determineState(
    nodeInfo: AbilityNodeInfo,
    currentState: AbilityState,
    newProgress: number,
    newRelevance: number,
    allStates: Map<string, AbilityStateSnapshot>,
  ): AbilityState {
    // Если узел заблокирован, проверяем условия разблокировки
    if (currentState === 'locked') {
      if (this.checkUnlockConditions(nodeInfo, allStates, newProgress)) {
        return 'available';
      }
      return 'locked';
    }

    // Если узел доступен, проверяем активацию
    if (currentState === 'available') {
      if (newProgress >= 0.3 && newRelevance >= 0.3) {
        return 'active';
      }
      return 'available';
    }

    // Если узел активен, проверяем разблокировку (unlocked)
    if (currentState === 'active') {
      if (newProgress >= 0.7) {
        return 'unlocked';
      }
      return 'active';
    }

    // Если узел разблокирован, проверяем интеграцию
    if (currentState === 'unlocked') {
      if (newProgress >= 1.0) {
        return 'integrated';
      }
      return 'unlocked';
    }

    // Если интегрирован, остается интегрированным
    if (currentState === 'integrated') {
      return 'integrated';
    }

    // По умолчанию возвращаем текущее состояние
    return currentState;
  }

  /**
   * Проверить условия разблокировки узла
   */
  private checkUnlockConditions(
    nodeInfo: AbilityNodeInfo,
    allStates: Map<string, AbilityStateSnapshot>,
    progress: number,
  ): boolean {
    // Если есть условия в nodeInfo.conditions, проверяем их
    // Пока используем простую эвристику: базовый прогресс или зависимости
    if (nodeInfo.conditions) {
      // TODO: Реализовать проверку условий из conditions
      // Пока возвращаем true если прогресс достаточен
      return progress >= 0.1;
    }

    // По умолчанию: базовые узлы разблокируются легко, продвинутые требуют больше
    const threshold: Record<string, number> = {
      basic: 0.05,
      mid: 0.15,
      advanced: 0.25,
      master: 0.35,
    };

    return progress >= (threshold[nodeInfo.level] || 0.1);
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
        `Progress increased from ${before.progress.toFixed(2)} to ${after.progress.toFixed(2)}`,
      );
    }

    if (signals.length > 0) {
      reasons.push(`Based on ${signals.length} ability signal(s)`);
    }

    return reasons.join('. ') || 'State updated';
  }
}

