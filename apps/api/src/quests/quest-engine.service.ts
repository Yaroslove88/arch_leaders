import { Injectable, Logger } from '@nestjs/common';
import {
  QuestGenerationInput,
  QuestGenerationOutput,
  QuestRule,
  GeneratedQuestData,
  NodeInfo,
} from './quest-engine.types';
import type { QuestCriteria, QuestReward } from '../common/schemas/quest.schema';

/**
 * Детерминированное ядро для правил генерации квестов
 * 
 * Правила:
 * - Одинаковые входные данные = одинаковый результат
 * - Не зависит от времени выполнения
 * - Не делает запросов к БД или LLM (чистая функция)
 * - Определяет структуру квестов, критерии, награды
 */
@Injectable()
export class QuestEngine {
  private readonly logger = new Logger(QuestEngine.name);

  /**
   * Правила генерации квестов по типам
   */
  private readonly questRules: Record<string, QuestRule> = {
    ability_micro: {
      type: 'micro',
      criteriaType: 'evidence',
      target: 3,
      xp: 100,
      skillXp: 50,
      maxQuests: 10, // Максимум квестов из ability signals
    },
    focus_weekly: {
      type: 'weekly',
      criteriaType: 'count',
      target: 5,
      xp: 200,
      skillXp: 100,
      maxQuests: 3, // Максимум квестов из focus
    },
    theme_story: {
      type: 'story',
      criteriaType: 'custom',
      xp: 300,
      maxQuests: 1, // Один квест из главной темы
    },
  };

  /**
   * Генерировать квесты на основе входных данных
   */
  generateQuests(input: QuestGenerationInput): QuestGenerationOutput {
    this.logger.log(
      `Generating quests for user ${input.userId}: ${input.abilitySignals.length} signals, ${input.focus.length} focus points, ${input.themes.length} themes`,
    );

    const quests: GeneratedQuestData[] = [];
    const summary = {
      total: 0,
      byType: {} as Record<string, number>,
    };

    // 1. Генерируем квесты из ability signals
    const abilityQuests = this.generateFromAbilitySignals(input);
    quests.push(...abilityQuests);
    summary.byType.micro = abilityQuests.length;

    // 2. Генерируем квесты из focus (high priority)
    const focusQuests = this.generateFromFocus(input);
    quests.push(...focusQuests);
    summary.byType.weekly = focusQuests.length;

    // 3. Генерируем квест из главной темы
    const themeQuests = this.generateFromThemes(input);
    quests.push(...themeQuests);
    summary.byType.story = themeQuests.length;

    summary.total = quests.length;

    this.logger.log(
      `Generated ${summary.total} quests: ${summary.byType.micro} micro, ${summary.byType.weekly} weekly, ${summary.byType.story} story`,
    );

    return { quests, summary };
  }

  /**
   * Генерировать квесты из ability signals
   */
  private generateFromAbilitySignals(input: QuestGenerationInput): GeneratedQuestData[] {
    const rule = this.questRules.ability_micro;
    const quests: GeneratedQuestData[] = [];
    const maxQuests = rule.maxQuests || 10;

    // Ограничиваем количество квестов
    const signals = input.abilitySignals.slice(0, maxQuests);

    for (const signal of signals) {
      if (!signal.node_id || !signal.signal) {
        continue;
      }

      const nodeInfo = input.nodeInfos?.get(signal.node_id);
      const nodeName = nodeInfo?.name || signal.node_id;

      const criteria: QuestCriteria = {
        type: rule.criteriaType,
        target: rule.target,
        description: `Собрать ${rule.target} доказательства применения способности "${signal.signal}"`,
      };

      const reward: QuestReward = {
        xp: rule.xp,
        skill_xp: rule.skillXp,
      };

      quests.push({
        title: `Развить: ${nodeName}`,
        description: `Практиковать способность "${signal.signal}" в реальных ситуациях.`,
        type: rule.type,
        criteria,
        reward,
        linked_nodes: [signal.node_id],
        tags: ['auto-generated', 'ability'],
      });
    }

    return quests;
  }

