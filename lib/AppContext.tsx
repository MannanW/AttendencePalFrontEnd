import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { AppData, ScheduleEntry, MarkStatus, Subject } from './types';
import { loadData, saveData, EMPTY_DATA, importData } from './storage';
import { generateSeedData } from './seed';
import { addDays, buildDerived, DerivedState, getWeekStart, todayStr } from './attendance';
import { buildInsights, buildPhase3Cache, buildWeeklySnapshots, toCsv } from './phase3';
import { uid } from './ids';
import { cancelClassReminders, requestNotificationPermission, rescheduleClassReminders } from './notifications';

interface AppContextValue {
  data: AppData;
  loading: boolean;
  derived: DerivedState;
  markEntry: (entryId: string, status: MarkStatus) => void;
  completeManualSetup: (
    subjects: Omit<Subject, 'id'>[],
    slots: (Omit<ScheduleEntry, 'id' | 'subjectId'> & { subjectIdx: number })[]
  ) => void;
  loadSampleData: () => void;
  clearAllData: () => void;
  importFromJson: (json: string) => Promise<void>;
  exportToJson: () => string;
  undoLastMark: () => void;
  addExtraClass: (entry: Omit<ScheduleEntry, 'id' | 'isExtra'>) => boolean;
  updateEntry: (entryId: string, patch: Partial<ScheduleEntry>) => void;
  metricMode: 'count' | 'hours';
  setMetricMode: (mode: 'count' | 'hours') => void;
  exportCsv: () => string;
  closeTerm: (termId: string) => void;
  reopenTerm: (termId: string) => void;
  bulkPause: (fromDate: string, toDate: string) => void;
  copyDaySchedule: (fromDay: number, toDay: number, weekStartDate: string) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  canUndo: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [undoCount, setUndoCount] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef(data);
  const undoStack = useRef<{ entryId: string; prevStatus: MarkStatus }[]>([]);
  latestData.current = data;

