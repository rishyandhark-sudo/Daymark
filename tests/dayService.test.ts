import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deleteSection,
  loadDays,
  PermissionError,
  saveHappened,
  saveTarget,
  type DayServiceOptions,
} from '../src/services/dayService';
import type { JournalEntry, SectionPayload, HappenedRecord, TargetRecord } from '../src/types';
import { DEFAULT_TIME_ZONE } from '../shared/time';

class MemoryStorage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  clear() {
    this.values.clear();
  }
}

const targetPayload = (title = 'Plan'): SectionPayload<TargetRecord> => ({
  title,
  description: '',
  activities: [],
});

const happenedPayload = (title = 'Actual'): SectionPayload<HappenedRecord> => ({
  title,
  description: '',
  activities: [],
  reflection: {
    accomplished: '',
    learned: '',
    challenges: '',
    improve: '',
    tomorrow: '',
  },
});

const options = (serverNow: string, userTimeZone = 'UTC'): DayServiceOptions => ({
  serverNow,
  userTimeZone,
});

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage());
  // Seed an empty day set so demo records do not obscure the tests.
  localStorage.setItem('daymark:days:v2:u1', '[]');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('local demo service permissions', () => {
  const now = '2026-01-10T06:00:00.000Z'; // 2026-01-10 in UTC

  it('saves future and current targets but rejects past targets', async () => {
    const future = await saveTarget('u1', '2026-01-12', targetPayload(), options(now));
    expect(future.date).toBe('2026-01-12');
    expect(future.timeZone).toBe('UTC');

    const today = await saveTarget('u1', '2026-01-10', targetPayload('Today'), options(now));
    expect(today.date).toBe('2026-01-10');

    await expect(
      saveTarget('u1', '2026-01-09', targetPayload(), options(now)),
    ).rejects.toBeInstanceOf(PermissionError);
  });

  it('rejects HAPPENED for today and future, allows it for past dates', async () => {
    await expect(
      saveHappened('u1', '2026-01-10', happenedPayload(), options(now)),
    ).rejects.toBeInstanceOf(PermissionError);
    await expect(
      saveHappened('u1', '2026-01-11', happenedPayload(), options(now)),
    ).rejects.toBeInstanceOf(PermissionError);

    const past = await saveHappened('u1', '2026-01-09', happenedPayload(), options(now));
    expect(past.kind).toBe('happened');
    expect(past.timeZone).toBe('UTC');
  });

  it('guards deletes with the same rules', async () => {
    await expect(deleteSection('u1', '2026-01-09', 'target', options(now))).rejects.toBeInstanceOf(
      PermissionError,
    );
    await expect(deleteSection('u1', '2026-01-10', 'happened', options(now))).rejects.toBeInstanceOf(
      PermissionError,
    );

    await saveTarget('u1', '2026-01-11', targetPayload(), options(now));
    await deleteSection('u1', '2026-01-11', 'target', options(now));
    const days = await loadDays('u1');
    expect(days.find((day) => day.date === '2026-01-11')?.target).toBeNull();
  });

  it('never unlocks a record when the profile timezone changes', async () => {
    await saveTarget(
      'u1',
      '2026-01-01',
      targetPayload(),
      options('2026-01-01T12:00:00.000Z', 'Asia/Kolkata'),
    );

    // In UTC this instant is still 2026-01-01, but the record is frozen in Kolkata
    // where the local date has already rolled over to 2026-01-02.
    await expect(
      saveTarget('u1', '2026-01-01', targetPayload('Changed'), options('2026-01-01T18:30:01.000Z', 'UTC')),
    ).rejects.toBeInstanceOf(PermissionError);
  });

  it('freezes the day timezone from TARGET for a new HAPPENED record', async () => {
    // At 18:30:01Z it is already 2026-01-02 in Kolkata but still 2026-01-01 in New York.
    const instant = '2026-01-01T18:30:01.000Z';
    await saveTarget(
      'u1',
      '2026-01-01',
      targetPayload(),
      options('2026-01-01T12:00:00.000Z', 'Asia/Kolkata'),
    );

    // Without the day's frozen timezone, a changed profile setting would wrongly lock it.
    await expect(
      saveHappened('u1', '2026-01-01', happenedPayload(), options(instant, 'America/New_York')),
    ).rejects.toBeInstanceOf(PermissionError);

    await expect(
      saveHappened('u1', '2026-01-01', happenedPayload('Actual'), {
        ...options(instant, 'America/New_York'),
        dayTimeZone: 'Asia/Kolkata',
      }),
    ).resolves.toMatchObject({ date: '2026-01-01', timeZone: 'Asia/Kolkata', title: 'Actual' });
  });

  it('keeps TARGET and HAPPENED as independent records', async () => {
    await saveTarget('u1', '2026-01-09', targetPayload(), options('2026-01-08T12:00:00.000Z'));
    await saveHappened('u1', '2026-01-09', happenedPayload(), options(now));

    const day = (await loadDays('u1')).find((item) => item.date === '2026-01-09');
    expect(day?.target?.title).toBe('Plan');
    expect(day?.happened?.title).toBe('Actual');
  });
});

