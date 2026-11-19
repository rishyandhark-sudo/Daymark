import { format } from 'date-fns';
import type { HeatmapDay } from '../../services/analyticsService';
import { formatMinutes } from '../../utils/date';
import { cn } from '../../utils/cn';

const LEVEL_CLASSES = [
  'bg-slate-100',
  'bg-indigo-100',
  'bg-indigo-200',
  'bg-indigo-300',
  'bg-indigo-500',
];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CELL_WITH_GAP = 15; // 12 px square + 3 px gap

function monthColumns(days: HeatmapDay[]): { label: string; columns: number }[] {
  const groups: { label: string; columns: number }[] = [];
  const weeks = Math.ceil(days.length / 7);

  for (let column = 0; column < weeks; column += 1) {
    const day = days[column * 7];
    if (!day) continue;
    const label = format(day.date, 'MMM');
    const last = groups[groups.length - 1];
    if (last?.label === label) last.columns += 1;
    else groups.push({ label, columns: 1 });
  }
  return groups;
}

export function ContributionHeatmap({ days }: { days: HeatmapDay[] }) {
  const months = monthColumns(days);

  return (
    <div className="flex items-start gap-2.5">
      <div className="grid shrink-0 gap-[3px] pt-[15px] text-[9px] leading-3 text-slate-400">
        {WEEKDAYS.map((day, index) => (
          <span key={index} className="flex h-3 items-center">
            {day}
          </span>
        ))}
      </div>

      <div className="min-w-0">
        <div className="mb-1 flex h-3 items-center text-[9px] leading-none text-slate-400">
          {months.map((month, index) => (
            <span key={index} style={{ width: month.columns * CELL_WITH_GAP }}>
              {month.label}
            </span>
          ))}
        </div>

        <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
          {days.map((day) => (
            <div
              key={day.key}
              title={`${format(day.date, 'MMM d')} · ${day.minutes === 0 ? 'No entry' : formatMinutes(day.minutes)}`}
              className={cn(
                'h-3 w-3 rounded-[2px] border border-slate-200/60',
                LEVEL_CLASSES[day.level],
                !day.inMonth && 'opacity-30',
              )}
            />
          ))}
        </div>

        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-400">
          <span>Less</span>
          {LEVEL_CLASSES.map((className, index) => (
            <span key={index} className={cn('h-2 w-2 rounded-[2px]', className)} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
