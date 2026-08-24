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
import { loadData, saveData, EMPTY_DATA, normalizeData } from './storage';
import { generateSeedData } from './seed';
import { buildDerived, DerivedState } from './attendance';

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
  canUndo: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const uid = (p: string) =>
  `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [undoCount, setUndoCount] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoStack = useRef<{ entryId: string; prevStatus: MarkStatus }[]>([]);

  useEffect(() => {
    let live = true;
    loadData()
      .then((d) => live && setData(d))
      .catch(() => live && setData({ ...EMPTY_DATA }))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const persist = useCallback((next: AppData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveData(next), 400);
  }, []);

  const commit = useCallback(
    (next: AppData, resetUndo = false) => {
      if (resetUndo) {
        undoStack.current = [];
        setUndoCount(0);
      }
      setData(next);
      void saveData(next);
    },
    []
  );

  const patch = useCallback(
    (fn: (prev: AppData) => AppData) => {
      setData((prev) => {
        const next = fn(prev);
        if (next !== prev) persist(next);
        return next;
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

  const completeManualSetup = useCallback(
    (
      subjects: Omit<Subject, 'id'>[],
      slots: (Omit<ScheduleEntry, 'id' | 'subjectId'> & { subjectIdx: number })[]
    ) => {
      const created = subjects.map((s) => ({ ...s, id: uid('s') }));
      commit(
        {
          ...EMPTY_DATA,
          isOnboarded: true,
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
    async (json: string) => commit(normalizeData(JSON.parse(json)), true),
    [commit]
  );

  const exportToJson = useCallback(() => JSON.stringify(data, null, 2), [data]);

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
      canUndo: undoCount > 0,
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
      undoCount,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
