import { parseISO } from 'date-fns';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
  DEFAULT_TIME_ZONE,
  isMutationAllowed,
  localDateKey,
  resolveTimeZone,
  type SectionKind,
} from '../../shared/time';
import { getMockDays } from '../data/mockData';
import type {
  DayRecord,
  HappenedRecord,
  JournalEntry,
  SectionPayload,
  TargetRecord,
} from '../types';
import { legacyEntryToHappened } from '../utils/section';
import { firebaseAuth, firebaseFunctions, firestore } from './firebase';

const daysKey = (uid: string) => `daymark:days:v2:${uid}`;

export class PermissionError extends Error {
  constructor(kind: SectionKind) {
    super(
      kind === 'target'
        ? 'This target is locked. Past targets cannot be changed.'
        : 'HAPPENED unlocks at 12:00 AM the day after the date.',
    );
    this.name = 'PermissionError';
  }
}

export interface DayServiceOptions {
  userTimeZone: string;
  /** Authoritative instant (ISO) supplied by the server clock, never the device clock. */
  serverNow: string;
  /** Frozen timezone of the day (from its existing target), when one exists. */
  dayTimeZone?: string;
}

export interface ServerClock {
  now: string;
  todayKey: string;
  timeZone: string;
}

function cloudReady(): boolean {
  return Boolean(firebaseFunctions && firebaseAuth?.currentUser && firestore);
}

async function callFunction<T>(name: string, data: unknown): Promise<T> {
  if (!firebaseFunctions) throw new Error('Cloud Functions are unavailable.');
  const callable = httpsCallable<unknown, T>(firebaseFunctions, name);
  const result = await callable(data);
  return result.data;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidDayRecord(value: unknown): value is DayRecord {
  if (!isObject(value) || typeof value.date !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return false;
  return (
    (value.target === null || (isObject(value.target) && value.target.kind === 'target')) &&
    (value.happened === null || (isObject(value.happened) && value.happened.kind === 'happened'))
  );
}

function isLegacyEntry(value: unknown): value is JournalEntry {
  return (
    isObject(value) &&
    typeof value.date === 'string' &&
    typeof value.title === 'string' &&
    typeof value.summary === 'string' &&
    Array.isArray(value.activities) &&
    value.activities.every(
      (activity) =>
        isObject(activity) &&
        Array.isArray(activity.topics) &&
        Array.isArray(activity.problems) &&
        Array.isArray(activity.links),
    ) &&
    isObject(value.reflection)
  );
}

function readLocalDays(uid: string): DayRecord[] {
  try {
    const raw = localStorage.getItem(daysKey(uid));
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every(isValidDayRecord)) return parsed;
    }
  } catch {
    // Fall through to legacy migration / demo seed if storage is corrupt.
  }

  // Migrate only entries the user actually saved in Phase 1. Presence of the
  // legacy key matters: an intentionally emptied journal must stay empty.
  const legacyKey = `daymark:entries:v1:${uid}`;
  let legacyRaw: string | null = null;
  let parsedLegacy: unknown = null;
  try {
    legacyRaw = localStorage.getItem(legacyKey);
    if (legacyRaw !== null) parsedLegacy = JSON.parse(legacyRaw);
  } catch {
    parsedLegacy = null;
  }
  const hasLegacyData = legacyRaw !== null && Array.isArray(parsedLegacy);

  // A one-time upgrade must never produce two records for the same date. Keep
  // the most recently updated entry when duplicates exist.
  const byDate = new Map<string, JournalEntry>();
  if (hasLegacyData) {
    for (const candidate of parsedLegacy as unknown[]) {
      if (!isLegacyEntry(candidate)) continue;
      const previous = byDate.get(candidate.date);
      if (!previous || String(candidate.updatedAt ?? '') >= String(previous.updatedAt ?? '')) {
        byDate.set(candidate.date, candidate);
      }
    }
  }

  const migrated: DayRecord[] = [];
  if (hasLegacyData) {
    for (const entry of byDate.values()) {
      try {
        migrated.push({
          date: entry.date,
          target: null,
          happened: legacyEntryToHappened(entry, DEFAULT_TIME_ZONE),
        });
      } catch {
        // Skip a single malformed entry rather than losing the whole journal.
      }
    }
  } else {
    migrated.push(...getMockDays());
  }

  localStorage.setItem(daysKey(uid), JSON.stringify(migrated));
  return migrated;
}

function writeLocalDays(uid: string, days: DayRecord[]): void {
  localStorage.setItem(daysKey(uid), JSON.stringify(days));
}

export async function loadDays(uid: string): Promise<DayRecord[]> {
  if (cloudReady() && firestore) {
    const snapshot = await getDocs(collection(firestore, 'users', uid, 'days'));
    const days: DayRecord[] = [];

    for (const dayDocument of snapshot.docs) {
      const date = dayDocument.id;
      const [targetSnapshot, happenedSnapshot] = await Promise.all([
        getDoc(doc(firestore, 'users', uid, 'days', date, 'target')),
        getDoc(doc(firestore, 'users', uid, 'days', date, 'happened')),
      ]);
      days.push({
        date,
        target: targetSnapshot.exists() ? (targetSnapshot.data() as TargetRecord) : null,
        happened: happenedSnapshot.exists() ? (happenedSnapshot.data() as HappenedRecord) : null,
      });
    }

    return days.sort((a, b) => b.date.localeCompare(a.date));
  }

  return readLocalDays(uid);
}

