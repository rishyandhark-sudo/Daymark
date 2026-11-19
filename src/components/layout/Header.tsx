import { format, parseISO } from 'date-fns';
import { CalendarDays, Moon, Sun } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useJournal } from '../../context/JournalContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';
import { Brand } from './Brand';
import { ProfileMenu } from '../profile/ProfileMenu';
import { Button } from '../common/Button';

export function Header() {
  const navigate = useNavigate();
  const { openEditor, serverTodayKey } = useJournal();
  const { theme, toggleTheme } = useTheme();
  const monthYear = format(parseISO(serverTodayKey), 'MMMM yyyy');

  const handleOpenToday = () => {
    openEditor(serverTodayKey);
    if (window.location.pathname !== '/journal') navigate('/journal');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <NavLink to="/journal" className="shrink-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200">
          <Brand />
        </NavLink>

        <span className="hidden h-4 w-px bg-slate-200 lg:block" />
        <span className="hidden text-xs text-slate-400 lg:block">{monthYear}</span>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
          <NavLink
            to="/journal"
            className={({ isActive }) =>
              cn(
                'rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3',
                isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800',
              )
            }
          >
            Journal
          </NavLink>
          <NavLink
            to="/progress"
            className={({ isActive }) =>
              cn(
                'rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3',
                isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800',
              )
            }
          >
            Progress
          </NavLink>
        </nav>

        <Button variant="primary" size="sm" onClick={handleOpenToday} className="ml-1">
          <CalendarDays size={15} strokeWidth={2} />
          <span className="hidden sm:inline">Open today</span>
          <span className="sm:hidden">Today</span>
        </Button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
        >
          {theme === 'dark' ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
        </button>

        <ProfileMenu />
      </div>
    </header>
  );
}
