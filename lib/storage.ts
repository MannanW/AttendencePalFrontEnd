import { AppData, MarkStatus } from './types';

const STORAGE_KEY = 'attendance_tracker_v1';
const LEGACY_KEY = 'attendance_data_v1';
const MAX_BACKUP_LENGTH = 2_000_000;
const MAX_SUBJECTS = 200;
const MAX_SCHEDULE_ENTRIES = 20_000;

export const EMPTY_DATA: AppData = {
  version: 1,
  subjects: [],
  terms: [],
  schedule: [],
  holidays: [],
  adHocEvents: [],
  weeklySnapshots: [],
  insights: [],
  phase3Cache: undefined,
  metricMode: 'count',
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
    subjects: raw.subjects.slice(0, MAX_SUBJECTS).map((subject) => ({
      ...subject,
      id: safeText(subject.id, 100),
      name: safeText(subject.name, 200),
      colorHex: safeText(subject.colorHex, 20),
      aliases: Array.isArray(subject.aliases) ? subject.aliases.filter((alias): alias is string => typeof alias === 'string').slice(0, 20).map((alias) => alias.slice(0, 80)) : [],
      targetPercent: Number.isFinite(subject.targetPercent) ? Math.min(99, Math.max(1, subject.targetPercent)) : 75,
    })).filter((subject) => subject.id.length > 0 && subject.name.length > 0),
    terms: raw.terms.filter((term) => term && typeof term.id === 'string' && typeof term.startDate === 'string' && typeof term.endDate === 'string').slice(0, 20).map((term) => ({
      ...term,
      id: safeText(term.id, 100),
      name: safeText(term.name, 200),
      startDate: safeText(term.startDate, 10),
      endDate: safeText(term.endDate, 10),
    })),
    schedule: raw.schedule.slice(0, MAX_SCHEDULE_ENTRIES).filter((entry) => entry && typeof entry.id === 'string' && typeof entry.subjectId === 'string').map((entry) => ({
      ...entry,
      id: safeText(entry.id, 100),
      termId: safeText(entry.termId, 100),
      subjectId: safeText(entry.subjectId, 100),
      room: safeText(entry.room, 100),
      note: safeText(entry.note, 1000),
      startMin: clampNumber(entry.startMin, 0, 1440),
      endMin: clampNumber(entry.endMin, 0, 1440),
      dayInt: Math.floor(clampNumber(entry.dayInt, 0, 6)),
      status: validStatus(entry.status) ? entry.status : 'unmarked',
      isExtra: Boolean(entry.isExtra),
    })),
    holidays: raw.holidays ?? [],
    adHocEvents: raw.adHocEvents ?? [],
    weeklySnapshots: raw.weeklySnapshots ?? [],
    insights: raw.insights ?? [],
    phase3Cache: raw.phase3Cache && {
      ...EMPTY_DATA.phase3Cache,
      ...raw.phase3Cache,
      overallMinutes: { ...EMPTY_DATA.phase3Cache?.overallMinutes, ...raw.phase3Cache.overallMinutes },
      counted: raw.phase3Cache.counted ?? { attended: 0, missed: 0, total: 0 },
      whatIf: raw.phase3Cache.whatIf ?? { attendNext: 0, missNext: 0 },
    },
    metricMode: raw.metricMode === 'hours' ? 'hours' : 'count',
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
      if (raw.length > MAX_BACKUP_LENGTH) return { ...EMPTY_DATA };
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
  if (typeof json !== 'string' || json.length > MAX_BACKUP_LENGTH) {
    throw new Error('Backup is too large');
  }
  return normalizeData(JSON.parse(json));
}

function safeText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function clampNumber(value: unknown, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}

function validStatus(value: unknown): value is MarkStatus {
  return value === 'unmarked' || value === 'attended' || value === 'missed' || value === 'late' || value === 'official_leave' || value === 'cancelled' || value === 'holiday';
}
