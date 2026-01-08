import { z } from 'zod';

export const QuestTypeSchema = z.enum(['micro', 'weekly', 'story', 'in-person']);
export const QuestStatusSchema = z.enum(['active', 'backlog', 'done', 'archived']);
export const QuestCriteriaTypeSchema = z.enum(['count', 'evidence', 'streak', 'custom']);

export const QuestCriteriaSchema = z.object({
  type: QuestCriteriaTypeSchema,
  target: z.number().int().positive().max(10000).optional(),
  description: z.string().min(1).max(1000).optional(),
  items: z.array(z.string()).optional(),
  theory_and_examples: z.string().max(50000).optional(), // Markdown текст с теорией и примерами
});

export const QuestRewardSchema = z.object({
  xp: z.number().int().min(0).max(100000).optional(),
  skill_xp: z.number().int().min(0).max(10000).optional(),
  artifact: z.string().max(200).optional(),
});

export const CreateQuestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  type: QuestTypeSchema,
  steps: z.array(z.any()).max(100).optional(),
  criteria: QuestCriteriaSchema,
  reward: QuestRewardSchema.optional(),
  linked_nodes: z.array(z.string()).max(10).optional(),
  evidence_links: z.array(z.any()).optional(),
  due_hint: z.string().max(500).optional(),
  source: z.string().max(200).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  session_id: z.string().uuid().optional(),
});

export type CreateQuestInput = z.infer<typeof CreateQuestSchema>;

