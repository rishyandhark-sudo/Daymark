import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import type { SeriesPoint } from '../../services/analyticsService';

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs shadow-soft">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="ml-2 text-slate-500">{payload[0].value ?? 0}h</span>
    </div>
  );
}

export function WeeklyActivityChart({ data }: { data: SeriesPoint[] }) {
  const { theme } = useTheme();
  const gridColor = theme === 'dark' ? '#303646' : '#f1f5f9';
  const tickColor = theme === 'dark' ? '#7a869b' : '#94a3b8';

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barSize={28}>
          <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: tickColor, fontSize: 11 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: tickColor, fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: theme === 'dark' ? '#222736' : '#f8fafc' }}
          />
          <Bar dataKey="hours" fill="#818cf8" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
