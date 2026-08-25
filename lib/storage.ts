import { AppData, MarkStatus } from './types';
import { getWeekStart, parseLocalDate } from './attendance';

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
  notificationsEnabled: false,
  notificationMinutesBefore: 10,
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

async function readStored(key: string): Promise<string | null> {
  if (!isWeb()) return (await secureStore()).getItemAsync(key);
  return webStore()?.getItem(key) ?? null;
}

async function writeStored(key: string, value: string): Promise<void> {
  if (!isWeb()) {
    const store = await secureStore();
    await store.setItemAsync(key, value, { keychainAccessible: store.AFTER_FIRST_UNLOCK });
    return;
  }
  webStore()?.setItem(key, value);
}

async function removeStored(key: string): Promise<void> {
  if (!isWeb()) {
    await (await secureStore()).deleteItemAsync(key);
    return;
  }
  webStore()?.removeItem(key);
}

function isWeb(): boolean {
  return typeof document !== 'undefined';
}

async function secureStore() {
  return import('expo-secure-store');
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
    subjects: raw.subjects.slice(0, MAX_SUBJECTS).filter(isRecord).map((subject) => ({
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
    notificationsEnabled: Boolean(raw.notificationsEnabled),
    notificationMinutesBefore: typeof raw.notificationMinutesBefore === 'number'
      ? Math.min(120, Math.max(0, Math.floor(raw.notificationMinutesBefore)))
      : 10,
    version: typeof raw.version === 'number' ? raw.version : 1,
    lastMarkedAt: raw.lastMarkedAt ?? null,
    isOnboarded: Boolean(raw.isOnboarded),
  };
}

export async function loadData(): Promise<AppData> {
  try {
    const raw = await readStored(STORAGE_KEY);
    if (raw) {
      if (raw.length > MAX_BACKUP_LENGTH) return { ...EMPTY_DATA };
      return normalizeData(JSON.parse(raw));
    }

    const legacy = await readStored(LEGACY_KEY);
    if (legacy) {
      const parsed = normalizeData(JSON.parse(legacy));
      await saveData(parsed);
      await removeStored(LEGACY_KEY);
      return parsed;
    }
  } catch {
    // corrupt JSON, missing store, or invalid shape
  }
  return { ...EMPTY_DATA };
}

export async function saveData(data: AppData): Promise<void> {
  try {
    await writeStored(STORAGE_KEY, JSON.stringify(data));
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
  try {
    return normalizeData(JSON.parse(json));
  } catch {
    return normalizeData(parseCsvBackup(json));
  }
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

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object';
}

function parseCsvBackup(csv: string): AppData {
  const rows = csv.trim().split(/\r?\n/).map(parseCsvRow);
  const header = rows.shift()?.map((cell) => cell.toLowerCase()) ?? [];
  const index = (name: string) => header.indexOf(name);
  const dateAt = index('date');
  const subjectAt = index('subject');
  if (dateAt < 0 || subjectAt < 0) throw new Error('Invalid CSV backup');
  const subjectNames = [...new Set(rows.map((row) => row[subjectAt]).filter(Boolean))];
  const subjects = subjectNames.map((name, id) => ({ id: `csv_subject_${id}`, name, colorHex: '#0E7C4F', targetPercent: 75, aliases: [] }));
  const subjectIds = new Map(subjects.map((subject) => [subject.name, subject.id]));
  const termId = 'csv_term';
  const schedule = rows.flatMap((row, id) => {
    const date = row[dateAt];
    const subjectId = subjectIds.get(row[subjectAt]);
    if (!subjectId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
    const parsed = parseLocalDate(date);
    const rawStatus = row[index('status')];
    const status: MarkStatus = validStatus(rawStatus) ? rawStatus : 'unmarked';
    return [{ id: `csv_entry_${id}`, termId, weekStartDate: getWeekStart(date), dayInt: (parsed.getDay() + 6) % 7, startMin: clampNumber(Number(row[index('start_min')]), 0, 1440), endMin: clampNumber(Number(row[index('end_min')]), 0, 1440), subjectId, room: row[index('room')] ?? '', status, note: row[index('note')] ?? '', isExtra: false }];
  });
  return { ...EMPTY_DATA, isOnboarded: subjects.length > 0, subjects, terms: [{ id: termId, name: 'Imported Term', startDate: '2000-01-01', endDate: '2099-12-31', isActive: true }], schedule };
}

function parseCsvRow(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') { cell += '"'; index++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { cells.push(cell); cell = ''; }
    else cell += char;
  }
  cells.push(cell);
  return cells;
}
