import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HappenedRecord, TargetRecord } from '../../types';
import { cn } from '../../utils/cn';
import { dateKey } from '../../utils/date';
import { CalendarDayCell } from './CalendarDayCell';

const WEEK_OPTIONS = { weekStartsOn: 1 as const };
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function MonthCalendar({
  month,
  targetByDate,
  happenedByDate,
  todayKey,
  selectedDate,
  onMonthChange,
  onSelectDate,
}: {
  month: Date;
  targetByDate: Map<string, TargetRecord>;
  happenedByDate: Map<string, HappenedRecord>;
  todayKey: string;
  selectedDate: string;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: string) => void;
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), WEEK_OPTIONS),
    end: endOfWeek(endOfMonth(month), WEEK_OPTIONS),
  });

  const goToToday = () => {
    onMonthChange(parseISO(todayKey));
    onSelectDate(todayKey);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
        <div className="flex items-baseline gap-3">
          <h2 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
            {format(month, 'MMMM yyyy')}
          </h2>
          <button
            type="button"
            onClick={goToToday}
            className="hidden text-xs font-medium text-indigo-500 hover:text-indigo-600 sm:block"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 text-[10px] text-slate-400 sm:flex">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> TARGET
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-sm border border-emerald-400 bg-emerald-100" /> HAPPENED
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onMonthChange(subMonths(month, 1))}
              aria-label="Previous month"
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
            >
              <ChevronLeft size={17} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => onMonthChange(addMonths(month, 1))}
              aria-label="Next month"
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
            >
              <ChevronRight size={17} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 pb-3 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
        <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-1.5">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className={cn(
                'px-1 text-center text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:text-[11px]',
              )}
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day[0]}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {days.map((day) => {
            const key = dateKey(day);
            return (
              <CalendarDayCell
                key={key}
                date={day}
                target={targetByDate.get(key)}
                happened={happenedByDate.get(key)}
                selected={selectedDate === key}
                inMonth={isSameMonth(day, month)}
                today={key === todayKey}
                onClick={onSelectDate}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
