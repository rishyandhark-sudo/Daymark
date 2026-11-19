import { ChevronRight, Clock3, ListChecks, NotebookPen } from 'lucide-react';
import { MonthCalendar } from '../components/calendar/MonthCalendar';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { useJournal } from '../context/JournalContext';
import { activityMinutes, solvedCount } from '../utils/section';
import { formatMinutes, shortDate } from '../utils/date';

export function Journal() {
  const {
    days,
    targetByDate,
    happenedByDate,
    visibleMonth,
    setVisibleMonth,
    selectedDate,
    serverTodayKey,
    openEditor,
  } = useJournal();

  const recent = [...days].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Journal</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Two sections for every date: what you planned and what actually happened.
        </p>
      </div>

      <MonthCalendar
        month={visibleMonth}
        targetByDate={targetByDate}
        happenedByDate={happenedByDate}
        todayKey={serverTodayKey}
        selectedDate={selectedDate}
        onMonthChange={setVisibleMonth}
        onSelectDate={openEditor}
      />

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Recent days</h2>
          <span className="text-xs text-slate-400">{days.length} recorded</span>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-surface">
            <EmptyState
              icon={NotebookPen}
              title="Your journal starts here"
              description="Pick a date on the calendar to plan a target or record work that happened."
              action={
                <Button variant="primary" onClick={() => openEditor(serverTodayKey)}>
                  Open today
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-soft">
            {recent.map((day, index) => {
              const title = day.target?.title || day.happened?.title || 'Daily record';
              const summary = day.target?.description || day.happened?.description || '';
              const minutes = day.happened ? activityMinutes(day.happened.activities) : 0;
              const solved = day.happened ? solvedCount(day.happened.activities) : 0;

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => openEditor(day.date)}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 sm:px-5 ${
                    index > 0 ? 'border-t border-slate-100' : ''
                  }`}
                >
                  <span className="w-14 shrink-0 text-xs font-medium text-slate-400">
                    {shortDate(day.date)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="block truncate text-sm font-medium text-slate-800">{title}</span>
                      {day.target && (
                        <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-indigo-500">
                          Target
                        </span>
                      )}
                      {day.happened && (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-600">
                          Happened
                        </span>
                      )}
                    </span>
                    {summary && <span className="mt-0.5 block truncate text-xs text-slate-400">{summary}</span>}
                  </span>
                  <span className="hidden shrink-0 items-center gap-3 text-[11px] text-slate-400 sm:flex">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={13} strokeWidth={1.8} />
                      {formatMinutes(minutes)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ListChecks size={13} strokeWidth={1.8} />
                      {solved} solved
                    </span>
                  </span>
                  <ChevronRight size={16} strokeWidth={1.8} className="shrink-0 text-slate-300" />
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
