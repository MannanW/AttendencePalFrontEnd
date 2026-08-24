import { AppData } from './types';

const STORAGE_KEY = 'attendance_tracker_v1';
const LEGACY_KEY = 'attendance_data_v1';

export const EMPTY_DATA: AppData = {
  version: 1,
  subjects: [],
  terms: [],
  schedule: [],
  holidays: [],
  lastMarkedAt: null,
  isOnboarded: false,
};

function webStore(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.subjects) &&
    Array.isArray(v.schedule) &&
    Array.isArray(v.terms) &&
    Array.isArray(v.holidays)
  );
}

export function normalizeData(raw: unknown): AppData {
  if (!isAppData(raw)) {
    throw new Error('Invalid attendance backup');
  }
  return {
    ...EMPTY_DATA,
    ...raw,
    subjects: raw.subjects ?? [],
    terms: raw.terms ?? [],
    schedule: raw.schedule ?? [],
    holidays: raw.holidays ?? [],
    version: typeof raw.version === 'number' ? raw.version : 1,
    lastMarkedAt: raw.lastMarkedAt ?? null,
    isOnboarded: Boolean(raw.isOnboarded),
  };
}

export async function loadData(): Promise<AppData> {
  try {
    const store = webStore();
    if (!store) return { ...EMPTY_DATA };

    const raw = store.getItem(STORAGE_KEY);
    if (raw) {
      return normalizeData(JSON.parse(raw));
    }

    const legacy = store.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = normalizeData(JSON.parse(legacy));
      await saveData(parsed);
      store.removeItem(LEGACY_KEY);
      return parsed;
    }
  } catch {
    // corrupt JSON, missing store, or invalid shape
  }
  return { ...EMPTY_DATA };
}

export async function saveData(data: AppData): Promise<void> {
  try {
    const store = webStore();
    store?.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable
  }
}

export async function exportData(data: AppData): Promise<string> {
  return JSON.stringify(data, null, 2);
}

export async function importData(json: string): Promise<AppData> {
  return normalizeData(JSON.parse(json));
}
