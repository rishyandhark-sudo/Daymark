import { format } from 'date-fns';
import type { HappenedRecord, TargetRecord } from '../../types';
import { cn } from '../../utils/cn';
import { dateKey } from '../../utils/date';

export function CalendarDayCell({
  date,
  target,
  happened,
  selected,
  inMonth,
  today,
  onClick,
}: {
  date: Date;
  target?: TargetRecord;
  happened?: HappenedRecord;
  selected: boolean;
  inMonth: boolean;
  today: boolean;
  onClick: (date: string) => void;
}) {
  const key = dateKey(date);
  const title = (target?.title || happened?.title || '').trim();
  const hasTarget = Boolean(target && inMonth);
  const hasHappened = Boolean(happened && inMonth);
  const indicatorLabel = [
    hasTarget ? 'TARGET' : null,
    hasHappened ? 'HAPPENED' : null,
  ]
    .filter(Boolean)
    .join(' and ');

  return (
    <button
      type="button"
      onClick={() => onClick(key)}
      aria-label={`${format(date, 'MMMM d, yyyy')}${title ? ` — ${title}` : ''}${
        indicatorLabel ? `, ${indicatorLabel} recorded` : ''
      }`}
      className={cn(
        'group relative flex h-[68px] flex-col justify-between rounded-lg border px-2 py-1.5 text-left transition-colors sm:h-[94px] sm:px-2.5 sm:py-2',
        !inMonth && 'opacity-35 hover:opacity-70',
        inMonth && !selected && !today && 'border-transparent bg-slate-50/40 hover:border-slate-200 hover:bg-slate-50',
        today && !selected && 'border-indigo-200 bg-indigo-50/70 hover:bg-indigo-50',
        selected && 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200',
      )}
    >
      <span
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
          today ? 'bg-indigo-500 text-white' : 'text-slate-600',
          !inMonth && 'text-slate-400',
        )}
      >
        {format(date, 'd')}
      </span>

      {title && inMonth && (
        <span className="w-full truncate pr-2 text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
          {title}
        </span>
      )}

      {(hasTarget || hasHappened) && (
        <span className="absolute bottom-2 right-2 flex items-center gap-1" aria-hidden="true">
          {hasTarget && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-indigo-400"
              data-indicator="target"
              title="TARGET"
            />
          )}
          {hasHappened && (
            <span
              className="h-1.5 w-1.5 rounded-sm border border-emerald-400 bg-emerald-100"
              data-indicator="happened"
              title="HAPPENED"
            />
          )}
        </span>
      )}
    </button>
  );
}
