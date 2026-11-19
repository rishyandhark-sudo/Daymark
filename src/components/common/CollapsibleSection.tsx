import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export function CollapsibleSection({
  title,
  subtitle,
  count,
  defaultOpen = false,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={cn('overflow-hidden rounded-xl border border-slate-200', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium text-slate-800">{title}</span>
          {subtitle && <span className="mt-0.5 block text-xs text-slate-500">{subtitle}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {count !== undefined && count > 0 && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
              {count}
            </span>
          )}
          <ChevronDown
            size={16}
            strokeWidth={1.8}
            className={cn('text-slate-400 transition-transform', open && 'rotate-180')}
          />
        </span>
      </button>
      {open && <div className="border-t border-slate-100 px-4 py-4">{children}</div>}
    </section>
  );
}
