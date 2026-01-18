import { z } from 'zod';

/**
 * QuestStep - шаг выполнения квеста
 * Поддерживает несколько форматов для обратной совместимости
 */
export const QuestStepSchema = z.union([
  // Новый формат: объект с order, title, description
  z.object({
    order: z.number().optional(),
    title: z.string().nullable().optional(),
    description: z.string(),
    completed: z.boolean().optional(),
    status: z.string().optional(),
    note: z.string().optional(),
  }),
  // Старый формат: объект с id, description
  z.object({
    id: z.string().optional(),
    description: z.string(),
    completed: z.boolean().optional(),
    status: z.string().optional(),
    note: z.string().optional(),
  }),
  // Простая строка
  z.string(),
]);

/**
 * QuestCriteria - критерии успеха квеста
 * Поддерживает несколько форматов для обратной совместимости
 */
export const QuestCriteriaSchema = z.object({
  type: z.enum(['count', 'evidence', 'streak', 'custom']),
  target: z.number().optional(),
  description: z.string().optional(),
  // Новое поле: массив критериев (items)
  items: z.array(z.string()).optional(),
  // Альтернативное поле: success_criteria (для совместимости с фронтендом)
  success_criteria: z.array(z.string()).optional(),
  // Теория и примеры
  theory_and_examples: z.union([
    z.string(), // Простая строка
    z.object({
      theory: z.string().optional(),
      examples: z.string().optional(),
    }),
  ]).optional(),
  // Гипотеза (опционально)
  hypothesis: z.string().optional(),
});

/**
 * QuestReward - награда за выполнение квеста
 * Новая система: Base XP + Reflection XP
 */
export const QuestRewardSchema = z.object({
  // Старые поля для обратной совместимости (deprecated)
  xp: z.number().optional(),
  skill_xp: z.number().optional(),
  // Новые поля
  base_xp: z.number().optional(),
  reflection_xp: z.number().optional(),
  max: z.number().optional(), // base_xp + reflection_xp
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