/** Authoritative server clock. Local mode is demo-only and has no security guarantees. */
export async function getServerClock(userTimeZone: string): Promise<ServerClock> {
  if (cloudReady()) {
    return callFunction<ServerClock>('getServerTime', { timeZone: userTimeZone });
  }
  const now = new Date();
  const zone = resolveTimeZone(userTimeZone);
  return {
    now: now.toISOString(),
    todayKey: localDateKey(now, zone),
    timeZone: zone,
  };
}

function assertLocalPermission(
  kind: SectionKind,
  date: string,
  existing: TargetRecord | HappenedRecord | null | undefined,
  options: DayServiceOptions,
  action: 'save' | 'delete',
): void {
  const allowed = isMutationAllowed({
    kind,
    date,
    now: parseISO(options.serverNow),
    recordTimeZone: existing?.timeZone || options.dayTimeZone,
    userTimeZone: options.userTimeZone || DEFAULT_TIME_ZONE,
    action,
  });
  if (!allowed) throw new PermissionError(kind);
}

function frozenZone(
  existing: TargetRecord | HappenedRecord | null | undefined,
  options: DayServiceOptions,
): string {
  return resolveTimeZone(existing?.timeZone || options.dayTimeZone || options.userTimeZone);
}

function upsertDay(
  days: DayRecord[],
  date: string,
  kind: SectionKind,
  record: TargetRecord | HappenedRecord | null,
): DayRecord[] {
  if (!days.some((day) => day.date === date)) {
    days.push({ date, target: null, happened: null });
  }
  return days.map((day) => (day.date === date ? { ...day, [kind]: record } : day));
}

export async function saveTarget(
  uid: string,
  date: string,
  payload: SectionPayload<TargetRecord>,
  options: DayServiceOptions,
): Promise<TargetRecord> {
  if (cloudReady()) {
    return callFunction<TargetRecord>('saveTarget', {
      date,
      payload,
      timeZone: options.userTimeZone,
    });
  }

  const days = readLocalDays(uid);
  const day = days.find((item) => item.date === date);
  const existing = day?.target;
  assertLocalPermission('target', date, existing, options, 'save');

  const now = options.serverNow;
  const zone = frozenZone(existing ?? day?.happened, options);
  const record: TargetRecord = existing
    ? { ...existing, ...payload, date, updatedAt: now }
    : {
        kind: 'target',
        ...payload,
        date,
        timeZone: zone,
        createdAt: now,
        updatedAt: now,
      };

  writeLocalDays(uid, upsertDay(days, date, 'target', record));
  return record;
}

export async function saveHappened(
  uid: string,
  date: string,
  payload: SectionPayload<HappenedRecord>,
  options: DayServiceOptions,
): Promise<HappenedRecord> {
  if (cloudReady()) {
    return callFunction<HappenedRecord>('saveHappened', {
      date,
      payload,
      timeZone: options.userTimeZone,
    });
  }

  const days = readLocalDays(uid);
  const day = days.find((item) => item.date === date);
  const existing = day?.happened;
  assertLocalPermission('happened', date, existing, options, 'save');

  const now = options.serverNow;
  const zone = frozenZone(existing ?? day?.target, options);
  const record: HappenedRecord = existing
    ? { ...existing, ...payload, date, updatedAt: now }
    : {
        kind: 'happened',
        ...payload,
        date,
        timeZone: zone,
        createdAt: now,
        updatedAt: now,
      };

  writeLocalDays(uid, upsertDay(days, date, 'happened', record));
  return record;
}

export async function deleteSection(
  uid: string,
  date: string,
  kind: SectionKind,
  options: DayServiceOptions,
): Promise<void> {
  if (cloudReady()) {
    await callFunction<{ ok: true }>(kind === 'target' ? 'deleteTarget' : 'deleteHappened', {
      date,
    });
    return;
  }

  const days = readLocalDays(uid);
  const day = days.find((item) => item.date === date);
  const existing = day?.[kind];
  assertLocalPermission(kind, date, existing, options, 'delete');
  writeLocalDays(uid, upsertDay(days, date, kind, null));
}

const draftKey = (uid: string, date: string, kind: SectionKind) =>
  `daymark:draft:v2:${kind}:${date}:${uid}`;

export function saveSectionDraft<T extends TargetRecord | HappenedRecord>(
  uid: string,
  date: string,
  kind: SectionKind,
  record: T,
): void {
  localStorage.setItem(draftKey(uid, date, kind), JSON.stringify(record));
}

export function loadSectionDraft<T extends TargetRecord | HappenedRecord>(
  uid: string,
  date: string,
  kind: SectionKind,
): T | null {
  try {
    const raw = localStorage.getItem(draftKey(uid, date, kind));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearSectionDraft(uid: string, date: string, kind: SectionKind): void {
  localStorage.removeItem(draftKey(uid, date, kind));
}

/** Direct Firestore read for a single day (read-only from the client). */
export async function readDayDocument(uid: string, date: string, kind: SectionKind) {
  if (!firestore) return null;
  const snapshot = await getDoc(doc(firestore, 'users', uid, 'days', date, kind));
  return snapshot.exists() ? (snapshot.data() as TargetRecord | HappenedRecord) : null;
}
