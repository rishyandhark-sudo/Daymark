import { useEffect, useState } from 'react';
import { Check, Lock, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { permissionReason } from '../../../shared/time';
import { validatePayload } from '../../../shared/schema';
import type {
  HappenedRecord,
  SectionPayload,
  TargetActivity,
  TargetRecord,
} from '../../types';
import {
  clearSectionDraft,
  loadSectionDraft,
  saveSectionDraft,
} from '../../services/dayService';
import {
  blankHappenedRecord,
  blankTargetRecord,
  cloneHappened,
  cloneTarget,
} from '../../utils/section';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { HappenedEditor } from './HappenedEditor';
import { SectionSummary } from './SectionSummary';
import { TargetEditor } from './TargetEditor';

type SectionRecord = TargetRecord | HappenedRecord;
type DraftStatus = 'idle' | 'saving' | 'saved';

export function SectionPanel<T extends SectionRecord>({
  kind,
  date,
  uid,
  timeZone,
  record,
  editable,
  targetActivities = [],
  onSave,
  onDelete,
}: {
  kind: T['kind'];
  date: string;
  uid: string;
  timeZone: string;
  record: T | null;
  editable: boolean;
  targetActivities?: TargetActivity[];
  onSave: (payload: SectionPayload<T>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [mode, setMode] = useState<'view' | 'edit'>(record ? 'view' : 'edit');
  const [draft, setDraft] = useState<T | null>(null);
  const [storedDraft, setStoredDraft] = useState<T | null>(null);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('idle');
  const [draftTime, setDraftTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const clone = (value: T): T =>
    (kind === 'target' ? cloneTarget(value as TargetRecord) : cloneHappened(value as HappenedRecord)) as T;

  // Reset when the stored record changes (after save) or the lock state flips at midnight.
  useEffect(() => {
    const saved = record ? clone(record) : null;
    const previous = loadSectionDraft<T>(uid, date, kind);
    const newerDraft = previous && (!saved || previous.updatedAt > saved.updatedAt);

    setStoredDraft(newerDraft ? previous : null);
    setDraft(saved ?? (newerDraft ? previous : null));
    setMode(record ? 'view' : editable ? 'edit' : 'view');
    setError(null);
    setSavedFlash(false);
    setDraftStatus('idle');
    setDraftTime('');
    setSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, date, kind, record?.updatedAt, editable]);

  // Autosave a local draft while editing. This is a convenience, not a security boundary.
  useEffect(() => {
    if (!draft || mode !== 'edit') return;
    setDraftStatus('saving');
    const timer = window.setTimeout(() => {
      saveSectionDraft(uid, date, kind, draft);
      setDraftStatus('saved');
      setDraftTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 600);
    return () => window.clearTimeout(timer);
  }, [draft, mode, uid, date, kind]);

  const startEdit = () => {
    const base = record
      ? clone(record)
      : ((kind === 'target'
          ? blankTargetRecord(date, timeZone)
          : blankHappenedRecord(date, timeZone)) as T);
    setDraft(base);
    setStoredDraft(null);
    setMode('edit');
    setError(null);
    setSavedFlash(false);
    setDraftStatus('idle');
  };

  const cancelEdit = () => {
    clearSectionDraft(uid, date, kind);
    setStoredDraft(null);
    setError(null);
    if (record) {
      setDraft(clone(record));
      setMode('view');
    } else {
      const blank = (kind === 'target'
        ? blankTargetRecord(date, timeZone)
        : blankHappenedRecord(date, timeZone)) as T;
      setDraft(blank);
      setMode('view');
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    const payload = {
      title: draft.title,
      description: draft.description,
      activities: draft.activities,
      ...(kind === 'happened' ? { reflection: (draft as HappenedRecord).reflection } : {}),
    } as SectionPayload<T>;

    const validationError = validatePayload(kind, payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(payload);
      clearSectionDraft(uid, date, kind);
      setStoredDraft(null);
      setDraftStatus('idle');
      setSavedFlash(true);
      setMode('view');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this section.');
    } finally {
      setSaving(false);
    }
  };

  const restoreDraft = () => {
    if (!storedDraft) return;
    setDraft(clone(storedDraft));
    setStoredDraft(null);
    setMode(editable ? 'edit' : 'view');
    setError(null);
  };

  const discardDraft = () => {
    clearSectionDraft(uid, date, kind);
    setStoredDraft(null);
  };

  const title = kind === 'target' ? 'TARGET' : 'HAPPENED';
  const addLabel = kind === 'target' ? 'Add target' : 'Add happened';

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                kind === 'target' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {title}
            </span>
            <span className="text-[11px] text-slate-400">{permissionReason(kind, editable)}</span>
            {!editable && (
              <span
                className="inline-flex items-center gap-1 text-[11px] text-slate-400"
                title={permissionReason(kind, editable)}
              >
                <Lock size={12} strokeWidth={1.8} /> Locked
              </span>
            )}
          </div>

          {mode === 'view' ? (
            <div className="flex items-center gap-2">
              {savedFlash && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <Check size={12} strokeWidth={2} /> Saved
                </span>
              )}
              {editable && record && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmOpen(true)} aria-label={`Delete ${title}`}>
                    <Trash2 size={13} strokeWidth={1.8} />
                  </Button>
                  <Button size="sm" onClick={startEdit}>
                    <Pencil size={13} strokeWidth={1.8} /> Edit
                  </Button>
                </>
              )}
              {editable && !record && (
                <Button size="sm" variant="primary" onClick={startEdit}>
                  <Plus size={13} strokeWidth={2} /> {addLabel}
                </Button>
              )}
            </div>
          ) : null}
        </header>

        <div className="px-4 py-5 sm:px-5">
          {storedDraft && mode === 'view' && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-800">
              <span>Unsaved changes from last time.</span>
              <span className="flex gap-3">
                <button type="button" onClick={restoreDraft} className="font-semibold underline">
                  Restore
                </button>
                <button type="button" onClick={discardDraft} className="text-amber-600 hover:text-amber-800">
                  Discard
                </button>
              </span>
            </div>
          )}

          {mode === 'view' ? (
            record ? (
              <SectionSummary record={record} targetActivities={targetActivities} />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                <p className="text-sm text-slate-500">
                  {kind === 'target'
                    ? 'No target planned for this date.'
                    : 'No HAPPENED work recorded for this date.'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {editable
                    ? 'Use the button above to add this section.'
                    : 'This section is locked for this date.'}
                </p>
              </div>
            )
          ) : draft ? (
            kind === 'target' ? (
              <TargetEditor record={draft as TargetRecord} onChange={(next) => setDraft(next as T)} />
            ) : (
              <HappenedEditor
                record={draft as HappenedRecord}
                targetActivities={targetActivities}
                onChange={(next) => setDraft(next as T)}
              />
            )
          ) : null}
        </div>

        {mode === 'edit' && (
          <footer className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[11px]">
              {error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  {draftStatus === 'saved' ? (
                    <Check size={12} strokeWidth={2} className="text-emerald-500" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  )}
                  {draftStatus === 'saving'
                    ? 'Saving draft…'
                    : draftStatus === 'saved'
                      ? `Draft saved${draftTime ? ` at ${draftTime}` : ''}`
                      : 'Changes stay on this device until saved'}
                </span>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" onClick={cancelEdit} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={() => void handleSave()} disabled={saving}>
                <Save size={13} strokeWidth={1.8} /> {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </footer>
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void onDelete()}
        title={`Delete ${title.toLowerCase()}?`}
        description={`The ${title.toLowerCase()} record for this date will be removed.`}
      />
    </>
  );
}
