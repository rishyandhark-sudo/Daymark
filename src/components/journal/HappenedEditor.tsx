import { Plus } from 'lucide-react';
import type { HappenedActivity, HappenedRecord, TargetActivity } from '../../types';
import { blankHappenedActivity } from '../../utils/section';
import { Button } from '../common/Button';
import { CollapsibleSection } from '../common/CollapsibleSection';
import { Field, Input, Select, Textarea } from '../common/Field';
import { ActivityEditor } from '../activity/ActivityEditor';
import { ReflectionEditor } from './ReflectionEditor';

export function HappenedEditor({
  record,
  targetActivities = [],
  onChange,
}: {
  record: HappenedRecord;
  targetActivities?: TargetActivity[];
  onChange: (record: HappenedRecord) => void;
}) {
  const set = <K extends keyof HappenedRecord>(key: K, value: HappenedRecord[K]) => {
    onChange({ ...record, [key]: value });
  };

  const updateActivity = (next: HappenedActivity) => {
    set(
      'activities',
      record.activities.map((activity) =>
        activity.id === next.id ? (next as HappenedActivity) : activity,
      ),
    );
  };

  const reflectionFilled = Object.values(record.reflection).some((value) => value.trim().length > 0);

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <Field label="HAPPENED title" hint="What actually happened on this date">
          <Input
            value={record.title}
            onChange={(event) => set('title', event.target.value)}
            placeholder="e.g. DSA + Java"
            autoFocus
          />
        </Field>
        <Field label="Description of work" optional>
          <Textarea
            value={record.description}
            onChange={(event) => set('description', event.target.value)}
            placeholder="How did the day actually go?"
            rows={2}
          />
        </Field>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Completed activities</h3>
            <p className="mt-0.5 text-xs text-slate-400">Record the work you actually did.</p>
          </div>
          <Button size="sm" onClick={() => set('activities', [...record.activities, blankHappenedActivity()])}>
            <Plus size={14} strokeWidth={2} /> Add activity
          </Button>
        </div>

        {record.activities.length === 0 ? (
          <button
            type="button"
            onClick={() => set('activities', [blankHappenedActivity()])}
            className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
          >
            <Plus size={18} strokeWidth={1.8} className="text-slate-400" />
            <span className="mt-2 text-sm font-medium text-slate-600">Add a completed activity</span>
            <span className="mt-1 text-xs text-slate-400">A target is not required to record actual work.</span>
          </button>
        ) : (
          <div className="space-y-2.5">
            {record.activities.map((activity, index) => (
              <ActivityEditor
                key={activity.id}
                activity={activity}
                kind="happened"
                defaultOpen={index === 0 && record.activities.length === 1 && !activity.name}
                onChange={updateActivity}
                onRemove={() =>
                  set(
                    'activities',
                    record.activities.filter((item) => item.id !== activity.id),
                  )
                }
                extra={
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-slate-600">Link to a planned activity</p>
                    <Select
                      value={activity.linkedTargetActivityId ?? ''}
                      onChange={(event) =>
                        updateActivity({
                          ...activity,
                          linkedTargetActivityId: event.target.value || null,
                        })
                      }
                    >
                      <option value="">Not linked</option>
                      {targetActivities.map((planned) => (
                        <option key={planned.id} value={planned.id}>
                          {planned.name.trim() || 'Untitled planned activity'}
                        </option>
                      ))}
                    </Select>
                    <p className="text-[11px] text-slate-400">
                      Link work manually — similar titles are never matched automatically.
                    </p>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>

      <CollapsibleSection
        title="Accomplishments, challenges & lessons"
        subtitle="Optional notes, only visible to you"
        defaultOpen={reflectionFilled}
      >
        <ReflectionEditor
          reflection={record.reflection}
          onChange={(reflection) => set('reflection', reflection)}
        />
      </CollapsibleSection>
    </div>
  );
}
