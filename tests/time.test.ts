import { describe, expect, it } from 'vitest';
import {
  authorizeMutation,
  DEFAULT_TIME_ZONE,
  isMutationAllowed,
  isValidTimeZone,
  localDateKey,
  permissionReason,
  resolveTimeZone,
  sectionPermissions,
} from '../shared/time';

const KOLKATA = 'Asia/Kolkata';
const NEW_YORK = 'America/New_York';

describe('localDateKey', () => {
  it('uses the configured IANA timezone, not UTC', () => {
    const instant = new Date('2026-01-01T18:30:00.000Z');
    expect(localDateKey(instant, KOLKATA)).toBe('2026-01-02');
    expect(localDateKey(instant, 'UTC')).toBe('2026-01-01');
    expect(localDateKey(instant, NEW_YORK)).toBe('2026-01-01');
  });

  it('falls back to the default timezone for invalid input', () => {
    const instant = new Date('2026-01-01T18:30:00.000Z');
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
    expect(resolveTimeZone('Mars/Olympus')).toBe(DEFAULT_TIME_ZONE);
    expect(localDateKey(instant, 'Mars/Olympus')).toBe(localDateKey(instant, DEFAULT_TIME_ZONE));
  });
});

describe('sectionPermissions matrix', () => {
  it('allows target only for today and future, happened only for the past', () => {
    const today = '2026-01-10';
    expect(sectionPermissions('2026-01-09', today)).toEqual({ target: false, happened: true });
    expect(sectionPermissions('2026-01-10', today)).toEqual({ target: true, happened: false });
    expect(sectionPermissions('2026-01-11', today)).toEqual({ target: true, happened: false });
  });

  it('enforces the matrix for both save and delete through the shared authorizer', () => {
    const now = new Date('2026-01-10T06:00:00.000Z');
    const cases = [
      { date: '2026-01-09', target: false, happened: true },
      { date: '2026-01-10', target: true, happened: false },
      { date: '2026-01-11', target: true, happened: false },
    ];

    for (const entry of cases) {
      for (const action of ['save', 'delete'] as const) {
        expect(
          isMutationAllowed({
            kind: 'target',
            date: entry.date,
            now,
            userTimeZone: 'UTC',
            action,
          }),
        ).toBe(entry.target);
        expect(
          isMutationAllowed({
            kind: 'happened',
            date: entry.date,
            now,
            userTimeZone: 'UTC',
            action,
          }),
        ).toBe(entry.happened);
      }
    }
  });
});

describe('midnight transition', () => {
  it('locks TARGET and unlocks HAPPENED at the exact local midnight boundary', () => {
    const before = new Date('2026-01-01T18:29:59.000Z'); // 2026-01-01 23:59:59 IST
    const after = new Date('2026-01-01T18:30:00.000Z'); // 2026-01-02 00:00:00 IST
    const date = '2026-01-01';

    expect(localDateKey(before, KOLKATA)).toBe('2026-01-01');
    expect(localDateKey(after, KOLKATA)).toBe('2026-01-02');

    expect(
      sectionPermissions(date, localDateKey(before, KOLKATA)),
    ).toEqual({ target: true, happened: false });
    expect(
      sectionPermissions(date, localDateKey(after, KOLKATA)),
    ).toEqual({ target: false, happened: true });

    expect(
      isMutationAllowed({ kind: 'target', date, now: before, userTimeZone: KOLKATA, action: 'save' }),
    ).toBe(true);
    expect(
      isMutationAllowed({ kind: 'happened', date, now: before, userTimeZone: KOLKATA, action: 'save' }),
    ).toBe(false);
    expect(
      isMutationAllowed({ kind: 'target', date, now: after, userTimeZone: KOLKATA, action: 'save' }),
    ).toBe(false);
    expect(
      isMutationAllowed({ kind: 'happened', date, now: after, userTimeZone: KOLKATA, action: 'save' }),
    ).toBe(true);
  });
});

describe('frozen record timezone', () => {
  it('uses the record timezone even after the user changes their setting', () => {
    const now = new Date('2026-01-02T02:00:00.000Z');
    const date = '2026-01-01';

    // Without a frozen record, Kolkata sees 2026-01-02 and locks the target.
    expect(
      isMutationAllowed({ kind: 'target', date, now, userTimeZone: KOLKATA, action: 'save' }),
    ).toBe(false);

    // With the record's New York timezone, it is still 2026-01-01 there.
    expect(
      isMutationAllowed({
        kind: 'target',
        date,
        now,
        recordTimeZone: NEW_YORK,
        userTimeZone: KOLKATA,
        action: 'save',
      }),
    ).toBe(true);
  });

  it('reports the timezone and day key used for the decision', () => {
    const decision = authorizeMutation({
      kind: 'happened',
      date: '2026-01-01',
      now: new Date('2026-01-02T02:00:00.000Z'),
      recordTimeZone: NEW_YORK,
      userTimeZone: KOLKATA,
      action: 'save',
    });
    expect(decision.timeZone).toBe(NEW_YORK);
    expect(decision.todayKey).toBe('2026-01-01');
    expect(decision.allowed).toBe(false);
  });
});

describe('permissionReason', () => {
  it('describes both lock states', () => {
    expect(permissionReason('target', true)).toMatch(/Editable until 11:59/);
    expect(permissionReason('target', false)).toMatch(/Locked at 11:59/);
    expect(permissionReason('happened', true)).toMatch(/Past date/);
    expect(permissionReason('happened', false)).toMatch(/12:00 AM the next day/);
  });
});
