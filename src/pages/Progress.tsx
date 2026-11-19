import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarDays, CheckCircle2, Clock3, Flame } from 'lucide-react';
import { CategoryDistribution } from '../components/analytics/CategoryDistribution';
import { ContributionHeatmap } from '../components/analytics/ContributionHeatmap';
import { LazyDailyLearningGraph } from '../components/analytics/LazyDailyLearningGraph';
import { StatCard } from '../components/analytics/StatCard';
import { Summaries } from '../components/analytics/Summaries';
import { WeeklyActivityChart } from '../components/analytics/WeeklyActivityChart';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Field';
import { EmptyState } from '../components/common/EmptyState';
import { SegmentedControl } from '../components/common/SegmentedControl';
import { useJournal } from '../context/JournalContext';
import {
  buildDailyLearningData,
  computeStats,
  getActivitySeries,
  getCategoryBreakdown,
  getHeatmap,
  getSummaries,
} from '../services/analyticsService';
import type { Period } from '../types';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'all', label: 'All Time' },
];

const CHART_SUBTITLES: Record<Period, string> = {
  week: 'Hours logged each day this week',
  month: 'Hours logged by week this month',
  all: 'Hours logged over the last six months',
};

export function Progress() {
  const { happenedByDate, serverTodayKey, openEditor } = useJournal();
  const [period, setPeriod] = useState<Period>('week');

  // Progress reflects actual work only — TARGET records never count as completed work.
  const happened = useMemo(() => [...happenedByDate.values()], [happenedByDate]);
  const today = useMemo(() => parseISO(serverTodayKey), [serverTodayKey]);

  const learningDates = useMemo(
    () => [...happenedByDate.keys()].sort((a, b) => b.localeCompare(a)),
    [happenedByDate],
  );
  const [requestedDate, setRequestedDate] = useState('');
  const selectedDate =
    requestedDate && happenedByDate.has(requestedDate) ? requestedDate : learningDates[0] ?? '';
  const dailyLearning = useMemo(
    () => buildDailyLearningData(happenedByDate.get(selectedDate)?.activities ?? []),
    [happenedByDate, selectedDate],
  );

  const stats = useMemo(() => computeStats(happened, period, today), [happened, period, today]);
  const series = useMemo(() => getActivitySeries(happened, period, today), [happened, period, today]);
  const categories = useMemo(() => getCategoryBreakdown(happened, period, today), [happened, period, today]);
  const heatmap = useMemo(() => getHeatmap(happened, today), [happened, today]);
  const summary = useMemo(() => getSummaries(happened, today), [happened, today]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Progress</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Everything here is calculated from your journal.
          </p>
        </div>
        <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      {happened.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-surface">
          <EmptyState
            icon={CalendarDays}
            title="Nothing to measure yet"
            description="Progress appears automatically once a past day has HAPPENED work recorded."
            action={
              <Button variant="primary" onClick={() => openEditor(serverTodayKey)}>
                Open today
              </Button>
            }
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="Active Days" value={String(stats.activeDays)} note="Days with actual work" />
        <StatCard icon={CheckCircle2} label="Problems Solved" value={String(stats.problemsSolved)} note="Solved this period" />
        <StatCard icon={Clock3} label="Learning Hours" value={`${stats.hours}h`} note="Time invested" />
        <StatCard icon={Flame} label="Current Streak" value={`${stats.streak} days`} note="Consecutive days" />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-soft sm:p-6">
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-slate-800">Learning activity</h2>
          <p className="mt-0.5 text-xs text-slate-400">{CHART_SUBTITLES[period]}</p>
        </div>
        <WeeklyActivityChart data={series} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-soft sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Daily learning by subject</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Cumulative HAPPENED minutes, in recorded activity order
            </p>
          </div>
          <Select
            aria-label="Select day"
            value={selectedDate}
            onChange={(event) => setRequestedDate(event.target.value)}
            disabled={learningDates.length === 0}
            className="sm:w-44"
          >
            {learningDates.length === 0 ? (
              <option value="">No days yet</option>
            ) : (
              learningDates.map((date) => (
                <option key={date} value={date}>
                  {format(parseISO(date), 'd MMM yyyy')}
                </option>
              ))
            )}
          </Select>
        </div>
        <LazyDailyLearningGraph data={dailyLearning} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-soft sm:p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-slate-800">Monthly contribution</h2>
            <p className="mt-0.5 text-xs text-slate-400">{format(today, 'MMMM yyyy')}</p>
          </div>
          <ContributionHeatmap days={heatmap} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-soft sm:p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-slate-800">Category distribution</h2>
            <p className="mt-0.5 text-xs text-slate-400">Where your time went</p>
          </div>
          <CategoryDistribution data={categories} />
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-soft">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-slate-800">Summaries</h2>
          <p className="mt-0.5 text-xs text-slate-400">A quick look at your recent consistency</p>
        </div>
        <Summaries summary={summary} />
      </section>
    </div>
  );
}
