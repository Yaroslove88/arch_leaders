import { z } from 'zod';

/**
 * Insight - важное наблюдение из анализа
 */
export const InsightSchema = z.object({
  title: z.string(),
  description: z.string(),
});

/**
 * FocusPoint - зона для внимания
 */
export const FocusPointSchema = z.object({
  area: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
});

/**
 * AbilitySignal - сигнал проявления способности
 */
export const AbilitySignalSchema = z.object({
  node_id: z.string(),
  signal: z.string(),
});

/**
 * Схемы для JSON полей Session
 */
export const SessionInsightsJsonSchema = z.array(InsightSchema);
export const SessionFocusJsonSchema = z.array(FocusPointSchema);
export const SessionAbilitySignalsJsonSchema = z.array(AbilitySignalSchema);

/**
 * Типы TypeScript из схем
 */
export type Insight = z.infer<typeof InsightSchema>;
export type FocusPoint = z.infer<typeof FocusPointSchema>;
export type AbilitySignal = z.infer<typeof AbilitySignalSchema>;

