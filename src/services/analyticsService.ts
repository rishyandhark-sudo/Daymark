import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns';
import type { Category, HappenedRecord, Period, SectionActivity } from '../types';
import { activityMinutes as minutesOf, solvedCount as solvedOf } from '../utils/section';
import { dateKey } from '../utils/date';
import { CATEGORY_COLORS } from '../utils/constants';

export interface Stats {
  activeDays: number;
  problemsSolved: number;
  minutes: number;
  hours: number;
  streak: number;
}

export interface SeriesPoint {
  label: string;
  hours: number;
  minutes: number;
}

export interface HeatmapDay {
  key: string;
  date: Date;
  minutes: number;
  level: 0 | 1 | 2 | 3 | 4;
  inMonth: boolean;
}

export interface CategorySlice {
  category: Category;
  minutes: number;
  percentage: number;
  activities: number;
}

/** Progress statistics are derived from HAPPENED records only, never TARGET records. */
export type AnalyticsRecord = Pick<HappenedRecord, 'date' | 'activities'>;
type ActivityList = SectionActivity[];

const WEEK_OPTIONS = { weekStartsOn: 1 as const };

export function recordMinutes(activities: ActivityList): number {
  return minutesOf(activities);
}

export function solvedProblems(activities: ActivityList): number {
  return solvedOf(activities);
}

export function entriesInPeriod(
  records: AnalyticsRecord[],
  period: Period,
  today: Date = new Date(),
): AnalyticsRecord[] {
  if (period === 'all') return records;

  const start = period === 'week' ? startOfWeek(today, WEEK_OPTIONS) : startOfMonth(today);
  const end = period === 'week' ? endOfWeek(today, WEEK_OPTIONS) : endOfMonth(today);

  return records.filter((record) => {
    const date = parseISO(record.date);
    return date >= start && date <= end;
  });
}

export function currentStreak(records: AnalyticsRecord[], today: Date = new Date()): number {
  const active = new Set(records.map((record) => record.date));
  let cursor = today;

  if (!active.has(dateKey(cursor))) cursor = subDays(cursor, 1);

  let streak = 0;
  while (active.has(dateKey(cursor))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export function computeStats(
  records: AnalyticsRecord[],
  period: Period,
  today: Date = new Date(),
): Stats {
  const scoped = entriesInPeriod(records, period, today);
  const minutes = scoped.reduce((total, record) => total + recordMinutes(record.activities), 0);

  return {
    activeDays: new Set(scoped.map((record) => record.date)).size,
    problemsSolved: scoped.reduce((total, record) => total + solvedProblems(record.activities), 0),
    minutes,
    hours: Math.round((minutes / 60) * 10) / 10,
    streak: currentStreak(records, today),
  };
}

function sumMinutes(records: AnalyticsRecord[], dates: Date[]): number {
  const keys = new Set(dates.map(dateKey));
  return records
    .filter((record) => keys.has(record.date))
    .reduce((total, record) => total + recordMinutes(record.activities), 0);
}

export function getActivitySeries(
  records: AnalyticsRecord[],
  period: Period,
  today: Date = new Date(),
): SeriesPoint[] {
  if (period === 'week') {
    const days = eachDayOfInterval({
      start: startOfWeek(today, WEEK_OPTIONS),
      end: endOfWeek(today, WEEK_OPTIONS),
    });
    return days.map((day) => {
      const minutes = sumMinutes(records, [day]);
      return { label: format(day, 'EEE'), hours: Math.round((minutes / 60) * 10) / 10, minutes };
    });
  }

  if (period === 'month') {
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const points: SeriesPoint[] = [];

    for (let week = 0; week < 5; week += 1) {
      const start = addDays(monthStart, week * 7);
      if (start > monthEnd) break;
      const end = addDays(start, 6) > monthEnd ? monthEnd : addDays(start, 6);
      const minutes = sumMinutes(records, eachDayOfInterval({ start, end }));
      points.push({
        label: format(start, 'd MMM'),
        hours: Math.round((minutes / 60) * 10) / 10,
        minutes,
      });
    }
    return points;
  }

  const points: SeriesPoint[] = [];
  for (let index = 5; index >= 0; index -= 1) {
    const monthStart = startOfMonth(subMonths(today, index));
    const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(monthStart) });
    const minutes = sumMinutes(records, days);
    points.push({
      label: format(monthStart, 'MMM'),
      hours: Math.round((minutes / 60) * 10) / 10,
      minutes,
    });
  }
  return points;
}

