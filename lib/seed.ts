import { AppData, ScheduleEntry, Subject, Term } from './types';
import { addDays, formatDate, getWeekStart, todayStr } from './attendance';
import { uid as secureUid } from './ids';

function uid(prefix: string, i: number): string {
  return `${secureUid(prefix)}_${i.toString(36)}`;
}

type DayConfig = {
  day: number;
  slots: { subj: number; start: number; end: number; room: string }[];
};

function generateWeek(
  weekStart: string,
  subjects: Subject[],
  termId: string,
  dayConfigs: DayConfig[],
  statusOverrides: {
    day: number;
    slotIdx: number;
    status: ScheduleEntry['status'];
  }[] = []
): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  let idCounter = 0;

  for (const config of dayConfigs) {
    config.slots.forEach((slot, slotIdx) => {
      const override = statusOverrides.find(
        (o) => o.day === config.day && o.slotIdx === slotIdx
      );
      const subject = subjects[slot.subj];
      if (!subject) return;
      entries.push({
        id: uid('e', idCounter++),
        termId,
        weekStartDate: weekStart,
        dayInt: config.day,
        startMin: slot.start,
        endMin: slot.end,
        subjectId: subject.id,
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
  const today = todayStr();
  const currentWeekStart = getWeekStart(today);
  const todayDayInt = (new Date().getDay() + 6) % 7;

  const termStartDate = addDays(currentWeekStart, -7 * 5);
  const termEndDate = addDays(currentWeekStart, 7 * 10);

  const subjects: Subject[] = [
    { id: uid('s', 0), name: 'Data Structures & Algorithms', colorHex: '#0E7C4F', targetPercent: 75, aliases: ['DSA', 'Data Structures'] },
    { id: uid('s', 1), name: 'Operating Systems', colorHex: '#1565C0', targetPercent: 75, aliases: ['OS'] },
    { id: uid('s', 2), name: 'Computer Networks', colorHex: '#C62828', targetPercent: 75, aliases: ['CN'] },
    { id: uid('s', 3), name: 'Database Management Systems', colorHex: '#F9A825', targetPercent: 75, aliases: ['DBMS'] },
    { id: uid('s', 4), name: 'Theory of Computation', colorHex: '#6D4C41', targetPercent: 75, aliases: ['TOC'] },
    { id: uid('s', 5), name: 'Engineering Economics', colorHex: '#546E7A', targetPercent: 75, aliases: ['Eco'] },
  ];

  const term: Term = {
    id: termId,
    name: 'Semester 5 — Sample Term',
    startDate: termStartDate,
    endDate: termEndDate,
    isActive: true,
  };

  const dayConfigs: DayConfig[] = [
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

  const allEntries: ScheduleEntry[] = [];

  const pastWeeks = [
    {
      weekStart: addDays(currentWeekStart, -35),
      overrides: [
        { day: 0, slotIdx: 2, status: 'missed' as const },
        { day: 2, slotIdx: 0, status: 'missed' as const },
      ],
    },
    {
      weekStart: addDays(currentWeekStart, -28),
      overrides: [
        { day: 1, slotIdx: 2, status: 'missed' as const },
        { day: 3, slotIdx: 3, status: 'missed' as const },
        { day: 4, slotIdx: 0, status: 'missed' as const },
      ],
    },
    {
      weekStart: addDays(currentWeekStart, -21),
      overrides: [
        { day: 0, slotIdx: 1, status: 'late' as const },
        { day: 2, slotIdx: 3, status: 'missed' as const },
      ],
    },
    {
      weekStart: addDays(currentWeekStart, -14),
      overrides: [
        { day: 0, slotIdx: 0, status: 'missed' as const },
        { day: 1, slotIdx: 0, status: 'missed' as const },
        { day: 3, slotIdx: 2, status: 'missed' as const },
        { day: 4, slotIdx: 2, status: 'missed' as const },
      ],
    },
    {
      weekStart: addDays(currentWeekStart, -7),
      overrides: [{ day: 2, slotIdx: 0, status: 'missed' as const }],
    },
  ];

  for (const week of pastWeeks) {
    const weekEntries = generateWeek(
      week.weekStart,
      subjects,
      termId,
      dayConfigs,
      week.overrides
    );
    for (const entry of weekEntries) {
      if (entry.status === 'unmarked') {
        entry.status = 'attended';
      }
    }
    allEntries.push(...weekEntries);
  }

  const currentOverrides: {
    day: number;
    slotIdx: number;
    status: ScheduleEntry['status'];
  }[] = [];

  for (const config of dayConfigs) {
    if (config.day < todayDayInt) {
      config.slots.forEach((_, slotIdx) => {
        const miss =
          (config.day === 0 && slotIdx === 2) ||
          (config.day === 1 && slotIdx === 3);
        currentOverrides.push({
          day: config.day,
          slotIdx,
          status: miss ? 'missed' : 'attended',
        });
      });
    }
  }

  allEntries.push(
    ...generateWeek(
      currentWeekStart,
      subjects,
      termId,
      dayConfigs,
      currentOverrides
    )
  );

  return {
    version: 1,
    subjects,
    terms: [term],
    schedule: allEntries,
    holidays: [
      { date: addDays(currentWeekStart, -17), label: 'Holiday' },
      { date: addDays(currentWeekStart, 4), label: 'Institute Holiday' },
    ],
    lastMarkedAt: new Date().toISOString(),
    isOnboarded: true,
  };
}

export { formatDate };
