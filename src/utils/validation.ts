import { z } from 'zod';
import { CATEGORIES, DIFFICULTIES, PROBLEM_STATUSES, type JournalEntry } from '../types';

const problemSchema = z.object({
  name: z.string(),
  platform: z.string(),
  url: z.string(),
  difficulty: z.enum(DIFFICULTIES),
  status: z.enum(PROBLEM_STATUSES),
});

const activitySchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Give each activity a name.'),
  category: z.enum(CATEGORIES),
  description: z.string(),
  topics: z.array(z.string()),
  minutes: z.number().int().min(0, 'Time invested cannot be negative.').max(1440),
  problems: z.array(problemSchema),
  links: z.array(z.string()),
});

export const entrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  title: z.string().trim().max(120, 'Keep the title under 120 characters.'),
  summary: z.string().max(600, 'Keep the summary under 600 characters.'),
  activities: z.array(activitySchema),
  reflection: z.object({
    accomplished: z.string(),
    learned: z.string(),
    challenges: z.string(),
    improve: z.string(),
    tomorrow: z.string(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export function validateEntry(entry: JournalEntry): string | null {
  const result = entrySchema.safeParse(entry);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? 'Please check this entry.';
}
