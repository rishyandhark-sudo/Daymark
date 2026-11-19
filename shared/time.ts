/**
 * Shared, pure time and permission rules.
 * Used by the web app, the local demo store, Cloud Functions and the unit tests.
 * No client-only state (system clock, UI state) is trusted here: callers pass an
 * authoritative `now` and the timezone recorded with the record being checked.
 */

export const DEFAULT_TIME_ZONE = 'Asia/Kolkata';

export type SectionKind = 'target' | 'happened';

export interface SectionPermissions {
  target: boolean;
  happened: boolean;
}

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(timeZone: string | undefined | null): string {
  return timeZone && isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE;
}

const COMMON_TIME_ZONES = [
  DEFAULT_TIME_ZONE,
  'UTC',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Australia/Sydney',
];

/** IANA zones for the profile selector, with a fallback for older runtimes. */
export function timeZoneOptions(): string[] {
  const supported = (
    Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
  ).supportedValuesOf?.('timeZone');
  return supported?.length ? supported : COMMON_TIME_ZONES;
}

/** Local calendar date (YYYY-MM-DD) for an instant in the given IANA timezone. */
export function localDateKey(now: Date, timeZone: string): string {
  const zone = resolveTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

/**
 * TARGET is editable on its date and in the future.
 * HAPPENED is editable only once its date is in the past.
 */
export function sectionPermissions(date: string, todayKey: string): SectionPermissions {
  return {
    target: date >= todayKey,
    happened: date < todayKey,
  };
}

export interface MutationCheck {
  kind: SectionKind;
  date: string;
  now: Date;
  /** Timezone frozen on an existing record. Takes precedence over the user setting. */
  recordTimeZone?: string | null;
  /** Current user setting, used only when no record exists yet. */
  userTimeZone: string;
  action: 'save' | 'delete';
}

export interface AuthorizedMutation {
  allowed: boolean;
  /** Timezone that governed this decision (frozen record timezone wins). */
  timeZone: string;
  todayKey: string;
}

/**
 * Single authorization rule shared by Cloud Functions and the local demo store.
 * `now` must be an authoritative instant from the server; a client-supplied
 * clock is never read here. Returns false for every forbidden save/delete,
 * including direct API requests.
 */
export function authorizeMutation(check: MutationCheck): AuthorizedMutation {
  const timeZone = resolveTimeZone(check.recordTimeZone || check.userTimeZone);
  const todayKey = localDateKey(check.now, timeZone);
  return {
    allowed: sectionPermissions(check.date, todayKey)[check.kind],
    timeZone,
    todayKey,
  };
}

export function isMutationAllowed(check: MutationCheck): boolean {
  return authorizeMutation(check).allowed;
}

export function permissionReason(
  kind: SectionKind,
  editable: boolean,
): string {
  if (kind === 'target') {
    return editable
      ? 'Editable until 11:59 PM on this date'
      : 'Locked at 11:59 PM on this date';
  }
  return editable
    ? 'Past date · editable'
    : 'Opens at 12:00 AM the next day';
}
