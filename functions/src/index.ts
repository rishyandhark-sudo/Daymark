import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, type DocumentSnapshot } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';
import {
  authorizeMutation,
  DEFAULT_TIME_ZONE,
  localDateKey,
  resolveTimeZone,
  type SectionKind,
} from '../../shared/time';
import {
  dateKeySchema,
  happenedPayloadSchema,
  targetPayloadSchema,
  timeZoneSchema,
} from '../../shared/schema';

initializeApp();
const db = getFirestore();

const saveInputSchema = z.object({
  date: dateKeySchema,
  payload: z.unknown(),
  timeZone: timeZoneSchema,
});
const deleteInputSchema = z.object({ date: dateKeySchema });

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpsError(
      'invalid-argument',
      result.error.issues[0]?.message ?? 'Invalid request data.',
    );
  }
  return result.data;
}

function requireUid(request: CallableRequest<unknown>): string {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in to change your journal.');
  }
  return request.auth.uid;
}

function storedZone(snapshot: DocumentSnapshot): string {
  if (!snapshot.exists) return '';
  const value = snapshot.data()?.timeZone;
  return typeof value === 'string' ? value : '';
}

function sectionRefs(uid: string, date: string) {
  return {
    target: db.doc(`users/${uid}/days/${date}/target`),
    happened: db.doc(`users/${uid}/days/${date}/happened`),
  };
}

function serialize(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      item instanceof Timestamp ? item.toDate().toISOString() : item,
    ]),
  );
}

function deniedMessage(kind: SectionKind): string {
  return kind === 'target'
    ? 'TARGET is locked: past dates are permanently read-only.'
    : 'HAPPENED unlocks at 12:00 AM on the following day.';
}

async function handleSave(
  uid: string,
  kind: SectionKind,
  request: CallableRequest<unknown>,
): Promise<Record<string, unknown>> {
  const input = parseOrThrow(saveInputSchema, request.data);
  const payload =
    kind === 'target'
      ? parseOrThrow(targetPayloadSchema, input.payload)
      : parseOrThrow(happenedPayloadSchema, input.payload);

  const refs = sectionRefs(uid, input.date);

  // The permission decision and the write share one transaction so a concurrent
  // save cannot change the frozen timezone between the read and the write.
  return db.runTransaction(async (transaction) => {
    const [target, happened] = await Promise.all([
      transaction.get(refs.target),
      transaction.get(refs.happened),
    ]);
    const existing = kind === 'target' ? target : happened;
    const other = kind === 'target' ? happened : target;

    // A frozen record timezone always wins. For a new record, the other section's
    // frozen timezone preserves the day's deadline when a profile setting changes.
    const frozenZone = storedZone(existing) || storedZone(other) || undefined;

    // Read the clock inside the transaction so retries re-evaluate the boundary.
    const now = new Date();
    const decision = authorizeMutation({
      kind,
      date: input.date,
      now,
      recordTimeZone: frozenZone,
      userTimeZone: input.timeZone,
      action: 'save',
    });
    if (!decision.allowed) throw new HttpsError('permission-denied', deniedMessage(kind));

    const timestamp = Timestamp.fromDate(now);
    const previous = existing.exists ? existing.data() ?? {} : {};
    const record = {
      kind,
      date: input.date,
      ...payload,
      timeZone: resolveTimeZone(frozenZone || input.timeZone),
      createdAt: previous.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    transaction.set(refs[kind], record);
    return serialize(record as Record<string, unknown>);
  });
}

async function handleDelete(
  uid: string,
  kind: SectionKind,
  request: CallableRequest<unknown>,
): Promise<{ ok: true }> {
  const { date } = parseOrThrow(deleteInputSchema, request.data);
  const refs = sectionRefs(uid, date);

  return db.runTransaction(async (transaction) => {
    const [target, happened] = await Promise.all([
      transaction.get(refs.target),
      transaction.get(refs.happened),
    ]);
    const existing = kind === 'target' ? target : happened;
    const other = kind === 'target' ? happened : target;
    const frozenZone = storedZone(existing) || storedZone(other) || undefined;
    const now = new Date();
    const decision = authorizeMutation({
      kind,
      date,
      now,
      recordTimeZone: frozenZone,
      userTimeZone: resolveTimeZone(frozenZone || DEFAULT_TIME_ZONE),
      action: 'delete',
    });
    if (!decision.allowed) throw new HttpsError('permission-denied', deniedMessage(kind));

    transaction.delete(refs[kind]);
    return { ok: true } as const;
  });
}

/** Authoritative clock: the client's device time is never used for permissions. */
export const getServerTime = onCall(async (request: CallableRequest<unknown>) => {
  requireUid(request);
  const input = z.object({ timeZone: z.string().optional() }).parse(request.data ?? {});
  const timeZone = input.timeZone
    ? parseOrThrow(timeZoneSchema, input.timeZone)
    : DEFAULT_TIME_ZONE;
  const now = new Date();
  return {
    now: now.toISOString(),
    todayKey: localDateKey(now, timeZone),
    timeZone,
  };
});

export const saveTarget = onCall(async (request: CallableRequest<unknown>) => {
  const uid = requireUid(request);
  return handleSave(uid, 'target', request);
});

export const deleteTarget = onCall(async (request: CallableRequest<unknown>) => {
  const uid = requireUid(request);
  return handleDelete(uid, 'target', request);
});

export const saveHappened = onCall(async (request: CallableRequest<unknown>) => {
  const uid = requireUid(request);
  return handleSave(uid, 'happened', request);
});

export const deleteHappened = onCall(async (request: CallableRequest<unknown>) => {
  const uid = requireUid(request);
  return handleDelete(uid, 'happened', request);
});
