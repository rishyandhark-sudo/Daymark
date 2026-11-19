import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({ open, onClose, title, description, children, footer }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Journal entry">
      <button
        type="button"
        aria-label="Close entry"
        onClick={onClose}
        className="absolute inset-0 h-full w-full animate-fade-in bg-black/40 backdrop-blur-[1px]"
      />
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex w-full flex-col border-l border-slate-200 bg-surface shadow-drawer animate-slide-in sm:w-[580px]',
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <div className="text-base font-semibold text-slate-900">{title}</div>
            {description && <div className="mt-0.5 text-xs text-slate-500">{description}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">{children}</div>

        {footer && (
          <footer className="border-t border-slate-100 bg-surface px-5 py-4 sm:px-7">{footer}</footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
