import { AppData, Insight, Phase3Cache, WeeklySnapshot } from './types';
import { addDays, isCounted } from './attendance';

export const EMPTY_PHASE3_CACHE: Phase3Cache = {
  generatedAt: null,
  streakDays: 0,
  termEndProjection: 0,
  overallMinutes: { attended: 0, missed: 0, late: 0 },
  counted: { attended: 0, missed: 0, total: 0 },
  whatIf: { attendNext: 0, missNext: 0 },
};

function dateOf(entry: AppData['schedule'][number]): string {
  return addDays(entry.weekStartDate, entry.dayInt);
}

export function buildPhase3Cache(data: AppData, today: string): Phase3Cache {
  const counted = data.schedule.filter((entry) => isCounted(entry.status));
  const minutes = counted.reduce((result, entry) => {
    const duration = Math.max(0, entry.endMin - entry.startMin);
    if (entry.status === 'missed') result.missed += duration;
    else if (entry.status === 'late') result.late += duration;
    else result.attended += duration;
    return result;
  }, { attended: 0, missed: 0, late: 0 });
  const markedDays = new Set(data.schedule.filter((entry) => entry.status === 'attended').map(dateOf));
  let streakDays = 0;
  let cursor = today;
  while (markedDays.has(cursor)) {
    streakDays++;
    cursor = addDays(cursor, -1);
  }
  const attended = data.schedule.filter((entry) => ['attended', 'late', 'official_leave'].includes(entry.status)).length;
  const missed = data.schedule.filter((entry) => entry.status === 'missed').length;
  const term = data.terms.find((candidate) => candidate.isActive);
  const remaining = data.schedule.filter((entry) => entry.status === 'unmarked' && dateOf(entry) >= today && (!term || dateOf(entry) <= term.endDate)).length;
  const total = attended + missed + remaining;
  const currentRate = attended + missed ? attended / (attended + missed) : 1;
  const projectedAttended = attended + remaining * currentRate;
  const percentWith = (nextAttended: number) => total + 1 ? ((attended + remaining + nextAttended) / (total + 1)) * 100 : 0;
  return {
    generatedAt: new Date().toISOString(),
    streakDays,
    termEndProjection: total ? (projectedAttended / total) * 100 : 0,
    overallMinutes: minutes,
    counted: { attended, missed, total: attended + missed },
    whatIf: { attendNext: percentWith(1), missNext: percentWith(0) },
  };
}

export function buildWeeklySnapshots(data: AppData): WeeklySnapshot[] {
  const grouped = new Map<string, { attended: number; total: number }>();
  for (const entry of data.schedule) {
    if (!isCounted(entry.status)) continue;
    const key = `${entry.termId}|${entry.subjectId}|${entry.weekStartDate}`;
    const value = grouped.get(key) ?? { attended: 0, total: 0 };
    value.total++;
    if (entry.status !== 'missed') value.attended++;
    grouped.set(key, value);
  }
  const snapshots: WeeklySnapshot[] = [...grouped.entries()].map(([key, value]) => {
    const [termId, subjectId, weekStartDate] = key.split('|');
    return { termId, subjectId, weekStartDate, percent: value.total ? (value.attended / value.total) * 100 : 0 };
  });
  const overall = new Map<string, { attended: number; total: number }>();
  for (const entry of data.schedule) {
    if (!isCounted(entry.status)) continue;
    const key = `${entry.termId}|${entry.weekStartDate}`;
    const value = overall.get(key) ?? { attended: 0, total: 0 };
    value.total++;
    if (entry.status !== 'missed') value.attended++;
    overall.set(key, value);
  }
  return snapshots.concat([...overall.entries()].map(([key, value]) => {
    const [termId, weekStartDate] = key.split('|');
    return { termId, subjectId: null, weekStartDate, percent: value.total ? (value.attended / value.total) * 100 : 0 };
  }));
}

export function buildInsights(data: AppData): Insight[] {
  const byDay = new Map<number, { missed: number; total: number }>();
  for (const entry of data.schedule) {
    if (!isCounted(entry.status)) continue;
    const value = byDay.get(entry.dayInt) ?? { missed: 0, total: 0 };
    value.total++;
    if (entry.status === 'missed') value.missed++;
    byDay.set(entry.dayInt, value);
  }
  const generatedAt = new Date().toISOString();
  return [...byDay.entries()]
    .filter(([, value]) => value.total >= 2 && value.missed / value.total >= 0.4)
    .map(([dayInt, value]) => ({
      id: `day_${dayInt}`,
      termId: data.terms.find((term) => term.isActive)?.id ?? 'overall',
      insightText: `Day ${dayInt + 1} has ${Math.round((value.missed / value.total) * 100)}% missed classes.`,
      generatedAt,
    }));
}

export function toCsv(data: AppData): string {
  const rows = [['date', 'subject', 'status', 'start_min', 'end_min', 'room', 'note']];
  const subjects = new Map(data.subjects.map((subject) => [subject.id, subject.name]));
  for (const entry of data.schedule) rows.push([dateOf(entry), subjects.get(entry.subjectId) ?? '', entry.status, String(entry.startMin), String(entry.endMin), entry.room, entry.note.replace(/"/g, '""')]);
  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}