export function getHeatmap(records: AnalyticsRecord[], month: Date): HeatmapDay[] {
  const byDate = new Map(records.map((record) => [record.date, recordMinutes(record.activities)]));
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), WEEK_OPTIONS),
    end: endOfWeek(endOfMonth(month), WEEK_OPTIONS),
  });

  return days.map((date) => {
    const minutes = byDate.get(dateKey(date)) ?? 0;
    let level: HeatmapDay['level'] = 0;
    if (minutes >= 240) level = 4;
    else if (minutes >= 120) level = 3;
    else if (minutes >= 60) level = 2;
    else if (minutes > 0) level = 1;

    return {
      key: dateKey(date),
      date,
      minutes,
      level,
      inMonth:
        format(date, 'MM') === format(month, 'MM') &&
        format(date, 'yyyy') === format(month, 'yyyy'),
    };
  });
}

export function getCategoryBreakdown(
  records: AnalyticsRecord[],
  period: Period,
  today: Date = new Date(),
): CategorySlice[] {
  const scoped = entriesInPeriod(records, period, today);
  const totals = new Map<Category, { minutes: number; activities: number }>();

  scoped.forEach((record) => {
    record.activities.forEach((activity) => {
      const current = totals.get(activity.category) ?? { minutes: 0, activities: 0 };
      totals.set(activity.category, {
        minutes: current.minutes + Math.max(0, activity.minutes),
        activities: current.activities + 1,
      });
    });
  });

  const totalMinutes = [...totals.values()].reduce((sum, item) => sum + item.minutes, 0);

  return [...totals.entries()]
    .map(([category, value]) => ({
      category,
      minutes: value.minutes,
      activities: value.activities,
      percentage: totalMinutes === 0 ? 0 : Math.round((value.minutes / totalMinutes) * 100),
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

export function getSummaries(
  records: AnalyticsRecord[],
  today: Date = new Date(),
): Record<'week' | 'month', Stats> {
  return {
    week: computeStats(records, 'week', today),
    month: computeStats(records, 'month', today),
  };
}

/* ------------------------------------------------------------------------- *
 * Daily learning graph
 *
 * Activities have no start/end timestamps in the data model, so the timeline
 * is built from recorded order: x is cumulative minutes elapsed so far and y
 * is each subject's running total. No clock times are invented. Only HAPPENED
 * activities are ever passed in; TARGET durations are never completed time.
 * ------------------------------------------------------------------------- */

export interface DailyLearningSeries {
  /** Category name, used directly as the Recharts data key. */
  key: string;
  name: string;
  color: string;
  totalMinutes: number;
  activities: number;
}

export interface DailyLearningPoint {
  /** Cumulative minutes across all subjects at this point in recorded order. */
  x: number;
  label: string;
  activity: string;
  [key: string]: number | string;
}

export interface DailyLearningData {
  points: DailyLearningPoint[];
  series: DailyLearningSeries[];
  totalMinutes: number;
  activityCount: number;
}

const FALLBACK_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#14b8a6',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#f97316',
];

function categoryColor(name: string): string {
  const known = CATEGORY_COLORS[name as Category];
  if (known) return known;
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

/** Build one cumulative curve per subject from a single day's HAPPENED activities. */
export function buildDailyLearningData(activities: SectionActivity[]): DailyLearningData {
  const tracked = activities.filter(
    (activity) => Number.isFinite(activity.minutes) && activity.minutes > 0,
  );

  if (tracked.length === 0) {
    return { points: [], series: [], totalMinutes: 0, activityCount: 0 };
  }

  const totals = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const activity of tracked) {
    const name = String(activity.category || 'Other');
    totals.set(name, (totals.get(name) ?? 0) + activity.minutes);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const series: DailyLearningSeries[] = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, minutes]) => ({
      key: name,
      name,
      color: categoryColor(name),
      totalMinutes: minutes,
      activities: counts.get(name) ?? 0,
    }));

  const cumulative = new Map<string, number>(series.map((item) => [item.name, 0]));
  const start: DailyLearningPoint = { x: 0, label: 'Start', activity: '' };
  for (const item of series) start[item.key] = 0;

  const points: DailyLearningPoint[] = [start];
  let elapsed = 0;
  tracked.forEach((activity, index) => {
    const name = String(activity.category || 'Other');
    elapsed += activity.minutes;
    cumulative.set(name, (cumulative.get(name) ?? 0) + activity.minutes);

    const point: DailyLearningPoint = {
      x: elapsed,
      label: `Activity ${index + 1}`,
      activity: activity.name.trim() || 'Untitled activity',
    };
    for (const item of series) point[item.key] = cumulative.get(item.name) ?? 0;
    points.push(point);
  });

  return {
    points,
    series,
    totalMinutes: elapsed,
    activityCount: tracked.length,
  };
}
