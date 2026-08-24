export type MarkStatus =
  | 'unmarked'
  | 'attended'
  | 'missed'
  | 'late'
  | 'official_leave'
  | 'cancelled'
  | 'holiday';

export interface Subject {
  id: string;
  name: string;
  colorHex: string;
  targetPercent: number;
  aliases: string[];
}

export interface Term {
  id: string;
  name: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  isActive: boolean;
}

export interface ScheduleEntry {
  id: string;
  termId: string;
  weekStartDate: string; // ISO Monday date
  dayInt: number; // 0=Mon … 6=Sun
  startMin: number; // minutes from midnight
  endMin: number;
  subjectId: string;
  room: string;
  status: MarkStatus;
  note: string;
  isExtra: boolean;
}

export interface Holiday {
  date: string; // ISO date
  label: string;
}

export interface AppData {
  version: number;
  subjects: Subject[];
  terms: Term[];
  schedule: ScheduleEntry[];
  holidays: Holiday[];
  lastMarkedAt: string | null;
  isOnboarded: boolean;
}

export const STATUS_META: Record<
  MarkStatus,
  { label: string; short: string; color: string; counts: boolean }
> = {
  unmarked: { label: 'Unmarked', short: '—', color: '#3A3A3A', counts: false },
  attended: { label: 'Attended', short: 'A', color: '#0E7C4F', counts: true },
  missed: { label: 'Missed', short: 'M', color: '#C62828', counts: true },
  late: { label: 'Late', short: 'L', color: '#F9A825', counts: true },
  official_leave: {
    label: 'Official Leave',
    short: 'OD',
    color: '#1565C0',
    counts: true,
  },
  cancelled: { label: 'Cancelled', short: 'C', color: '#546E7A', counts: false },
  holiday: { label: 'Holiday', short: 'H', color: '#6D4C41', counts: false },
};
