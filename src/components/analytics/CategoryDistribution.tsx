import type { CategorySlice } from '../../services/analyticsService';
import { formatMinutes } from '../../utils/date';
import { CATEGORY_COLORS } from '../../utils/constants';

export function CategoryDistribution({ data }: { data: CategorySlice[] }) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">
        Add an activity to see your learning mix.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((slice) => (
        <div key={slice.category}>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 font-medium text-slate-700">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[slice.category] }}
              />
              {slice.category}
            </span>
            <span className="text-slate-400">
              {formatMinutes(slice.minutes)} · {slice.percentage}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(slice.percentage, 2)}%`,
                backgroundColor: CATEGORY_COLORS[slice.category],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
