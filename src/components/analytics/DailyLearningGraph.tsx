import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import type { DailyLearningPoint, DailyLearningSeries } from '../../services/analyticsService';
import { formatMinutes } from '../../utils/date';
import { cn } from '../../utils/cn';

function pickTicks(values: number[], maximum = 4): number[] {
  if (values.length <= maximum) return values;
  const step = (values.length - 1) / (maximum - 1);
  return Array.from({ length: maximum }, (_, index) => values[Math.round(index * step)]);
}

function LearningTooltip({
  active,
  payload,
  series,
}: {
  active?: boolean;
  payload?: { payload?: DailyLearningPoint }[];
  series: DailyLearningSeries[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs shadow-soft">
      <p className="font-medium text-slate-700">
        {point.activity || point.label}
      </p>
      <p className="mt-0.5 text-[11px] text-slate-400">
        {point.label} · {formatMinutes(Number(point.x))} elapsed
      </p>
      <div className="mt-2 space-y-1">
        {series.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-medium text-slate-700">{formatMinutes(Number(point[item.key] ?? 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface DailyLearningGraphProps {
  data: { points: DailyLearningPoint[]; series: DailyLearningSeries[] };
  compact?: boolean;
}

export function DailyLearningGraph({ data, compact = false }: DailyLearningGraphProps) {
  const { theme } = useTheme();

  if (data.points.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-slate-400">
        No completed activities to chart for this day.
      </p>
    );
  }

  const gridColor = theme === 'dark' ? '#303646' : '#f1f5f9';
  const tickColor = theme === 'dark' ? '#7a869b' : '#94a3b8';
  const xTicks = pickTicks([...new Set(data.points.map((point) => point.x))]);

  return (
    <div>
      <div className={cn('w-full', compact ? 'h-[124px]' : 'h-[196px] sm:h-[220px]')}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.points} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[0, 'dataMax']}
              ticks={xTicks}
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 10 }}
              tickFormatter={(value: number) => formatMinutes(value)}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 10 }}
              tickFormatter={(value: number) => formatMinutes(value)}
              width={46}
              allowDecimals={false}
            />
            <Tooltip
              content={<LearningTooltip series={data.series} />}
              cursor={{ stroke: theme === 'dark' ? '#606b82' : '#cbd5e1', strokeDasharray: '3 3' }}
            />
            {data.series.map((item) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.name}
                stroke={item.color}
                strokeWidth={2}
                fill={item.color}
                fillOpacity={0.12}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                isAnimationActive
                animationDuration={450}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
        {data.series.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.color }} />
            {item.name}
            <span className="text-slate-400">{formatMinutes(item.totalMinutes)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
