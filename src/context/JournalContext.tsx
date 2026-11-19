import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { parseISO } from 'date-fns';
import {
  localDateKey,
  sectionPermissions,
  type SectionKind,
  type SectionPermissions,
} from '../../shared/time';
import {
  deleteSection,
  getServerClock,
  loadDays,
  saveHappened,
  saveTarget,
} from '../services/dayService';
import type {
  DayRecord,
  HappenedRecord,
  SectionPayload,
  TargetRecord,
} from '../types';
import { useAuth } from './AuthContext';

interface JournalContextValue {
  days: DayRecord[];
  targetByDate: Map<string, TargetRecord>;
  happenedByDate: Map<string, HappenedRecord>;
  serverNow: string;
  serverTodayKey: string;
  getTodayKey: (timeZone?: string) => string;
  permissionsFor: (date: string, record?: TargetRecord | HappenedRecord | null) => SectionPermissions;
  visibleMonth: Date;
  setVisibleMonth: (month: Date) => void;
  selectedDate: string;
  isDrawerOpen: boolean;
  openEditor: (date: string) => void;
  closeEditor: () => void;
  saveTargetRecord: (date: string, payload: SectionPayload<TargetRecord>) => Promise<void>;
  saveHappenedRecord: (date: string, payload: SectionPayload<HappenedRecord>) => Promise<void>;
  deleteDaySection: (date: string, kind: SectionKind) => Promise<void>;
}

const JournalContext = createContext<JournalContextValue | null>(null);

export function JournalProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [days, setDays] = useState<DayRecord[]>([]);
  const [serverNow, setServerNow] = useState(() => new Date().toISOString());
  const [serverTodayKey, setServerTodayKey] = useState(() =>
    localDateKey(new Date(), profile.timeZone),
  );
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => parseISO(serverTodayKey));
  const [selectedDate, setSelectedDate] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const daysRefreshId = useRef(0);
  const clockRefreshId = useRef(0);

  const refreshDays = useCallback(async () => {
    const requestId = ++daysRefreshId.current;
    if (!user) {
      setDays([]);
      return;
    }
    try {
      const nextDays = await loadDays(user.uid);
      // Ignore a response from an earlier request that may have been reordered.
      if (requestId === daysRefreshId.current) setDays(nextDays);
    } catch (error) {
      console.error('Failed to load journal days', error);
    }
  }, [user]);

  const refreshClock = useCallback(async () => {
    const requestId = ++clockRefreshId.current;
    try {
      const clock = await getServerClock(profile.timeZone);
      if (requestId !== clockRefreshId.current) return;
      setServerNow(clock.now);
      setServerTodayKey(clock.todayKey);
    } catch (error) {
      console.error('Failed to refresh server clock', error);
    }
  }, [profile.timeZone]);

  useEffect(() => {
    void refreshDays();
  }, [refreshDays]);

  useEffect(() => {
    void refreshClock();
    // Re-check periodically so a midnight transition is reflected while the
    // app stays open, even without a page reload.
    const interval = window.setInterval(() => void refreshClock(), 15_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshClock();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [refreshClock]);

  const targetByDate = useMemo(
    () => new Map(days.filter((day) => day.target).map((day) => [day.date, day.target!])),
    [days],
  );
  const happenedByDate = useMemo(
    () => new Map(days.filter((day) => day.happened).map((day) => [day.date, day.happened!])),
    [days],
  );

  const getTodayKey = useCallback(
    (timeZone?: string) => localDateKey(parseISO(serverNow), timeZone ?? profile.timeZone),
    [serverNow, profile.timeZone],
  );

  const permissionsFor = useCallback(
    (date: string, record?: TargetRecord | HappenedRecord | null) =>
      sectionPermissions(date, getTodayKey(record?.timeZone)),
    [getTodayKey],
  );

  const openEditor = useCallback((date: string) => {
    setSelectedDate(date);
    setVisibleMonth(parseISO(date));
    setIsDrawerOpen(true);
  }, []);

  const closeEditor = useCallback(() => setIsDrawerOpen(false), []);

  const serviceOptions = useMemo(
    () => ({ userTimeZone: profile.timeZone, serverNow }),
    [profile.timeZone, serverNow],
  );

  const optionsForDay = useCallback(
    (date: string) => ({
      ...serviceOptions,
      dayTimeZone:
        targetByDate.get(date)?.timeZone ?? happenedByDate.get(date)?.timeZone ?? undefined,
    }),
    [serviceOptions, targetByDate, happenedByDate],
  );

  const saveTargetRecord = useCallback(
    async (date: string, payload: SectionPayload<TargetRecord>) => {
      if (!user) return;
      await saveTarget(user.uid, date, payload, optionsForDay(date));
      await refreshDays();
    },
    [user, optionsForDay, refreshDays],
  );

  const saveHappenedRecord = useCallback(
    async (date: string, payload: SectionPayload<HappenedRecord>) => {
      if (!user) return;
      await saveHappened(user.uid, date, payload, optionsForDay(date));
      await refreshDays();
    },
    [user, optionsForDay, refreshDays],
  );

  const deleteDaySection = useCallback(
    async (date: string, kind: SectionKind) => {
      if (!user) return;
      await deleteSection(user.uid, date, kind, optionsForDay(date));
      await refreshDays();
    },
    [user, optionsForDay, refreshDays],
  );

  const value = useMemo(
    () => ({
      days,
      targetByDate,
      happenedByDate,
      serverNow,
      serverTodayKey,
      getTodayKey,
      permissionsFor,
      visibleMonth,
      setVisibleMonth,
      selectedDate,
      isDrawerOpen,
      openEditor,
      closeEditor,
      saveTargetRecord,
      saveHappenedRecord,
      deleteDaySection,
    }),
    [
      days,
      targetByDate,
      happenedByDate,
      serverNow,
      serverTodayKey,
      getTodayKey,
      permissionsFor,
      visibleMonth,
      selectedDate,
      isDrawerOpen,
      openEditor,
      closeEditor,
      saveTargetRecord,
      saveHappenedRecord,
      deleteDaySection,
    ],
  );

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal(): JournalContextValue {
  const context = useContext(JournalContext);
  if (!context) throw new Error('useJournal must be used inside JournalProvider');
  return context;
}
