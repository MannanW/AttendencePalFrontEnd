import { AppData, MarkStatus, Phase3Cache, ScheduleEntry, Subject } from './types';
import { DEFAULT_TARGET } from './constants';

export interface SubjectStats {
  subjectId: string;
  attended: number;
  missed: number;
  late: number;
  officialLeave: number;
  effectiveAttended: number;
  total: number;
  percent: number;
  buffer: number;
  mustAttend: number;
  target: number;
  lateWeight: number;
}

export type OverallStats = Omit<SubjectStats, 'subjectId' | 'target' | 'lateWeight'>;

export interface DaySummary {
  attended: boolean;
  missed: boolean;
  hasUnmarked: boolean;
  officialLeave: boolean;
}

export interface DerivedState {
  overall: OverallStats;
  subjectStats: { subject: Subject; stats: SubjectStats }[];
  byDate: Record<string, ScheduleEntry[]>;
  daySummary: Record<string, DaySummary>;
  subjectById: Record<string, Subject>;
  holidays: Record<string, string>;
  today: string;
  todayEntries: ScheduleEntry[];
  unmarkedToday: number;
  recoveryEntries: ScheduleEntry[];
  streakDays: number;
  termEndProjection: number;
  searchIndex: { entry: ScheduleEntry; subject: Subject; text: string }[];
  insights: string[];
  phase3Cache?: Phase3Cache;
}

type Counts = {
  attended: number;
  missed: number;
  late: number;
  officialLeave: number;
};

const EMPTY_COUNTS = (): Counts => ({
  attended: 0,
  missed: 0,
  late: 0,
  officialLeave: 0,
});

export const emptyOverallStats = (): OverallStats => ({
  ...EMPTY_COUNTS(),
  effectiveAttended: 0,
  total: 0,
  percent: 0,
  buffer: 0,
  mustAttend: 0,
});