  /**
   * Генерировать квесты из focus points (high priority)
   */
  private generateFromFocus(input: QuestGenerationInput): GeneratedQuestData[] {
    const rule = this.questRules.focus_weekly;
    const quests: GeneratedQuestData[] = [];
    const maxQuests = rule.maxQuests || 3;

    // Фильтруем только high priority focus
    const highPriorityFocus = input.focus
      .filter((f) => f.priority === 'high' && f.area)
      .slice(0, maxQuests);

    for (const focusItem of highPriorityFocus) {
      const criteria: QuestCriteria = {
        type: rule.criteriaType,
        target: rule.target,
        description: `Выполнить ${rule.target} действий, связанных с "${focusItem.area}"`,
      };

      const reward: QuestReward = {
        xp: rule.xp,
        skill_xp: rule.skillXp,
      };

      quests.push({
        title: `Фокус: ${focusItem.area}`,
        description: `Сосредоточиться на развитии области "${focusItem.area}" в течение недели.`,
        type: rule.type,
        criteria,
        reward,
        tags: ['auto-generated', 'focus'],
      });
    }

    return quests;
  }

  /**
   * Генерировать квест из главной темы
   */
  private generateFromThemes(input: QuestGenerationInput): GeneratedQuestData[] {
    const rule = this.questRules.theme_story;
    const quests: GeneratedQuestData[] = [];

    // Берем только первую тему
    if (input.themes.length === 0) {
      return quests;
    }

    const mainTheme = input.themes[0];

    const criteria: QuestCriteria = {
      type: rule.criteriaType,
      description: `Создать 3 записи-рефлексии на тему "${mainTheme}"`,
    };

    const reward: QuestReward = {
      xp: rule.xp,
    };

    quests.push({
      title: `Исследовать тему: ${mainTheme}`,
      description: `Глубже изучить тему "${mainTheme}" через рефлексию и практику.`,
      type: rule.type,
      criteria,
      reward,
      tags: ['auto-generated', 'theme'],
    });

    return quests;
  }

  /**
   * Получить правило для типа квеста
   */
  getRule(ruleKey: string): QuestRule | undefined {
    return this.questRules[ruleKey];
  }

  /**
   * Вычислить награду для квеста на основе типа и сложности
   */
  calculateReward(
    questType: 'micro' | 'weekly' | 'story' | 'in-person',
    nodeLevel?: 'basic' | 'mid' | 'advanced' | 'master',
  ): QuestReward {
    const baseRewards: Record<string, { xp: number; skillXp: number }> = {
      micro: { xp: 100, skillXp: 50 },
      weekly: { xp: 200, skillXp: 100 },
      story: { xp: 300, skillXp: 150 },
      'in-person': { xp: 500, skillXp: 250 },
    };

    const base = baseRewards[questType] || { xp: 100, skillXp: 50 };

    // Множитель сложности
    const levelMultiplier: Record<string, number> = {
      basic: 1.0,
      mid: 1.2,
      advanced: 1.5,
      master: 2.0,
    };

    const multiplier = nodeLevel ? levelMultiplier[nodeLevel] || 1.0 : 1.0;

    return {
      xp: Math.round(base.xp * multiplier),
      skill_xp: Math.round(base.skillXp * multiplier),
    };
  }

  /**
   * Определить тип квеста на основе контекста
   */
  determineQuestType(
    source: 'ability' | 'focus' | 'theme' | 'pattern',
    priority?: 'high' | 'medium' | 'low',
  ): 'micro' | 'weekly' | 'story' | 'in-person' {
    if (source === 'ability') {
      return 'micro';
    }
    if (source === 'focus' && priority === 'high') {
      return 'weekly';
    }
    if (source === 'theme') {
      return 'story';
    }
    return 'micro'; // По умолчанию
  }
}

