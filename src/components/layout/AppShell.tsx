import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { DayDrawer } from '../journal/DayDrawer';

export function AppShell() {
  return (
    <div className="min-h-screen bg-surface text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-20 pt-7 sm:px-6 sm:pt-9 lg:px-8">
        <Outlet />
      </main>
      <DayDrawer />
    </div>
  );
}
