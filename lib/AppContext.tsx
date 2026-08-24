import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { AppData, ScheduleEntry, MarkStatus, Subject } from './types';
import { loadData, saveData, EMPTY_DATA } from './storage';
import { generateSeedData } from './seed';
import { getWeekStart, todayStr } from './attendance';

interface AppContextValue {
  data: AppData;
  loading: boolean;
  markEntry: (entryId: string, status: MarkStatus) => void;
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  addScheduleEntries: (entries: Omit<ScheduleEntry, 'id'>[]) => void;
  loadSampleData: () => void;
  clearAllData: () => void;
  importFromJson: (json: string) => Promise<void>;
  exportToJson: () => string;
  undoLastMark: () => void;
  canUndo: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoStack = useRef<{ entryId: string; prevStatus: MarkStatus }[]>([]);

  useEffect(() => {
    loadData().then((loaded) => {
      setData(loaded);
      setLoading(false);
    });
  }, []);

  // Debounced save
  const scheduleSave = useCallback((newData: AppData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveData(newData);
    }, 500);
  }, []);

  const updateData = useCallback(
    (updater: (prev: AppData) => AppData) => {
      setData((prev) => {
        const next = updater(prev);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  const markEntry = useCallback(
    (entryId: string, status: MarkStatus) => {
      updateData((prev) => {
        const entry = prev.schedule.find((e) => e.id === entryId);
        if (entry) {
          undoStack.current.push({ entryId, prevStatus: entry.status });
          if (undoStack.current.length > 50) undoStack.current.shift();
        }
        return {
          ...prev,
          schedule: prev.schedule.map((e) =>
            e.id === entryId ? { ...e, status } : e
          ),
          lastMarkedAt: new Date().toISOString(),
        };
      });
    },
    [updateData]
  );

  const addSubject = useCallback(
    (subject: Omit<Subject, 'id'>) => {
      updateData((prev) => ({
        ...prev,
        subjects: [
          ...prev.subjects,
          {
            ...subject,
            id: `s_${Date.now().toString(36)}_${Math.random()
              .toString(36)
              .slice(2, 7)}`,
          },
        ],
      }));
    },
    [updateData]
  );

  const addScheduleEntries = useCallback(
    (entries: Omit<ScheduleEntry, 'id'>[]) => {
      updateData((prev) => ({
        ...prev,
        schedule: [
          ...prev.schedule,
          ...entries.map((e) => ({
            ...e,
            id: `e_${Date.now().toString(36)}_${Math.random()
              .toString(36)
              .slice(2, 7)}`,
          })),
        ],
        isOnboarded: true,
      }));
    },
    [updateData]
  );

  const loadSampleData = useCallback(() => {
    const seed = generateSeedData();
    setData(seed);
    saveData(seed);
  }, []);

  const clearAllData = useCallback(() => {
    const cleared = { ...EMPTY_DATA };
    setData(cleared);
    saveData(cleared);
    undoStack.current = [];
  }, []);

  const importFromJson = useCallback(async (json: string) => {
    const parsed = JSON.parse(json) as AppData;
    const merged = { ...EMPTY_DATA, ...parsed };
    setData(merged);
    saveData(merged);
  }, []);

  const exportToJson = useCallback(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  const undoLastMark = useCallback(() => {
    const last = undoStack.current.pop();
    if (!last) return;
    updateData((prev) => ({
      ...prev,
      schedule: prev.schedule.map((e) =>
        e.id === last.entryId ? { ...e, status: last.prevStatus } : e
      ),
    }));
  }, [updateData]);

  const value: AppContextValue = {
    data,
    loading,
    markEntry,
    addSubject,
    addScheduleEntries,
    loadSampleData,
    clearAllData,
    importFromJson,
    exportToJson,
    undoLastMark,
    canUndo: undoStack.current.length > 0,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
