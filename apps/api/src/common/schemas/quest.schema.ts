import { z } from 'zod';

/**
 * QuestStep - шаг выполнения квеста
 */
export const QuestStepSchema = z.object({
  id: z.string(),
  description: z.string(),
  completed: z.boolean().optional(),
});

/**
 * QuestCriteria - критерии успеха квеста
 */
export const QuestCriteriaSchema = z.object({
  type: z.enum(['count', 'evidence', 'streak', 'custom']),
  target: z.number().optional(),
  description: z.string(),
  theory_and_examples: z.string().optional(),
});

/**
 * QuestReward - награда за выполнение квеста
 */
export const QuestRewardSchema = z.object({
  xp: z.number().optional(),
  skill_xp: z.number().optional(),
  artifact: z.string().optional(),
});

/**
 * Схемы для JSON полей Quest
 */
export const QuestStepsJsonSchema = z.array(QuestStepSchema);
export const QuestCriteriaJsonSchema = QuestCriteriaSchema;
export const QuestRewardJsonSchema = QuestRewardSchema.nullable().optional();

/**
 * Типы TypeScript из схем
 */
export type QuestStep = z.infer<typeof QuestStepSchema>;
export type QuestCriteria = z.infer<typeof QuestCriteriaSchema>;
export type QuestReward = z.infer<typeof QuestRewardSchema>;

