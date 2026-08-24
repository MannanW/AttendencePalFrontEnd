import { AppData, ScheduleEntry, Subject, Term } from './types';

function uid(prefix: string, i: number): string {
  return `${prefix}_${i.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// Generate a week's worth of schedule entries for a given Monday date
function generateWeek(
  weekStart: string,
  subjects: Subject[],
  termId: string,
  dayConfigs: { day: number; slots: { subj: number; start: number; end: number; room: string }[] }[],
  statusOverrides: { day: number; slotIdx: number; status: ScheduleEntry['status'] }[] = []
): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  let idCounter = 0;

  for (const config of dayConfigs) {
    config.slots.forEach((slot, slotIdx) => {
      const override = statusOverrides.find(
        (o) => o.day === config.day && o.slotIdx === slotIdx
      );
      entries.push({
        id: uid('e', idCounter++),
        termId,
        weekStartDate: weekStart,
        dayInt: config.day,
        startMin: slot.start,
        endMin: slot.end,
        subjectId: subjects[slot.subj].id,
        room: slot.room,
        status: override ? override.status : 'unmarked',
        note: '',
        isExtra: false,
      });
    });
  }

  return entries;
}

export function generateSeedData(): AppData {
  const termId = uid('t', 0);
  const termStartDate = '2025-08-04'; // A Monday
  const termEndDate = '2025-11-28';

  const subjects: Subject[] = [
    { id: uid('s', 0), name: 'Data Structures & Algorithms', colorHex: '#0E7C4F', targetPercent: 75, aliases: ['DSA', 'Data Structures'] },
    { id: uid('s', 1), name: 'Operating Systems', colorHex: '#1565C0', targetPercent: 75, aliases: ['OS', 'Operating Sys'] },
    { id: uid('s', 2), name: 'Computer Networks', colorHex: '#C62828', targetPercent: 75, aliases: ['CN', 'Networks'] },
    { id: uid('s', 3), name: 'Database Management Systems', colorHex: '#F9A825', targetPercent: 75, aliases: ['DBMS', 'Database'] },
    { id: uid('s', 4), name: 'Theory of Computation', colorHex: '#6D4C41', targetPercent: 75, aliases: ['TOC', 'Computation'] },
    { id: uid('s', 5), name: 'Engineering Economics', colorHex: '#546E7A', targetPercent: 75, aliases: ['Eco', 'Economics'] },
  ];

  const term: Term = {
    id: termId,
    name: 'Semester 5 — Fall 2025',
    startDate: termStartDate,
    endDate: termEndDate,
    isActive: true,
  };

  // Standard weekly schedule (Mon-Sat)
  const dayConfigs = [
    { day: 0, slots: [
      { subj: 0, start: 9 * 60, end: 10 * 60, room: 'CS-101' },
      { subj: 1, start: 10 * 60, end: 11 * 60, room: 'CS-102' },
      { subj: 2, start: 11 * 60 + 15, end: 12 * 60 + 15, room: 'CS-201' },
      { subj: 3, start: 14 * 60, end: 15 * 60, room: 'Lab-1' },
    ]},
    { day: 1, slots: [
      { subj: 1, start: 9 * 60, end: 10 * 60, room: 'CS-102' },
      { subj: 4, start: 10 * 60, end: 11 * 60, room: 'CS-103' },
      { subj: 0, start: 11 * 60 + 15, end: 12 * 60 + 15, room: 'CS-101' },
      { subj: 5, start: 14 * 60, end: 15 * 60, room: 'CS-104' },
    ]},
    { day: 2, slots: [
      { subj: 2, start: 9 * 60, end: 10 * 60, room: 'CS-201' },
      { subj: 3, start: 10 * 60, end: 11 * 60, room: 'Lab-1' },
      { subj: 4, start: 11 * 60 + 15, end: 12 * 60 + 15, room: 'CS-103' },
      { subj: 0, start: 14 * 60, end: 15 * 60, room: 'CS-101' },
    ]},
    { day: 3, slots: [
      { subj: 1, start: 9 * 60, end: 10 * 60, room: 'CS-102' },
      { subj: 0, start: 10 * 60, end: 11 * 60, room: 'CS-101' },
      { subj: 5, start: 11 * 60 + 15, end: 12 * 60 + 15, room: 'CS-104' },
      { subj: 2, start: 14 * 60, end: 15 * 60, room: 'CS-201' },
    ]},
    { day: 4, slots: [
      { subj: 4, start: 9 * 60, end: 10 * 60, room: 'CS-103' },
      { subj: 3, start: 10 * 60, end: 11 * 60, room: 'Lab-1' },
      { subj: 1, start: 11 * 60 + 15, end: 12 * 60 + 15, room: 'CS-102' },
    ]},
    { day: 5, slots: [
      { subj: 2, start: 9 * 60, end: 10 * 60, room: 'CS-201' },
      { subj: 5, start: 10 * 60, end: 11 * 60, room: 'CS-104' },
    ]},
  ];

  // Generate 6 weeks of past data with realistic attendance near 75%
  const allEntries: ScheduleEntry[] = [];
  const today = new Date();
  const todayDay = today.toISOString().slice(0, 10);

  // Past weeks with marked attendance
  // Week 1 (Aug 4-9): mostly attended, 1 missed
  // Week 2 (Aug 11-16): attended, 2 missed
  // Week 3 (Aug 18-23): mostly attended, 1 missed, 1 late
  // Week 4 (Aug 25-30): attended, 3 missed (dip)
  // Week 5 (Sep 1-6): recovery, mostly attended
  // Current week (Sep 8-13): partially marked, some unmarked

  const pastWeeks = [
    { weekStart: '2025-08-04', overrides: [
      { day: 0, slotIdx: 2, status: 'missed' as const },
      { day: 2, slotIdx: 0, status: 'missed' as const },
    ]},
    { weekStart: '2025-08-11', overrides: [
      { day: 1, slotIdx: 2, status: 'missed' as const },
      { day: 3, slotIdx: 3, status: 'missed' as const },
      { day: 4, slotIdx: 0, status: 'missed' as const },
    ]},
    { weekStart: '2025-08-18', overrides: [
      { day: 0, slotIdx: 1, status: 'late' as const },
      { day: 2, slotIdx: 3, status: 'missed' as const },
    ]},
    { weekStart: '2025-08-25', overrides: [
      { day: 0, slotIdx: 0, status: 'missed' as const },
      { day: 1, slotIdx: 0, status: 'missed' as const },
      { day: 3, slotIdx: 2, status: 'missed' as const },
      { day: 4, slotIdx: 2, status: 'missed' as const },
    ]},
    { weekStart: '2025-09-01', overrides: [
      { day: 2, slotIdx: 0, status: 'missed' as const },
    ]},
  ];

  for (const week of pastWeeks) {
    const weekEntries = generateWeek(
      week.weekStart,
      subjects,
      termId,
      dayConfigs,
      week.overrides
    );
    // Mark all non-overridden as attended
    for (const entry of weekEntries) {
      if (entry.status === 'unmarked') {
        entry.status = 'attended';
      }
    }
    allEntries.push(...weekEntries);
  }

  // Current week — partially marked
  // Today is Aug 24 2026 per env, but our seed term is Fall 2025.
  // We'll set the "current" week to the last week in our data and leave some unmarked.
  const currentWeekStart = '2025-09-08';
  const currentWeekEntries = generateWeek(
    currentWeekStart,
    subjects,
    termId,
    dayConfigs,
    [
      { day: 0, slotIdx: 0, status: 'attended' as const },
      { day: 0, slotIdx: 1, status: 'attended' as const },
      { day: 0, slotIdx: 2, status: 'missed' as const },
      { day: 0, slotIdx: 3, status: 'attended' as const },
      { day: 1, slotIdx: 0, status: 'attended' as const },
      { day: 1, slotIdx: 1, status: 'attended' as const },
      { day: 1, slotIdx: 2, status: 'attended' as const },
      { day: 1, slotIdx: 3, status: 'missed' as const },
      { day: 2, slotIdx: 0, status: 'attended' as const },
      // day 2 slots 1-3, day 3-5 left unmarked
    ]
  );
  allEntries.push(...currentWeekEntries);

  return {
    version: 1,
    subjects,
    terms: [term],
    schedule: allEntries,
    holidays: [
      { date: '2025-08-15', label: 'Independence Day' },
      { date: '2025-09-05', label: 'Teachers Day' },
    ],
    lastMarkedAt: '2025-09-09T10:30:00',
    isOnboarded: true,
  };
}
