import { cloneElement, isValidElement, useId, type InputHTMLAttributes, type ReactElement, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

const controlClass =
  'w-full rounded-lg border border-slate-200 bg-surface px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors';

export function Field({
  label,
  optional,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const description = error ?? hint;
  const control = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        'aria-labelledby': labelId,
        ...(description ? { 'aria-describedby': descriptionId } : {}),
      })
    : children;

  return (
    <div className={cn('block', className)}>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
        <span id={labelId}>{label}</span>
        {optional && <span className="font-normal text-slate-400">Optional</span>}
      </label>
      {control}
      {description ? (
        <span
          id={descriptionId}
          className={cn('mt-1 block text-xs', error ? 'text-red-500' : 'text-slate-400')}
        >
          {description}
        </span>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Textarea({ className, rows = 3, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn(controlClass, 'resize-y leading-relaxed', className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, 'pr-8', className)} {...props}>
      {children}
    </select>
  );
}
