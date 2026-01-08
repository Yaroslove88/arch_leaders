import { z } from 'zod';
import {
  SessionInsightsJsonSchema,
  SessionFocusJsonSchema,
  SessionAbilitySignalsJsonSchema,
} from '../common/schemas/session.schema';

/**
 * Схема для валидации ответа анализа ситуации от LLM
 */
export const AnalysisResponseSchema = z.object({
  summary: z.string(),
  themes: z.array(z.string()),
  patterns: z.array(z.string()),
  tensions: z.array(z.string()),
  ability_signals: SessionAbilitySignalsJsonSchema,
  insights: SessionInsightsJsonSchema,
  focus: SessionFocusJsonSchema,
});

export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;

