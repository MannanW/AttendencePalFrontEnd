import { DEFAULT_TARGET, DAY_LABELS } from './constants';
import { ScheduleEntry, Subject } from './types';
import * as XLSX from 'xlsx';

export interface ParsedTimetable {
  sheetNames: string[];
  subjects: Omit<Subject, 'id'>[];
  slots: (Omit<ScheduleEntry, 'id' | 'subjectId'> & { subjectIdx: number })[];
}

const SLOT_TIMES = [
  [540, 590], [600, 650], [660, 710], [720, 770], [780, 830],
  [840, 890], [900, 950], [960, 1010], [1020, 1070], [1080, 1130], [1140, 1190],
];

export async function parseXlsxBuffer(buffer: ArrayBuffer, sheetName?: string): Promise<ParsedTimetable> {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const selected = sheetName ?? workbook.SheetNames[0];
  if (!selected || !workbook.Sheets[selected]) throw new Error('No timetable sheet found');
  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[selected], { header: 1, defval: '' });
  const names = collectSubjectNames(rows);
  const metadata = metadataRows(rows);
  const metadataByCode = new Map(metadata.map((row) => [row['COURSE CODE'].toUpperCase(), row]));
  const subjects = names.map((name, index) => {
    const row = metadataByCode.get(name);
    return {
    name: row?.['COURSE NAME'] || name,
    colorHex: ['#0E7C4F', '#1565C0', '#C62828', '#F9A825', '#00838F', '#E65100'][index % 6],
    targetPercent: DEFAULT_TARGET,
    aliases: [name],
    courseCode: row?.['COURSE CODE'] || name,
    facultyName: row?.['NAME OF THE FACULTY'],
    facultyContact: row?.['CONTACT NO.'],
    facultyEmail: row?.['EMAIL ID'],
    };
  });
  const slots = extractSlots(rows, subjects);
  return { sheetNames: workbook.SheetNames, subjects, slots };
}

function collectSubjectNames(rows: unknown[][]): string[] {
  const names = new Set<string>();
  for (const row of rows) {
    const isDayRow = DAY_LABELS.some((label) => text(row[0]).startsWith(label.toUpperCase()));
    if (!isDayRow) continue;
    for (const cell of row) {
      const value = text(cell);
      if (/^[A-Z][A-Z0-9&-]{1,9}$/.test(value) && !DAY_LABELS.some((day) => day.toUpperCase() === value)) {
        names.add(value);
      }
    }
  }
  return [...names];
}

function extractSlots(rows: unknown[][], subjects: Omit<Subject, 'id'>[]) {
  const subjectIndex = new Map<string, number>();
  subjects.forEach((subject, index) => {
    subjectIndex.set(subject.name.toUpperCase(), index);
    subject.aliases.forEach((alias) => subjectIndex.set(alias.toUpperCase(), index));
  });
  const slots: ParsedTimetable['slots'] = [];
  rows.forEach((row) => {
    const day = DAY_LABELS.find((label) => text(row[0]).startsWith(label.toUpperCase()));
    if (!day) return;
    row.slice(1, 12).forEach((cell, column) => {
      const code = text(cell).split(/[\s/,(]/)[0];
      const subjectIdx = subjectIndex.get(code.toUpperCase());
      if (subjectIdx === undefined) return;
      const [startMin, endMin] = SLOT_TIMES[column] ?? [540 + column * 50, 590 + column * 50];
      slots.push({
        termId: 'imported',
        weekStartDate: '',
        dayInt: DAY_LABELS.indexOf(day),
        startMin,
        endMin,
        subjectIdx,
        room: '',
        status: 'unmarked',
        note: `Imported ${code}`,
        isExtra: false,
      });
    });
  });
  return slots;
}

function text(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

export function metadataRows(rows: unknown[][]): Record<string, string>[] {
  const headerIndex = rows.findIndex((row) => row.some((cell) => text(cell) === 'COURSE CODE'));
  if (headerIndex < 0) return [];
  const headers = rows[headerIndex].map((cell) => text(cell));
  return rows.slice(headerIndex + 1).filter((row) => row.some(Boolean)).map((row) => Object.fromEntries(headers.map((header, index) => [header, String(row[index] ?? '').trim()])));
}
