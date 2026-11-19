import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { localDateKey } from '../shared/time';
import { DEMO_PROFILE, getMockDays } from '../src/data/mockData';

describe('mock seed timezone consistency', () => {
  const originalTZ = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = 'UTC';
    vi.useFakeTimers();
    // 20:00Z is 2026-01-01 in UTC but already 2026-01-02 in Asia/Kolkata.
    vi.setSystemTime(new Date('2026-01-01T20:00:00.000Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
    if (originalTZ === undefined) delete process.env.TZ;
    else process.env.TZ = originalTZ;
  });

  it('derives every seed date key from the declared record timezone', () => {
    const days = getMockDays();
    expect(days.length).toBeGreaterThan(0);

    for (const day of days) {
      const section = day.target ?? day.happened;
      expect(section).not.toBeNull();
      expect(section!.timeZone).toBe(DEMO_PROFILE.timeZone);
      // createdAt is the exact instant used to derive this seed's date key.
      expect(localDateKey(new Date(section!.createdAt), DEMO_PROFILE.timeZone)).toBe(day.date);
      expect(day.target?.date ?? day.happened?.date).toBe(day.date);
    }
  });

  it('keys the future target by the declared timezone, not the device timezone', () => {
    const days = getMockDays();
    const future = days.find((day) => day.target?.title === 'Next session plan');
    expect(future).toBeDefined();
    // offset -2 -> 2026-01-03T20:00Z -> 2026-01-04 in Asia/Kolkata.
    expect(future!.date).toBe('2026-01-04');
  });
});
