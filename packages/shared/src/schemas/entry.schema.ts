import { z } from 'zod';

export const EntryTypeSchema = z.enum(['situation', 'reflection', 'feedback', 'voice', 'import']);
export const EntrySourceSchema = z.enum(['file', 'telegram', 'web']);

export const CreateEntrySchema = z.object({
  type: EntryTypeSchema,
  source: EntrySourceSchema,
  text: z.string().min(1).max(50000),
  participants: z.array(z.string()).max(20).optional(),
  context_json: z.any().optional(),
  file_ref: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export type CreateEntryInput = z.infer<typeof CreateEntrySchema>;

