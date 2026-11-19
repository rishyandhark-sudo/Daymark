import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Settings2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { ProfileModal } from './ProfileModal';

export function ProfileMenu() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const name = profile.displayName || user?.name || 'You';

  return (
    <>
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center gap-1.5 rounded-full p-0.5 pr-1 transition-colors hover:bg-slate-100"
        >
          <Avatar name={name} src={profile.photoURL} size="md" />
          <ChevronDown size={14} strokeWidth={1.8} className="hidden text-slate-400 sm:block" />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-12 z-40 w-64 animate-slide-up overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-soft"
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-medium text-slate-800">{name}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <div className="p-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <Settings2 size={16} strokeWidth={1.8} className="text-slate-400" />
                Edit profile
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={signOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <LogOut size={16} strokeWidth={1.8} className="text-slate-400" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
      <ProfileModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