const legacyEntry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
  id: 'legacy-1',
  userId: 'u1',
  date: '2026-01-05',
  title: 'Old work',
  summary: 'Old summary',
  activities: [
    {
      id: 'legacy-activity',
      name: 'Practice',
      category: 'DSA',
      description: 'Description',
      topics: ['arrays'],
      minutes: 45,
      problems: [
        {
          id: 'legacy-problem',
          name: 'Two Sum',
          platform: 'LeetCode',
          url: '',
          difficulty: 'Easy',
          status: 'Solved',
        },
      ],
      links: ['https://example.com'],
    },
  ],
  reflection: {
    accomplished: 'A',
    learned: 'L',
    challenges: 'C',
    improve: 'I',
    tomorrow: 'T',
  },
  createdAt: '2026-01-05T10:00:00.000Z',
  updatedAt: '2026-01-05T11:00:00.000Z',
  ...overrides,
});

function seedLegacy(entries: unknown[]): void {
  localStorage.removeItem('daymark:days:v2:u1');
  localStorage.setItem('daymark:entries:v1:u1', JSON.stringify(entries));
}

describe('legacy v1 migration', () => {
  it('migrates entries to HAPPENED only with the default timezone, inventing no target', async () => {
    const entry = legacyEntry();
    seedLegacy([entry]);

    const days = await loadDays('u1');
    expect(days).toHaveLength(1);
    expect(days[0].date).toBe('2026-01-05');
    expect(days[0].target).toBeNull();
    expect(days[0].happened).toMatchObject({
      kind: 'happened',
      date: '2026-01-05',
      title: 'Old work',
      description: 'Old summary',
      timeZone: DEFAULT_TIME_ZONE,
      reflection: entry.reflection,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
    expect(days[0].happened?.activities[0]).toMatchObject({
      minutes: 45,
      linkedTargetActivityId: null,
    });

    // The migrated result is persisted so the migration runs only once.
    expect(JSON.parse(localStorage.getItem('daymark:days:v2:u1') ?? 'null')).toEqual(days);
  });

  it('keeps an intentionally emptied legacy journal empty', async () => {
    seedLegacy([]);

    const days = await loadDays('u1');
    expect(days).toEqual([]);
    expect(localStorage.getItem('daymark:days:v2:u1')).toBe('[]');
  });

  it('skips malformed legacy entries without losing valid ones', async () => {
    seedLegacy([
      legacyEntry(),
      { date: '2026-01-06', title: 'Missing arrays and reflection' },
    ]);

    const days = await loadDays('u1');
    expect(days).toHaveLength(1);
    expect(days[0].date).toBe('2026-01-05');
  });

  it('deduplicates legacy dates, keeping the most recently updated entry', async () => {
    seedLegacy([
      legacyEntry({ title: 'Older', updatedAt: '2026-01-05T09:00:00.000Z' }),
      legacyEntry({ title: 'Newer', updatedAt: '2026-01-05T12:00:00.000Z' }),
    ]);

    const days = await loadDays('u1');
    expect(days).toHaveLength(1);
    expect(days[0].happened?.title).toBe('Newer');
  });

  it('falls back to migration when v2 data is corrupt', async () => {
    seedLegacy([legacyEntry()]);
    localStorage.setItem('daymark:days:v2:u1', '[null]');

    const days = await loadDays('u1');
    expect(days).toHaveLength(1);
    expect(days[0].happened?.title).toBe('Old work');
  });

  it('falls back to migration when a v2 record has an invalid section shape', async () => {
    seedLegacy([legacyEntry()]);
    localStorage.setItem(
      'daymark:days:v2:u1',
      JSON.stringify([{ date: '2026-01-05', target: {}, happened: null }]),
    );

    const days = await loadDays('u1');
    expect(days).toHaveLength(1);
    expect(days[0].happened?.title).toBe('Old work');
  });

  it('seeds demo days only for a genuinely fresh install', async () => {
    localStorage.removeItem('daymark:days:v2:u1');
    localStorage.removeItem('daymark:entries:v1:u1');

    const days = await loadDays('u1');
    expect(days.length).toBeGreaterThan(0);
    expect(days.some((day) => day.target !== null)).toBe(true);
  });
});
