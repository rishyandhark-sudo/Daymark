import type { Category } from '../../types';
import { CATEGORY_COLORS } from '../../utils/constants';
import { cn } from '../../utils/cn';

export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-surface px-2 py-1 text-[11px] font-medium text-slate-600',
        className,
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: CATEGORY_COLORS[category] }}
      />
      {category}
    </span>
  );
}
