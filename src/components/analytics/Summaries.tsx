import type { Stats } from '../../services/analyticsService';
import { cn } from '../../utils/cn';

export function Summaries({ summary }: { summary: Record<'week' | 'month', Stats> }) {
  return (
    <div className="grid sm:grid-cols-2">
      {(['week', 'month'] as const).map((key, index) => (
        <div
          key={key}
          className={cn(
            'px-5 py-4',
            index > 0 && 'border-t border-slate-100 sm:border-l sm:border-t-0',
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {key === 'week' ? 'This week' : 'This month'}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-7 gap-y-2">
            <Metric value={String(summary[key].activeDays)} label="active days" />
            <Metric value={`${summary[key].hours}h`} label="learning" />
            <Metric value={String(summary[key].problemsSolved)} label="problems solved" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-lg font-semibold text-slate-800">{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}
