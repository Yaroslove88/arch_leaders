import { z } from 'zod';

// Difficulty levels for cases
export const CaseDifficultySchema = z.enum(['basic', 'intermediate', 'advanced']);
export type CaseDifficulty = z.infer<typeof CaseDifficultySchema>;

// Indicator values for cases
export const IndicatorLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type IndicatorLevel = z.infer<typeof IndicatorLevelSchema>;

// Case indicators (situation context)
export const CaseIndicatorsSchema = z.object({
  trust: IndicatorLevelSchema.optional(),
  risk: IndicatorLevelSchema.optional(),
  time: IndicatorLevelSchema.optional(),
  chaos: IndicatorLevelSchema.optional(),
  autonomy: IndicatorLevelSchema.optional(),
  speed: IndicatorLevelSchema.optional(),
  quality: IndicatorLevelSchema.optional(),
  uncertainty: IndicatorLevelSchema.optional(),
  stakes: IndicatorLevelSchema.optional(),
});
export type CaseIndicators = z.infer<typeof CaseIndicatorsSchema>;

// Pattern for cases (trigger -> behavior -> result)
export const CasePatternSchema = z.object({
  trigger: z.string(),
  behavior: z.string(),
  result: z.string(),
});
export type CasePattern = z.infer<typeof CasePatternSchema>;

// Consequence structure (3 levels)
export const CaseConsequenceSchema = z.object({
  immediate: z.string(),
  second_order: z.string(),
  systemic: z.string(),
});
export type CaseConsequence = z.infer<typeof CaseConsequenceSchema>;

// SM Impact (system metrics)
export const SMImpactSchema = z.object({
  C: z.number().optional(), // Coherence
  K: z.number().optional(), // Capability
  R: z.number().optional(), // Resilience
  S: z.number().optional(), // Speed
  F: z.number().optional(), // Focus
});
export type SMImpact = z.infer<typeof SMImpactSchema>;

// Case option
export const CaseOptionSchema = z.object({
  id: z.string(), // A, B, C, D
  text: z.string(),
  skill_used: z.string().optional(),
  consequence: CaseConsequenceSchema,
  sm_impact: SMImpactSchema.optional(),
  hint: z.string().optional(),
  warning: z.string().optional(),
  explanation: z.string().optional(),
});
export type CaseOption = z.infer<typeof CaseOptionSchema>;

// Reflection section
export const CaseReflectionSchema = z.object({
  questions: z.array(z.string()),
  mirror: z.record(z.string(), z.string()).optional(),
  key_insight: z.string().optional(),
});
export type CaseReflection = z.infer<typeof CaseReflectionSchema>;

// Full Interactive Case
export const InteractiveCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  node_id: z.string().optional(),
  branch_id: z.string().optional(),
  difficulty: CaseDifficultySchema,
  context: z.string(),
  indicators: CaseIndicatorsSchema.optional(),
  pattern: CasePatternSchema.optional(),
  options: z.array(CaseOptionSchema),
  reflection: CaseReflectionSchema,
});
export type InteractiveCase = z.infer<typeof InteractiveCaseSchema>;

// Case progress for a node
export const NodeCaseProgressSchema = z.object({
  solved: z.array(z.string()),
  progress: z.number().min(0).max(100),
});
export type NodeCaseProgress = z.infer<typeof NodeCaseProgressSchema>;

// User's case progress (aggregate)
export const CaseProgressSchema = z.object({
  solvedCases: z.array(z.string()),
  nodeProgress: z.record(z.string(), NodeCaseProgressSchema),
});
export type CaseProgress = z.infer<typeof CaseProgressSchema>;

// Pattern analysis result
export const PatternAnalysisSchema = z.object({
  totalAttempts: z.number(),
  skillDistribution: z.record(z.string(), z.number()),
  mostUsedSkill: z.string(),
  insight: z.string(),
  recommendation: z.string().optional(),
});
export type PatternAnalysis = z.infer<typeof PatternAnalysisSchema>;

// Case availability check result
export const CaseAvailabilitySchema = z.object({
  available: z.boolean(),
  reason: z.string(),
  requirements: z.object({
    questsRequired: z.number(),
    questsCompleted: z.number(),
    progressRequired: z.number(),
    currentProgress: z.number(),
    nodeState: z.string(),
  }),
});
export type CaseAvailability = z.infer<typeof CaseAvailabilitySchema>;