  useEffect(() => {
    let live = true;
    loadData()
      .then((d) => {
        if (!live) return;
        setData(d);
      })
      .catch(() => live && setData({ ...EMPTY_DATA }))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        void saveData(latestData.current);
      }
    };
  }, []);

  const persist = useCallback((next: AppData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveData(next);
      if (next.notificationsEnabled) {
        void rescheduleClassReminders(next, next.notificationMinutesBefore ?? 10).catch(() => undefined);
      }
    }, 400);
  }, []);

  const commit = useCallback(
    (next: AppData, resetUndo = false) => {
      if (resetUndo) {
        undoStack.current = [];
        setUndoCount(0);
      }
      const enriched = refreshPhase3(next);
      setData(enriched);
      void saveData(enriched);
      if (enriched.notificationsEnabled) {
        void rescheduleClassReminders(enriched, enriched.notificationMinutesBefore ?? 10).catch(() => undefined);
      }
    },
    []
  );

  const patch = useCallback(
    (fn: (prev: AppData) => AppData) => {
      setData((prev) => {
        const next = fn(prev);
        if (next !== prev) {
          const enriched = refreshPhase3(next);
          persist(enriched);
          return enriched;
        }
        return prev;
      });
    },
    [persist]
  );

  const markEntry = useCallback(
    (entryId: string, status: MarkStatus) => {
      patch((prev) => {
        const entry = prev.schedule.find((e) => e.id === entryId);
        if (!entry || entry.status === status) return prev;
        undoStack.current.push({ entryId, prevStatus: entry.status });
        if (undoStack.current.length > 40) undoStack.current.shift();
        setUndoCount(undoStack.current.length);
        return {
          ...prev,
          lastMarkedAt: new Date().toISOString(),
          schedule: prev.schedule.map((e) =>
            e.id === entryId ? { ...e, status } : e
          ),
        };
      });
    },
    [patch]
  );

  useEffect(() => {
    if (typeof document !== 'undefined') return;
    let subscription: { remove: () => void } | undefined;
    void import('expo-notifications').then((Notifications) => {
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const entryId = response.notification.request.content.data?.entryId;
        const action = response.actionIdentifier;
        if (typeof entryId !== 'string') return;
        if (action === 'attended' || action === 'late' || action === 'missed') {
          markEntry(entryId, action);
        }
      });
    }).catch(() => undefined);
    return () => subscription?.remove();
  }, [markEntry]);

  const undoLastMark = useCallback(() => {
    const last = undoStack.current.pop();
    if (!last) return;
    setUndoCount(undoStack.current.length);
    patch((prev) => ({
      ...prev,
      schedule: prev.schedule.map((e) =>
        e.id === last.entryId ? { ...e, status: last.prevStatus } : e
      ),
    }));
  }, [patch]);

  const setMetricMode = useCallback((metricMode: 'count' | 'hours') => {
    patch((prev) => ({ ...prev, metricMode }));
  }, [patch]);

  const exportCsv = useCallback(() => toCsv(data), [data]);

  const closeTerm = useCallback((termId: string) => patch((prev) => ({
    ...prev,
    terms: prev.terms.map((term) => term.id === termId ? { ...term, isActive: false } : term),
  })), [patch]);

  const reopenTerm = useCallback((termId: string) => patch((prev) => ({
    ...prev,
    terms: prev.terms.map((term) => ({ ...term, isActive: term.id === termId })),
  })), [patch]);

  const bulkPause = useCallback((fromDate: string, toDate: string) => patch((prev) => ({
    ...prev,
    schedule: prev.schedule.map((entry) => {
      const actual = new Date(addDays(entry.weekStartDate, entry.dayInt));
      const start = new Date(fromDate);
      const end = new Date(toDate);
      return actual >= start && actual <= end ? { ...entry, status: 'cancelled' } : entry;
    }),
  })), [patch]);

  const copyDaySchedule = useCallback((fromDay: number, toDay: number, weekStartDate: string) => patch((prev) => {
    const source = prev.schedule.filter((entry) => entry.dayInt === fromDay && entry.weekStartDate === weekStartDate);
    const conflicts = prev.schedule.some((entry) => entry.dayInt === toDay && entry.weekStartDate === weekStartDate);
    if (conflicts || source.length === 0) return prev;
    return { ...prev, schedule: [...prev.schedule, ...source.map((entry) => ({ ...entry, id: uid('e'), dayInt: toDay, status: 'unmarked' as const }))] };
  }), [patch]);

  const addExtraClass = useCallback(
    (entry: Omit<ScheduleEntry, 'id' | 'isExtra'>) => {
      const conflict = data.schedule.some((candidate) =>
          candidate.weekStartDate === entry.weekStartDate &&
          candidate.dayInt === entry.dayInt &&
          entry.startMin < candidate.endMin &&
          entry.endMin > candidate.startMin
      );
      if (conflict) return false;
      const next = refreshPhase3({ ...data, schedule: [...data.schedule, { ...entry, id: uid('e'), isExtra: true }] });
      setData(next);
      persist(next);
      return true;
    },
    [data, persist]
  );

  const updateEntry = useCallback(
    (entryId: string, changes: Partial<ScheduleEntry>) => {
      patch((prev) => ({
        ...prev,
        schedule: prev.schedule.map((entry) => entry.id === entryId ? { ...entry, ...changes } : entry),
      }));
    },
    [patch]
  );

  const completeManualSetup = useCallback(
    (
      subjects: Omit<Subject, 'id'>[],
      slots: (Omit<ScheduleEntry, 'id' | 'subjectId'> & { subjectIdx: number })[]
    ) => {
      const created = subjects.map((s) => ({ ...s, id: uid('s') }));
      const termStart = getWeekStart(new Date().toISOString().slice(0, 10));
      commit(
        {
          ...EMPTY_DATA,
          isOnboarded: true,
          terms: [{
            id: 'manual',
            name: 'Current Term',
            startDate: termStart,
            endDate: `${termStart.slice(0, 4)}-12-31`,
            isActive: true,
          }],
          subjects: created,
          schedule: slots
            .filter((s) => s.subjectIdx >= 0 && s.subjectIdx < created.length)
            .map(({ subjectIdx, ...rest }) => ({
              ...rest,
              id: uid('e'),
              subjectId: created[subjectIdx].id,
            })),
        },
        true
      );
    },
    [commit]
  );

  const loadSampleData = useCallback(() => commit(generateSeedData(), true), [commit]);
  const clearAllData = useCallback(() => commit({ ...EMPTY_DATA }, true), [commit]);

  const importFromJson = useCallback(
    async (json: string) => commit(await importData(json), true),
    [commit]
  );

  const exportToJson = useCallback(() => JSON.stringify(data, null, 2), [data]);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    if (enabled && !(await requestNotificationPermission())) return;
    patch((prev) => ({ ...prev, notificationsEnabled: enabled }));
    if (enabled) {
      await rescheduleClassReminders(data, data.notificationMinutesBefore ?? 10).catch(() => undefined);
    } else {
      await cancelClassReminders().catch(() => undefined);
    }
  }, [data, patch]);

  const derived = useMemo(() => buildDerived(data), [data]);

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      loading,
      derived,
      markEntry,
      completeManualSetup,
      loadSampleData,
      clearAllData,
      importFromJson,
      exportToJson,
      undoLastMark,
      addExtraClass,
      updateEntry,
      canUndo: undoCount > 0,
      metricMode: data.metricMode ?? 'count',
      setMetricMode,
      exportCsv,
      closeTerm,
      reopenTerm,
      bulkPause,
      copyDaySchedule,
      notificationsEnabled: data.notificationsEnabled ?? false,
      setNotificationsEnabled,
    }),
    [
      data,
      loading,
      derived,
      markEntry,
      completeManualSetup,
      loadSampleData,
      clearAllData,
      importFromJson,
      exportToJson,
      undoLastMark,
      addExtraClass,
      updateEntry,
      undoCount,
      setMetricMode,
      exportCsv,
      closeTerm,
      reopenTerm,
      bulkPause,
      copyDaySchedule,
      setNotificationsEnabled,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function refreshPhase3(data: AppData): AppData {
  const today = todayStr();
  return {
    ...data,
    phase3Cache: buildPhase3Cache(data, today),
    weeklySnapshots: buildWeeklySnapshots(data),
    insights: buildInsights(data),
  };
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
