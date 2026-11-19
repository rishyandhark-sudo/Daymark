import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildDailyLearningData } from '../src/services/analyticsService';
import { blankHappenedActivity } from '../src/utils/section';
import { CATEGORY_COLORS } from '../src/utils/constants';
import type { Category, HappenedActivity } from '../src/types';

function activity(name: string, category: Category, minutes: number): HappenedActivity {
  return { ...blankHappenedActivity(), name, category, minutes };
}

describe('daily learning chart data', () => {
  it('keeps DSA and AI/ML as separate series with their own durations', () => {
    const data = buildDailyLearningData([
      activity('Sliding window', 'DSA', 120),
      activity('Transformers', 'AI / ML', 30),
    ]);

    expect(data.activityCount).toBe(2);
    expect(data.totalMinutes).toBe(150);
    expect(data.series).toHaveLength(2);
    expect(data.series.find((item) => item.name === 'DSA')).toMatchObject({
      totalMinutes: 120,
      color: CATEGORY_COLORS.DSA,
      activities: 1,
    });
    expect(data.series.find((item) => item.name === 'AI / ML')).toMatchObject({
      totalMinutes: 30,
      color: CATEGORY_COLORS['AI / ML'],
      activities: 1,
    });
    expect(new Set(data.series.map((item) => item.color)).size).toBe(2);

    const final = data.points[data.points.length - 1];
    expect(final.x).toBe(150);
    expect(final.DSA).toBe(120);
    expect(final['AI / ML']).toBe(30);
  });

  it('accumulates multiple activities in the same category', () => {
    const data = buildDailyLearningData([
      activity('Graphs', 'DSA', 60),
      activity('Strings', 'DSA', 60),
      activity('Revision', 'AI / ML', 30),
    ]);

    expect(data.series.find((item) => item.name === 'DSA')).toMatchObject({
      totalMinutes: 120,
      activities: 2,
    });
    expect(data.points.map((point) => point.x)).toEqual([0, 60, 120, 150]);
    expect(data.points.map((point) => point.DSA)).toEqual([0, 60, 120, 120]);
    expect(data.points.map((point) => point['AI / ML'])).toEqual([0, 0, 0, 30]);
  });

  it('builds the timeline from recorded order without inventing clock times', () => {
    const data = buildDailyLearningData([
      activity('First', 'Reading', 25),
      activity('Second', 'Java', 15),
    ]);

    expect(data.points.map((point) => point.label)).toEqual(['Start', 'Activity 1', 'Activity 2']);
    expect(data.points.map((point) => point.activity)).toEqual(['', 'First', 'Second']);
    expect(data.points.map((point) => point.x)).toEqual([0, 25, 40]);
  });

  it('returns a clean empty result when there are no timed activities', () => {
    const empty = buildDailyLearningData([]);
    expect(empty).toEqual({
      points: [],
      series: [],
      totalMinutes: 0,
      activityCount: 0,
    });

    const zeroOnly = buildDailyLearningData([activity('No time', 'DSA', 0)]);
    expect(zeroOnly.points).toEqual([]);
  });

  it('assigns a stable colour to custom categories', () => {
    const first = buildDailyLearningData([activity('Custom', 'Other', 10)]);
    const second = buildDailyLearningData([activity('Custom', 'Other', 10)]);
    expect(first.series[0].color).toBe(second.series[0].color);
    expect(first.series[0].color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('theme preference', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('defaults to light and restores a stored theme', async () => {
    const { readStoredTheme, storeTheme, THEME_STORAGE_KEY } = await import(
      '../src/services/themeService'
    );
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });

    expect(readStoredTheme()).toBe('light');
    storeTheme('dark');
    expect(values.get(THEME_STORAGE_KEY)).toBe('dark');
    expect(readStoredTheme()).toBe('dark');
  });
});
