import { z } from 'zod';
import { QuestTypeSchema, QuestStatusSchema, QuestCriteriaSchema, QuestRewardSchema } from './quest.schema';
import { EntryTypeSchema, EntrySourceSchema, CreateEntrySchema } from './entry.schema';

/**
 * Shared API types for Leadership Architect
 * These types are used across frontend and backend
 * Single source of truth for API contracts
 */

// Re-export Entry schemas to make them available from this file
export { EntryTypeSchema, EntrySourceSchema, CreateEntrySchema };

// ============================================
// User Types
// ============================================
export const UserRoleSchema = z.enum(['user', 'admin', 'api']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(['active', 'blocked', 'deleted']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const SubscriptionPlanSchema = z.enum(['free', 'basic', 'premium']);
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  telegramUsername: z.string(),
  email: z.string().email().optional().nullable(),
  role: UserRoleSchema.default('user'),
  status: UserStatusSchema.default('active'),
  subscription_plan: SubscriptionPlanSchema.default('free'),
  subscription_expires_at: z.string().datetime().optional().nullable(),
  is_verified: z.boolean().default(false),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  last_seen_at: z.string().datetime().optional().nullable(),
});
export type User = z.infer<typeof UserSchema>;

// Simplified user for API responses
export const UserSummarySchema = z.object({
  id: z.string().uuid(),
  telegramUsername: z.string(),
  role: UserRoleSchema,
});
export type UserSummary = z.infer<typeof UserSummarySchema>;

// ============================================
// Entry Types (imported from entry.schema.ts to avoid duplication)
// ============================================
export type EntryType = z.infer<typeof EntryTypeSchema>;
export type EntrySource = z.infer<typeof EntrySourceSchema>;
export type CreateEntryInput = z.infer<typeof CreateEntrySchema>;

export const EntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(), // Optional for response (not always included)
  type: EntryTypeSchema,
  source: EntrySourceSchema,
  text: z.string(),
  participants: z.array(z.string()).optional(),
  context_json: z.any().optional(),
  tags: z.array(z.string()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Entry = z.infer<typeof EntrySchema>;

// ============================================
// Session Types
// ============================================
export const SessionStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const AbilitySignalSchema = z.object({
  node_id: z.string(),
  signal: z.enum(['positive', 'negative', 'neutral']),
  strength: z.number().min(0).max(1).optional(),
  reason: z.string().optional(),
});
export type AbilitySignal = z.infer<typeof AbilitySignalSchema>;

export const SessionInsightSchema = z.object({
  text: z.string(),
  category: z.string().optional(),
  importance: z.enum(['low', 'medium', 'high']).optional(),
});
export type SessionInsight = z.infer<typeof SessionInsightSchema>;

export const SessionFocusSchema = z.object({
  node_id: z.string(),
  reason: z.string(),
  priority: z.number().min(1).max(10).optional(),
});
export type SessionFocus = z.infer<typeof SessionFocusSchema>;

export const SessionSchema = z.object({
  id: z.string().uuid(),
  entry_id: z.string().uuid(),
  summary: z.string(),
  insights_json: z.array(SessionInsightSchema).optional(),
  focus_json: z.array(SessionFocusSchema).optional(),
  themes: z.array(z.string()).optional(),
  patterns: z.array(z.string()).optional(),
  tensions: z.array(z.string()).optional(),
  ability_signals_json: z.array(AbilitySignalSchema).optional(),
  status: SessionStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Session = z.infer<typeof SessionSchema>;

// ============================================
// Quest Types (using existing schemas)
// ============================================
export const QuestStepSchema = z.union([
  // Simple string step
  z.string(),
  // Object step with id and description
  z.object({
    id: z.string(),
    description: z.string(),
    completed: z.boolean().optional(),
  }),
]);
export type QuestStep = z.infer<typeof QuestStepSchema>;

export const QuestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: QuestTypeSchema,
  status: QuestStatusSchema,
  steps: z.array(QuestStepSchema).optional(),
  criteria: QuestCriteriaSchema.optional(),
  reward: QuestRewardSchema.optional(),
  linked_nodes: z.array(z.string()),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  session_id: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  completed_at: z.string().datetime().optional().nullable(),
});
export type Quest = z.infer<typeof QuestSchema>;

// ============================================
// Evidence Types
// ============================================
export const EvidenceTypeSchema = z.enum(['reflection', 'observation', 'feedback', 'artifact']);
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;

export const EvidenceSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  type: EvidenceTypeSchema,
  text: z.string(),
  quest_id: z.string().uuid().optional().nullable(),
  ability_node_id: z.string().optional().nullable(),
  session_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const CreateEvidenceSchema = z.object({
  type: EvidenceTypeSchema,
  text: z.string().min(1).max(50000),
  quest_id: z.string().uuid().optional(),
  ability_node_id: z.string().optional(),
  session_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});
export type CreateEvidenceInput = z.infer<typeof CreateEvidenceSchema>;

// ============================================
// Semantic Tree Types
// ============================================
export const AbilityNodeStateSchema = z.enum(['locked', 'available', 'active', 'unlocked', 'integrated']);
export type AbilityNodeState = z.infer<typeof AbilityNodeStateSchema>;

export const IntegrationLevelSchema = z.enum(['Novice', 'Integrated', 'Embodied']);
export type IntegrationLevel = z.infer<typeof IntegrationLevelSchema>;

export const AbilityNodeSchema = z.object({
  node_id: z.string(),
  branch_id: z.string(),
  tier: z.enum(['basic', 'intermediate', 'advanced', 'master']),
  name: z.string().optional(), // From content (node-descriptions.json)
  description: z.string().optional(), // From content
  state: AbilityNodeStateSchema.optional(), // From user data
  integration_level: IntegrationLevelSchema.optional(),
  xp_required: z.number().default(100),
  xp_current: z.number().default(0), // From user data
  prerequisites: z.array(z.string()).default([]),
  unlock_conditions: z.any().optional(),
});
export type AbilityNode = z.infer<typeof AbilityNodeSchema>;

export const AbilityBranchSchema = z.object({
  branch_id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  color: z.string().default('#4A90E2'),
  icon: z.string().default('circle'),
});
export type AbilityBranch = z.infer<typeof AbilityBranchSchema>;

export const SemanticTreeEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.string().optional(),
});
export type SemanticTreeEdge = z.infer<typeof SemanticTreeEdgeSchema>;

export const SemanticTreeSchema = z.object({
  tree_id: z.string(),
  semantic_version: z.string().optional(),
  seed_version: z.number().optional(),
  tree_revision: z.number().default(1),
  branches: z.array(AbilityBranchSchema),
  nodes: z.array(AbilityNodeSchema),
  edges: z.array(SemanticTreeEdgeSchema).optional(),
});
export type SemanticTree = z.infer<typeof SemanticTreeSchema>;

// ============================================
// API Response Types
// ============================================
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number().optional(),
    limit: z.number().optional(),
  });

export const EntriesResponseSchema = z.object({
  entries: z.array(EntrySchema),
  total: z.number(),
});
export type EntriesResponse = z.infer<typeof EntriesResponseSchema>;

export const SessionsResponseSchema = z.object({
  sessions: z.array(SessionSchema),
  total: z.number(),
});
export type SessionsResponse = z.infer<typeof SessionsResponseSchema>;

export const QuestsResponseSchema = z.object({
  quests: z.array(QuestSchema),
  total: z.number(),
});
export type QuestsResponse = z.infer<typeof QuestsResponseSchema>;
