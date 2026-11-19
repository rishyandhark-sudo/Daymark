import { Plus } from 'lucide-react';
import type { Priority, TargetActivity, TargetRecord } from '../../types';
import { PRIORITIES } from '../../types';
import { blankTargetActivity } from '../../utils/section';
import { Button } from '../common/Button';
import { Field, Input, Select, Textarea } from '../common/Field';
import { ActivityEditor } from '../activity/ActivityEditor';

export function TargetEditor({
  record,
  onChange,
}: {
  record: TargetRecord;
  onChange: (record: TargetRecord) => void;
}) {
  const set = <K extends keyof TargetRecord>(key: K, value: TargetRecord[K]) => {
    onChange({ ...record, [key]: value });
  };

  const updateActivity = (next: TargetActivity) => {
    set(
      'activities',
      record.activities.map((activity) =>
        activity.id === next.id ? (next as TargetActivity) : activity,
      ),
    );
  };

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <Field label="Daily target title" hint="A few words are enough">
          <Input
            value={record.title}
            onChange={(event) => set('title', event.target.value)}
            placeholder="e.g. DSA + Java"
            autoFocus
          />
        </Field>
        <Field label="Short description" optional>
          <Textarea
            value={record.description}
            onChange={(event) => set('description', event.target.value)}
            placeholder="What are you aiming for?"
            rows={2}
          />
        </Field>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Planned activities</h3>
            <p className="mt-0.5 text-xs text-slate-400">Add the work you intend to do.</p>
          </div>
          <Button size="sm" onClick={() => set('activities', [...record.activities, blankTargetActivity()])}>
            <Plus size={14} strokeWidth={2} /> Add activity
          </Button>
        </div>

        {record.activities.length === 0 ? (
          <button
            type="button"
            onClick={() => set('activities', [blankTargetActivity()])}
            className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
          >
            <Plus size={18} strokeWidth={1.8} className="text-slate-400" />
            <span className="mt-2 text-sm font-medium text-slate-600">Add a planned activity</span>
            <span className="mt-1 text-xs text-slate-400">Optional — you can skip this.</span>
          </button>
        ) : (
          <div className="space-y-2.5">
            {record.activities.map((activity, index) => (
              <ActivityEditor
                key={activity.id}
                activity={activity}
                kind="target"
                defaultOpen={index === 0 && record.activities.length === 1 && !activity.name}
                onChange={updateActivity}
                onRemove={() =>
                  set(
                    'activities',
                    record.activities.filter((item) => item.id !== activity.id),
                  )
                }
                extra={
                  <Field label="Priority" optional className="max-w-[220px]">
                    <Select
                      value={activity.priority}
                      onChange={(event) =>
                        updateActivity({ ...activity, priority: event.target.value as Priority | '' })
                      }
                    >
                      <option value="">None</option>
                      {PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </Select>
                  </Field>
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
