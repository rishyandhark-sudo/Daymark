import { useMemo } from 'react';
import { ArrowUpRight, Clock3, Layers3, Link2, ListChecks } from 'lucide-react';
import { REFLECTION_KEYS } from '../../../shared/domain';
import type {
  HappenedActivity,
  HappenedRecord,
  TargetActivity,
  TargetRecord,
} from '../../types';
import { buildDailyLearningData, recordMinutes, solvedProblems } from '../../services/analyticsService';
import { formatMinutes } from '../../utils/date';
import { CategoryBadge } from '../common/CategoryBadge';
import { LazyDailyLearningGraph } from '../analytics/LazyDailyLearningGraph';

type SectionRecord = TargetRecord | HappenedRecord;

export function SectionSummary({
  record,
  targetActivities = [],
}: {
  record: SectionRecord;
  targetActivities?: TargetActivity[];
}) {
  const activities: (TargetActivity | HappenedActivity)[] = record.activities;
  const minutes = recordMinutes(activities);
  const solved = solvedProblems(activities);
  const learning = useMemo(
    () => (record.kind === 'happened' ? buildDailyLearningData(record.activities) : null),
    [record],
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">
          {record.title.trim() || (record.kind === 'target' ? 'Daily target' : 'Daily happenings')}
        </h3>
        {record.description && (
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{record.description}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Meta icon={Clock3} label={formatMinutes(minutes)} />
          <Meta icon={ListChecks} label={`${solved} solved`} />
          <Meta icon={Layers3} label={`${activities.length} activities`} />
        </div>
      </div>

      <section>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {record.kind === 'target' ? 'Planned activities' : 'Completed activities'}
        </h4>
        {activities.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
            No activities recorded in this section.
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <article key={activity.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h5 className="text-sm font-semibold text-slate-800">
                      {activity.name.trim() || 'Untitled activity'}
                    </h5>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <CategoryBadge category={activity.category} />
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock3 size={12} strokeWidth={1.8} />
                        {formatMinutes(activity.minutes)}
                      </span>
                      {'priority' in activity && activity.priority && (
                        <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
                          {activity.priority} priority
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {'linkedTargetActivityId' in activity && (
                  <LinkedLabel id={activity.linkedTargetActivityId} activities={targetActivities} />
                )}

                {activity.description && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{activity.description}</p>
                )}

                {activity.topics.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {activity.topics.map((topic) => (
                      <span key={topic} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                {activity.problems.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Coding problems
                    </p>
                    <ul className="space-y-2">
                      {activity.problems.map((problem) => (
                        <li key={problem.id} className="flex items-start justify-between gap-2">
                          <span className="min-w-0 text-xs text-slate-600">
                            {problem.name || 'Untitled problem'}
                            {problem.platform && <span className="text-slate-400"> · {problem.platform}</span>}
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="text-[11px] text-slate-400">{problem.difficulty}</span>
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                                problem.status === 'Solved'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {problem.status}
                            </span>
                            {problem.url && (
                              <a
                                href={problem.url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open ${problem.name}`}
                                className="text-slate-400 hover:text-indigo-500"
                              >
                                <ArrowUpRight size={13} strokeWidth={1.8} />
                              </a>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activity.links.filter(Boolean).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    {activity.links.filter(Boolean).map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600"
                      >
                        Reference {index + 1} <ArrowUpRight size={12} strokeWidth={1.8} />
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {learning && activities.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-surface p-3">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Learning timeline
            </h4>
            <span className="text-[10px] text-slate-400">HAPPENED only</span>
          </div>
          <LazyDailyLearningGraph data={learning} compact />
        </section>
      )}

      {record.kind === 'happened' &&
        REFLECTION_KEYS.some((key) => record.reflection[key].trim()) && (
          <section>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Reflection
            </h4>
            <div className="space-y-4 rounded-xl border border-slate-200 p-4">
              {REFLECTION_KEYS.filter((key) => record.reflection[key].trim()).map((key) => (
                <div key={key}>
                  <p className="text-xs font-medium capitalize text-slate-500">{key}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {record.reflection[key]}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
    </div>
  );
}

function LinkedLabel({
  id,
  activities,
}: {
  id: string | null;
  activities: TargetActivity[];
}) {
  if (!id) {
    return (
      <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-slate-400">
        <Link2 size={12} strokeWidth={1.8} /> Not linked to a planned activity
      </p>
    );
  }
  const planned = activities.find((activity) => activity.id === id);
  return (
    <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-indigo-500">
      <Link2 size={12} strokeWidth={1.8} />
      Linked to: {planned?.name.trim() || 'a planned activity (removed)'}
    </p>
  );
}

function Meta({ icon: Icon, label }: { icon: typeof Clock3; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-2.5 py-1.5 text-[11px] font-medium text-slate-600">
      <Icon size={13} strokeWidth={1.8} className="text-slate-400" />
      {label}
    </span>
  );
}
