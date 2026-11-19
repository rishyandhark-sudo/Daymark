import { BookOpenText } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white">
        <BookOpenText size={17} strokeWidth={2} />
      </span>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight text-slate-900">Daymark</span>
      )}
    </span>
  );
}