export function isCounted(status: MarkStatus): boolean {
  return (
    status === 'attended' ||
    status === 'missed' ||
    status === 'late' ||
    status === 'official_leave'
  );
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = (dateStr || '').split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const todayStr = () => formatDate(new Date());

export function addDays(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function getWeekStart(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return formatDate(date);
}

function bump(c: Counts, status: MarkStatus) {
  if (status === 'attended') c.attended++;
  else if (status === 'missed') c.missed++;
  else if (status === 'late') c.late++;
  else if (status === 'official_leave') c.officialLeave++;
}

function statsFromCounts(c: Counts, target = DEFAULT_TARGET, lateWeight = 1): OverallStats {
  const effectiveAttended = c.attended + c.late * lateWeight + c.officialLeave;
  const total = c.attended + c.late + c.officialLeave + c.missed;
  const percent = total ? (effectiveAttended / total) * 100 : 0;
  const t = Math.min(99, Math.max(1, target || DEFAULT_TARGET));
  const rest = 100 - t;
  return {
    ...c,
    effectiveAttended,
    total,
    percent,
    buffer:
      total && percent >= t
        ? Math.max(0, Math.floor((effectiveAttended * 100) / t - total))
        : 0,
    mustAttend:
      total && percent < t
        ? Math.max(0, Math.ceil((t * total - 100 * effectiveAttended) / rest))
        : 0,
  };
}

export function computeSubjectStats(
  entries: ScheduleEntry[] | undefined,
  subject: Subject
): SubjectStats {
  const c = EMPTY_COUNTS();
  for (const e of entries ?? []) {
    if (e.subjectId === subject.id) bump(c, e.status);
  }
  const target = Number.isFinite(subject.targetPercent)
    ? subject.targetPercent
    : DEFAULT_TARGET;
  const lateWeight = Number.isFinite(subject.lateWeight) ? Math.max(0, subject.lateWeight as number) : 1;
  return { subjectId: subject.id, target, ...statsFromCounts(c, target, lateWeight), lateWeight };
}

export function computeOverallStats(data: AppData): OverallStats {
  const c = EMPTY_COUNTS();
  for (const e of data?.schedule ?? []) bump(c, e.status);
  return statsFromCounts(c);
}

export function getEntriesForDate(data: AppData, dateStr: string): ScheduleEntry[] {
  if (!data?.schedule?.length) return [];
  const weekStart = getWeekStart(dateStr);
  const dayInt = (parseLocalDate(dateStr).getDay() + 6) % 7;
  return data.schedule
    .filter((e) => e.dayInt === dayInt && e.weekStartDate === weekStart)
    .sort((a, b) => a.startMin - b.startMin);
}

export function getUnmarkedCountForDate(data: AppData, dateStr: string): number {
  return getEntriesForDate(data, dateStr).reduce(
    (n, e) => n + (e.status === 'unmarked' ? 1 : 0),
    0
  );
}

export function minToTime(min: number): string {
  const safe = Number.isFinite(min) ? min : 0;
  const h = Math.floor(safe / 60);
  const m = Math.abs(Math.floor(safe % 60));
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function dayFlags(entries: ScheduleEntry[]): DaySummary {
  let attended = false;
  let missed = false;
  let hasUnmarked = false;
  let officialLeave = false;
  for (const e of entries) {
    if (e.status === 'unmarked') hasUnmarked = true;
    else if (e.status === 'missed') missed = true;
    else if (e.status === 'official_leave') officialLeave = true;
    else if (isCounted(e.status)) attended = true;
  }
  return { attended, missed, hasUnmarked, officialLeave };
}

/** Single pass over schedule: stats, date index, calendar dots. Call only when data changes. */
export function buildDerived(data: AppData, today = todayStr()): DerivedState {
  const schedule = data?.schedule ?? [];
  const subjects = data?.subjects ?? [];
  const overallC = EMPTY_COUNTS();
  const bySubject = new Map<string, Counts>();
  const byDate: Record<string, ScheduleEntry[]> = {};
  const subjectById: Record<string, Subject> = {};

  for (const s of subjects) {
    subjectById[s.id] = s;
    bySubject.set(s.id, EMPTY_COUNTS());
  }

  for (const e of schedule) {
    bump(overallC, e.status);
    const sc = bySubject.get(e.subjectId);
    if (sc) bump(sc, e.status);
    const dateKey = addDays(e.weekStartDate, e.dayInt);
    (byDate[dateKey] ||= []).push(e);
  }

  for (const list of Object.values(byDate)) {
    list.sort((a, b) => a.startMin - b.startMin);
  }

  const daySummary: Record<string, DaySummary> = {};
  for (const [date, entries] of Object.entries(byDate)) {
    daySummary[date] = dayFlags(entries);
  }

  const holidays: Record<string, string> = {};
  for (const h of data?.holidays ?? []) holidays[h.date] = h.label;

  const todayEntries = byDate[today] ?? [];
  const recoveryStart = data.lastMarkedAt?.slice(0, 10);

  return {
    overall: statsFromCounts(overallC),
    subjectStats: subjects.map((subject) => {
      const target = Number.isFinite(subject.targetPercent)
        ? subject.targetPercent
        : DEFAULT_TARGET;
      return {
        subject,
        stats: {
          subjectId: subject.id,
          target,
          ...statsFromCounts(
            bySubject.get(subject.id) ?? EMPTY_COUNTS(),
            target,
            Number.isFinite(subject.lateWeight) ? Math.max(0, subject.lateWeight as number) : 1
          ),
          lateWeight: Number.isFinite(subject.lateWeight)
            ? Math.max(0, subject.lateWeight as number)
            : 1,
        },
      };
    }),
    byDate,
    daySummary,
    subjectById,
    holidays,
    today,
    todayEntries,
    unmarkedToday: todayEntries.reduce(
      (n, e) => n + (e.status === 'unmarked' ? 1 : 0),
      0
    ),
    recoveryEntries: schedule
      .filter((entry) => {
        const date = addDays(entry.weekStartDate, entry.dayInt);
        return entry.status === 'unmarked' && date <= today && (!recoveryStart || date >= recoveryStart);
      })
      .sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate) || a.startMin - b.startMin),
    streakDays: data.phase3Cache?.streakDays ?? 0,
    termEndProjection: data.phase3Cache?.termEndProjection ?? 0,
    searchIndex: schedule.flatMap((entry) => {
      const subject = subjectById[entry.subjectId];
      if (!subject) return [];
      return [{ entry, subject, text: `${subject.name} ${subject.aliases.join(' ')} ${entry.note} ${entry.room}`.toLowerCase() }];
    }),
    insights: data.insights?.map((insight) => insight.insightText) ?? [],
    phase3Cache: data.phase3Cache,
  };
}

function calculateStreak(schedule: ScheduleEntry[], today: string): number {
  const markedDays = new Set(
    schedule
      .filter((entry) => entry.status === 'attended')
      .map((entry) => addDays(entry.weekStartDate, entry.dayInt))
  );
  let cursor = todayStr();
  let streak = 0;
  while (markedDays.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function calculateTermEndProjection(data: AppData, counts: Counts, today: string): number {
  const term = data.terms?.find((candidate) => candidate.isActive);
  if (!term) return statsFromCounts(counts).percent;
  const remaining = (data.schedule ?? []).filter((entry) => {
    const date = addDays(entry.weekStartDate, entry.dayInt);
    return date >= today && date <= term.endDate && entry.status === 'unmarked';
  }).length;
  const effectiveAttended = counts.attended + counts.late + counts.officialLeave;
  const total = effectiveAttended + counts.missed + remaining;
  return total ? ((effectiveAttended + remaining) / total) * 100 : 0;
}
