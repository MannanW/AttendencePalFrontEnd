import { AppData, MarkStatus, ScheduleEntry, Subject } from './types';

export interface SubjectStats {
  subjectId: string;
  attended: number;
  missed: number;
  late: number;
  officialLeave: number;
  total: number; // counted classes (attended + missed + late + official_leave)
  percent: number;
  buffer: number; // classes can miss
  mustAttend: number; // classes must attend to reach target
  target: number;
}

export interface OverallStats {
  attended: number;
  missed: number;
  late: number;
  officialLeave: number;
  total: number;
  percent: number;
  buffer: number;
  mustAttend: number;
}

export function isCounted(status: MarkStatus): boolean {
  return (
    status === 'attended' ||
    status === 'missed' ||
    status === 'late' ||
    status === 'official_leave'
  );
}

export function computeSubjectStats(
  entries: ScheduleEntry[],
  subject: Subject
): SubjectStats {
  const subjectEntries = entries.filter(
    (e) => e.subjectId === subject.id && isCounted(e.status)
  );

  let attended = 0;
  let missed = 0;
  let late = 0;
  let officialLeave = 0;

  for (const e of subjectEntries) {
    if (e.status === 'attended') attended++;
    else if (e.status === 'missed') missed++;
    else if (e.status === 'late') late++;
    else if (e.status === 'official_leave') officialLeave++;
  }

  // Late counts as attended (with weight later, for now count as attended)
  const effectiveAttended = attended + late + officialLeave;
  const total = effectiveAttended + missed;
  const percent = total > 0 ? (effectiveAttended / total) * 100 : 0;
  const target = subject.targetPercent;

  // Buffer: how many more can you miss before dropping below target
  // (attended / (attended + missed + X)) >= target/100
  // attended >= target/100 * (attended + missed + X)
  // X <= attended * (100 - target) / target - missed
  let buffer = 0;
  if (total > 0 && percent >= target) {
    buffer = Math.floor(
      (effectiveAttended * (100 - target)) / target - missed
    );
  }

  // Must attend: how many consecutive classes must attend to reach target
  // ((attended + Y) / (attended + missed + Y)) >= target/100
  // Y >= (target * missed - (100 - target) * attended) / (100 - target)
  let mustAttend = 0;
  if (total > 0 && percent < target) {
    const needed = Math.ceil(
      (target * missed - (100 - target) * effectiveAttended) / (100 - target)
    );
    mustAttend = Math.max(0, needed);
  }

  return {
    subjectId: subject.id,
    attended,
    missed,
    late,
    officialLeave,
    total,
    percent,
    buffer,
    mustAttend,
    target,
  };
}

export function computeOverallStats(data: AppData): OverallStats {
  let attended = 0;
  let missed = 0;
  let late = 0;
  let officialLeave = 0;

  for (const e of data.schedule) {
    if (!isCounted(e.status)) continue;
    if (e.status === 'attended') attended++;
    else if (e.status === 'missed') missed++;
    else if (e.status === 'late') late++;
    else if (e.status === 'official_leave') officialLeave++;
  }

  const effectiveAttended = attended + late + officialLeave;
  const total = effectiveAttended + missed;
  const percent = total > 0 ? (effectiveAttended / total) * 100 : 0;
  const target = 75;

  let buffer = 0;
  if (total > 0 && percent >= target) {
    buffer = Math.floor(
      (effectiveAttended * (100 - target)) / target - missed
    );
  }

  let mustAttend = 0;
  if (total > 0 && percent < target) {
    const needed = Math.ceil(
      (target * missed - (100 - target) * effectiveAttended) / (100 - target)
    );
    mustAttend = Math.max(0, needed);
  }

  return {
    attended,
    missed,
    late,
    officialLeave,
    total,
    percent,
    buffer,
    mustAttend,
  };
}

export function getEntriesForDate(
  data: AppData,
  dateStr: string
): ScheduleEntry[] {
  const date = new Date(dateStr + 'T00:00:00');
  const dayInt = (date.getDay() + 6) % 7; // 0=Mon
  const weekStart = getWeekStart(dateStr);

  return data.schedule
    .filter((e) => e.dayInt === dayInt && e.weekStartDate === weekStart)
    .sort((a, b) => a.startMin - b.startMin);
}

export function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const day = (date.getDay() + 6) % 7; // 0=Mon
  const monday = new Date(date);
  monday.setDate(date.getDate() - day);
  return monday.toISOString().slice(0, 10);
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayStr(): string {
  return formatDate(new Date());
}

export function minToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

export function getUnmarkedCount(data: AppData): number {
  return data.schedule.filter((e) => e.status === 'unmarked').length;
}

export function getStreakDays(data: AppData): number {
  if (!data.lastMarkedAt) return 0;
  // Simple streak: days since last marked (capped display)
  const last = new Date(data.lastMarkedAt);
  const now = new Date();
  const diffMs = now.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
