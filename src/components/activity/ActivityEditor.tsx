import { useState, type ReactNode } from 'react';
import { ChevronDown, Link2, Plus, Trash2 } from 'lucide-react';
import type { Category, CodingProblem, SectionActivity } from '../../types';
import { CATEGORY_OPTIONS } from '../../utils/constants';
import { formatMinutes } from '../../utils/date';
import { blankProblem } from '../../utils/entry';
import { cn } from '../../utils/cn';
import { CategoryBadge } from '../common/CategoryBadge';
import { Field, Input, Select, Textarea } from '../common/Field';
import { ProblemEditor } from './ProblemEditor';

export function ActivityEditor<A extends SectionActivity>({
  activity,
  kind = 'target',
  defaultOpen = false,
  extra,
  onChange,
  onRemove,
}: {
  activity: A;
  kind?: 'target' | 'happened';
  defaultOpen?: boolean;
  /** Section-specific fields: target priority or the explicit target link. */
  extra?: ReactNode;
  onChange: (activity: A) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const listId = `platforms-${activity.id}`;

  const set = <K extends keyof SectionActivity>(key: K, value: SectionActivity[K]) => {
    onChange({ ...activity, [key]: value } as A);
  };

  const updateProblem = (problem: CodingProblem) => {
    set('problems', activity.problems.map((item) => (item.id === problem.id ? problem : item)));
  };

  const updateLink = (index: number, value: string) => {
    set('links', activity.links.map((link, linkIndex) => (linkIndex === index ? value : link)));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
      <div className="flex items-center gap-2 px-3 py-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <ChevronDown
            size={15}
            strokeWidth={1.8}
            className={cn('shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
          />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
            {activity.name.trim() || 'New activity'}
          </span>
          <CategoryBadge category={activity.category} className="hidden sm:inline-flex" />
          <span className="shrink-0 text-[11px] text-slate-400">{formatMinutes(activity.minutes)}</span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove activity"
          className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={15} strokeWidth={1.8} />
        </button>
      </div>

      {open && (
        <div className="space-y-4 border-t border-slate-100 bg-slate-50/40 px-3 py-4 sm:px-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Activity name" className="sm:col-span-2">
              <Input
                value={activity.name}
                onChange={(event) => set('name', event.target.value)}
                placeholder="e.g. Array practice"
              />
            </Field>

            <Field label="Category">
              <Select
                value={activity.category}
                onChange={(event) => set('category', event.target.value as Category)}
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={kind === 'target' ? 'Expected duration' : 'Time spent'} hint="In minutes">
              <Input
                type="number"
                min={0}
                max={1440}
                value={activity.minutes}
                onChange={(event) => set('minutes', Number(event.target.value) || 0)}
              />
            </Field>

            <Field label="Description" optional className="sm:col-span-2">
              <Textarea
                value={activity.description}
                onChange={(event) => set('description', event.target.value)}
                placeholder={kind === 'target' ? 'What do you plan to work on?' : 'What did you work on?'}
                rows={2}
              />
            </Field>

            <Field
              label="Topics learned"
              optional
              className="sm:col-span-2"
              hint="Separate topics with a comma"
            >
              <Input
                value={activity.topics.join(', ')}
                onChange={(event) =>
                  set(
                    'topics',
                    event.target.value
                      .split(',')
                      .map((topic) => topic.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="e.g. Sliding window, Two pointers"
              />
            </Field>
          </div>

          {extra && <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 px-3 py-3">{extra}</div>}

          <div className="rounded-xl border border-slate-200 bg-surface">
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <span className="text-xs font-medium text-slate-600">
                Coding problems
                {activity.problems.length > 0 && (
                  <span className="ml-1.5 text-slate-400">({activity.problems.length})</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => set('problems', [...activity.problems, blankProblem()])}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-600"
              >
                <Plus size={13} strokeWidth={2} /> Add problem
              </button>
            </div>
            {activity.problems.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 p-3">
                {activity.problems.map((problem) => (
                  <ProblemEditor
                    key={problem.id}
                    problem={problem}
                    listId={listId}
                    onChange={updateProblem}
                    onRemove={() =>
                      set(
                        'problems',
                        activity.problems.filter((item) => item.id !== problem.id),
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-surface px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-600">
                Reference links
                {activity.links.length > 0 && (
                  <span className="ml-1.5 text-slate-400">({activity.links.length})</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => set('links', [...activity.links, ''])}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-600"
              >
                <Plus size={13} strokeWidth={2} /> Add link
              </button>
            </div>
            {activity.links.length > 0 && (
              <div className="mt-2 space-y-2 border-t border-slate-100 pt-3">
                {activity.links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Link2 size={14} className="shrink-0 text-slate-300" />
                    <Input
                      type="url"
                      value={link}
                      onChange={(event) => updateLink(index, event.target.value)}
                      placeholder="https://"
                      aria-label={`Reference link ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => set('links', activity.links.filter((_, i) => i !== index))}
                      aria-label="Remove link"
                      className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={14} strokeWidth={1.8} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
