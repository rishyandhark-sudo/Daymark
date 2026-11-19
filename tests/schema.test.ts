import { describe, expect, it } from 'vitest';
import {
  dateKeySchema,
  happenedPayloadSchema,
  targetPayloadSchema,
  timeZoneSchema,
  validatePayload,
} from '../shared/schema';
import { blankHappenedActivity, blankTargetActivity } from '../src/utils/section';

const validTarget = () => ({
  title: 'DSA + Java',
  description: 'Finish sliding window.',
  activities: [
    {
      ...blankTargetActivity(),
      name: 'Array practice',
      minutes: 75,
      priority: 'High' as const,
      problems: [
        {
          id: 'p1',
          name: 'Two Sum',
          platform: 'LeetCode',
          url: '',
          difficulty: 'Easy' as const,
          status: 'Attempted' as const,
        },
      ],
    },
  ],
});

const validHappened = () => ({
  title: 'DSA + Java',
  description: 'Completed most of it.',
  activities: [
    {
      ...blankHappenedActivity(),
      name: 'Array practice',
      minutes: 60,
      linkedTargetActivityId: null as string | null,
    },
  ],
  reflection: {
    accomplished: 'Two problems solved',
    learned: 'Two pointers',
    challenges: '',
    improve: '',
    tomorrow: '',
  },
});

describe('payload validation', () => {
  it('accepts complete TARGET and HAPPENED payloads', () => {
    expect(targetPayloadSchema.safeParse(validTarget()).success).toBe(true);
    expect(happenedPayloadSchema.safeParse(validHappened()).success).toBe(true);
  });

  it('rejects invalid activities, durations and categories', () => {
    const noName = validTarget();
    noName.activities[0].name = '   ';
    expect(validatePayload('target', noName)).toMatch(/activity a name/i);

    const badMinutes = validTarget();
    badMinutes.activities[0].minutes = -5;
    expect(validatePayload('target', badMinutes)).toMatch(/negative/i);

    const badCategory = validTarget();
    badCategory.activities[0].category = 'Unknown' as never;
    expect(targetPayloadSchema.safeParse(badCategory).success).toBe(false);
  });

  it('never infers a target link from a similar title', () => {
    const record = validHappened();
    record.activities[0].name = validTarget().activities[0].name;
    const parsed = happenedPayloadSchema.parse(record);
    expect(parsed.activities[0].linkedTargetActivityId).toBeNull();
  });

  it('accepts explicit target links only as ids or null', () => {
    const linked = validHappened();
    linked.activities[0].linkedTargetActivityId = 'target-activity-1';
    expect(happenedPayloadSchema.safeParse(linked).success).toBe(true);

    const invalid = validHappened();
    invalid.activities[0].linkedTargetActivityId = 42 as never;
    expect(happenedPayloadSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects impossible dates and invalid timezones', () => {
    expect(dateKeySchema.safeParse('2026-01-01').success).toBe(true);
    expect(dateKeySchema.safeParse('2026-02-30').success).toBe(false);
    expect(dateKeySchema.safeParse('01-01-2026').success).toBe(false);
    expect(timeZoneSchema.safeParse('Asia/Kolkata').success).toBe(true);
    expect(timeZoneSchema.safeParse('Mars/Olympus').success).toBe(false);
  });
});
