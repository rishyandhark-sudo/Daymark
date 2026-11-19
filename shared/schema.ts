/**
 * Payload validation shared by the web app and Cloud Functions.
 * The server always re-validates untrusted callable data with these schemas.
 */
import { z } from 'zod';
import {
  CATEGORIES,
  DIFFICULTIES,
  PROBLEM_STATUSES,
  PRIORITIES,
  REFLECTION_KEYS,
} from './domain';
import { isValidTimeZone } from './time';

export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date in YYYY-MM-DD format.')
  .refine((key) => {
    const parsed = new Date(`${key}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === key;
  }, 'Enter a real calendar date.');

export const timeZoneSchema = z
  .string()
  .refine(isValidTimeZone, 'Choose a valid IANA timezone.');

const problemSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().max(200),
  platform: z.string().max(80),
  url: z.string().max(500),
  difficulty: z.enum(DIFFICULTIES),
  status: z.enum(PROBLEM_STATUSES),
});

const activitySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Give each activity a name.'),
  category: z.enum(CATEGORIES),
  description: z.string().max(1200),
  topics: z.array(z.string().max(80)).max(30),
  minutes: z
    .number()
    .int('Time must be a whole number of minutes.')
    .min(0, 'Time invested cannot be negative.')
    .max(1440, 'Time cannot exceed 24 hours.'),
  problems: z.array(problemSchema).max(100),
  links: z.array(z.string().max(500)).max(30),
});

export const targetPayloadSchema = z.object({
  title: z.string().max(120, 'Keep the title under 120 characters.'),
  description: z.string().max(600, 'Keep the description under 600 characters.'),
  activities: activitySchema
    .extend({ priority: z.union([z.enum(PRIORITIES), z.literal('')]) })
    .array()
    .max(100),
});

export const happenedPayloadSchema = z.object({
  title: z.string().max(120, 'Keep the title under 120 characters.'),
  description: z.string().max(600, 'Keep the description under 600 characters.'),
  activities: activitySchema
    .extend({ linkedTargetActivityId: z.string().max(200).nullable() })
    .array()
    .max(100),
  reflection: z.object(
    Object.fromEntries(REFLECTION_KEYS.map((key) => [key, z.string().max(2000)])) as Record<
      (typeof REFLECTION_KEYS)[number],
      z.ZodString
    >,
  ),
});

export type TargetPayload = z.infer<typeof targetPayloadSchema>;
export type HappenedPayload = z.infer<typeof happenedPayloadSchema>;

export function validatePayload(kind: 'target' | 'happened', payload: unknown): string | null {
  const result = (kind === 'target' ? targetPayloadSchema : happenedPayloadSchema).safeParse(
    payload,
  );
  if (result.success) return null;
  return result.error.issues[0]?.message ?? 'Please check this section.';
}
