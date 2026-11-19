import type { ReactNode } from 'react';
import { Brand } from './Brand';

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="mx-auto flex w-full max-w-[1180px] items-center px-6 py-7 sm:px-8">
        <Brand />
      </div>

      <div className="flex flex-1 items-center justify-center px-5 pb-16 pt-4 sm:px-6">
        <div className="w-full max-w-[420px] animate-slide-up">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-surface p-6 shadow-soft sm:p-7">
            {children}
          </div>

          <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
        </div>
      </div>

      <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400">
        A quiet place to record your daily progress.
      </div>
    </div>
  );
}
