import { ArrowDownRight, ArrowUpRight, Link2 } from 'lucide-react';
import type { HappenedRecord, TargetRecord } from '../../types';
import { compareSections, type CompletionStatus } from '../../utils/comparison';
import { formatMinutes } from '../../utils/date';
import { cn } from '../../utils/cn';

const STATUS_STYLE: Record<CompletionStatus, string> = {
  completed: 'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-700',
  'not-completed': 'bg-slate-100 text-slate-500',
};

const STATUS_LABEL: Record<CompletionStatus, string> = {
  completed: 'Completed',
  partial: 'Partially completed',
  'not-completed': 'Not completed',
};

export function ComparisonView({
  target,
  happened,
}: {
  target: TargetRecord;
  happened: HappenedRecord;
}) {
  const comparison = compareSections(target, happened);

  return (
    <section className="rounded-xl border border-slate-200 bg-surface p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">TARGET vs HAPPENED</h3>
        <p className="mt-0.5 text-xs text-slate-400">
          Based only on activities you linked manually. Similar titles are never matched automatically.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <CompareCard label="Duration" planned={formatMinutes(comparison.expectedMinutes)} actual={formatMinutes(comparison.actualMinutes)} />
        <CompareCard label="Coding problems" planned={String(comparison.plannedProblems)} actual={`${comparison.solvedProblems} solved`} />
        <CompareCard label="Activities" planned={String(comparison.planned.length)} actual={String(comparison.planned.filter((item) => item.status === 'completed').length + comparison.unlinked.length)} />
      </div>

      <div className="mt-5 space-y-2.5">
        {comparison.planned.map((item) => (
          <div key={item.activity.id} className="rounded-lg border border-slate-200 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-700">
                {item.activity.name.trim() || 'Untitled planned activity'}
              </span>
              <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-medium', STATUS_STYLE[item.status])}>
                {STATUS_LABEL[item.status]}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
              <span>
                {formatMinutes(item.activity.minutes)} planned
                {item.linked.length > 0 && <> · {formatMinutes(item.actualMinutes)} actual</>}
              </span>
              {item.plannedProblems > 0 && (
                <span>
                  {item.plannedProblems} planned · {item.solvedProblems} solved
                </span>
              )}
              {item.linked.length > 0 && (
                <span className="inline-flex items-center gap-1 text-indigo-500">
                  <Link2 size={11} strokeWidth={1.8} /> {item.linked.length} linked
                </span>
              )}
            </div>
          </div>
        ))
        }

        {comparison.unlinked.length > 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2.5">
            <p className="text-xs font-medium text-slate-600">Actual work without a target link</p>
            <p className="mt-1 text-[11px] text-slate-400">
              {comparison.unlinked.map((activity) => activity.name.trim() || 'Untitled activity').join(', ')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function CompareCard({
  label,
  planned,
  actual,
}: {
  label: string;
  planned: string;
  actual: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        <span className="inline-flex items-center gap-1 text-slate-500">
          <ArrowUpRight size={12} strokeWidth={1.8} className="text-indigo-400" />
          {planned}
        </span>
        <span className="text-slate-300">/</span>
        <span className="inline-flex items-center gap-1">
          <ArrowDownRight size={12} strokeWidth={1.8} className="text-emerald-500" />
          {actual}
        </span>
      </p>
    </div>
  );
}
