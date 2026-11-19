import { lazy, Suspense } from 'react';
import type { DailyLearningGraphProps } from './DailyLearningGraph';

// Recharts is kept in its own chunk so the journal's initial load stays light.
const DailyLearningGraph = lazy(() =>
  import('./DailyLearningGraph').then((module) => ({ default: module.DailyLearningGraph })),
);

export function LazyDailyLearningGraph(props: DailyLearningGraphProps) {
  return (
    <Suspense
      fallback={
        <div
          className={props.compact ? 'h-[150px] animate-pulse rounded-md bg-slate-50' : 'h-[220px] animate-pulse rounded-md bg-slate-50'}
          aria-label="Loading learning graph"
        />
      }
    >
      <DailyLearningGraph {...props} />
    </Suspense>
  );
}
