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

export async function loadData(): Promise<AppData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      return { ...EMPTY_DATA, ...parsed };
    }
    // Migrate from legacy key
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as AppData;
      await saveData(parsed);
      localStorage.removeItem(LEGACY_KEY);
      return { ...EMPTY_DATA, ...parsed };
    }
  } catch {
    // fall through
  }
  return { ...EMPTY_DATA };
}

export async function saveData(data: AppData): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable
  }
}

export async function exportData(data: AppData): Promise<string> {
  return JSON.stringify(data, null, 2);
}

export async function importData(json: string): Promise<AppData> {
  const parsed = JSON.parse(json) as AppData;
  return { ...EMPTY_DATA, ...parsed };
}
