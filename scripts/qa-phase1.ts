import {
  addDays,
  computeOverallStats,
  computeSubjectStats,
  getEntriesForDate,
  getUnmarkedCountForDate,
  getWeekStart,
  todayStr,
} from '../lib/attendance';
import { generateSeedData } from '../lib/seed';
import { EMPTY_DATA } from '../lib/storage';
import { AppData, ScheduleEntry, Subject } from '../lib/types';
import { buildPhase3Cache, buildWeeklySnapshots, toCsv } from '../lib/phase3';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const subject: Subject = {
  id: 's1',
  name: 'Test',
  colorHex: '#0E7C4F',
  targetPercent: 75,
  aliases: [],
};

function entry(status: ScheduleEntry['status'], id: string): ScheduleEntry {
  return {
    id,
    termId: 't',
    weekStartDate: '2026-08-24',
    dayInt: 0,
    startMin: 540,
    endMin: 600,
    subjectId: 's1',
    room: 'R',
    status,
    note: '',
    isExtra: false,
  };
}

function withSchedule(schedule: ScheduleEntry[]): AppData {
  return { ...EMPTY_DATA, subjects: [subject], schedule };
}

const at75 = withSchedule([
  ...Array.from({ length: 6 }, (_, i) => entry('attended', `a${i}`)),
  ...Array.from({ length: 2 }, (_, i) => entry('missed', `m${i}`)),
]);
const s75 = computeOverallStats(at75);
assert(s75.percent === 75, `expected 75%, got ${s75.percent}`);
assert(s75.buffer === 0, `at 75% buffer should be 0, got ${s75.buffer}`);
assert(s75.mustAttend === 0, `at 75% mustAttend should be 0, got ${s75.mustAttend}`);

const four = withSchedule([
  entry('attended', 'a0'),
  entry('attended', 'a1'),
  entry('attended', 'a2'),
  entry('missed', 'm0'),
]);
assert(computeOverallStats(four).percent === 75, '3/4 should be 75%');
assert(computeOverallStats(four).buffer === 0, '3/4 buffer is 0');

const above = withSchedule([
  ...Array.from({ length: 6 }, (_, i) => entry('attended', `a${i}`)),
  entry('missed', 'm0'),
]);
const sAbove = computeOverallStats(above);
assert(sAbove.percent > 75, '6/7 should be above 75');
assert(sAbove.buffer === 1, `buffer expected 1 got ${sAbove.buffer}`);

const below = withSchedule([
  entry('attended', 'a0'),
  entry('attended', 'a1'),
  entry('missed', 'm0'),
  entry('missed', 'm1'),
]);
const sBelow = computeOverallStats(below);
assert(sBelow.percent === 50, `got ${sBelow.percent}`);
assert(sBelow.mustAttend === 4, `mustAttend expected 4 got ${sBelow.mustAttend}`);

const mixed = withSchedule([
  entry('attended', 'a0'),
  entry('late', 'l0'),
  entry('official_leave', 'o0'),
  entry('missed', 'm0'),
]);
assert(computeOverallStats(mixed).percent === 75, 'late/OD count as attended');
assert(computeSubjectStats(mixed.schedule, subject).total === 4, 'subject total');
assert(
  computeSubjectStats(
    [{ ...entry('late', 'weighted-late') }],
    { ...subject, lateWeight: 0.5 }
  ).percent === 50,
  'late weighting must preserve class-count denominator'
);
const phase3 = buildPhase3Cache(four, '2026-08-24');
assert(phase3.counted.total === 4, 'phase 3 cache count');
assert(phase3.termEndProjection === 75, 'term projection preserves current rate');
assert(buildWeeklySnapshots(four).some((snapshot) => snapshot.subjectId === null), 'overall weekly snapshot');
assert(toCsv(four).split('\n').length === 5, 'CSV export includes header and rows');

const empty = computeOverallStats(EMPTY_DATA);
assert(empty.percent === 0 && empty.total === 0, 'empty stats');
assert(getEntriesForDate(EMPTY_DATA, todayStr()).length === 0, 'empty today');
assert(getWeekStart('2026-08-26') === '2026-08-24', 'week start for Wednesday');
assert(addDays('2026-08-24', 7) === '2026-08-31', 'addDays');

const seed = generateSeedData();
assert(seed.isOnboarded, 'seed onboarded');
assert(seed.subjects.length === 6, '6 sample subjects');

const today = todayStr();
const todayEntries = getEntriesForDate(seed, today);
const dayInt = (new Date().getDay() + 6) % 7;
if (dayInt <= 5) {
  assert(todayEntries.length > 0, 'sample data should include today (Mon-Sat)');
  assert(
    getUnmarkedCountForDate(seed, today) === todayEntries.length,
    'today classes should be unmarked in sample data'
  );
}

const overallSeed = computeOverallStats(seed);
assert(overallSeed.total > 0, 'seed has counted history');
assert(
  overallSeed.percent >= 70 && overallSeed.percent <= 90,
  `seed overall should sit near 75%, got ${overallSeed.percent.toFixed(1)}`
);

console.log('QA Phase 1 attendance checks passed');
console.log({
  today,
  todayClasses: todayEntries.length,
  seedPercent: Number(overallSeed.percent.toFixed(2)),
  seedBuffer: overallSeed.buffer,
  seedMustAttend: overallSeed.mustAttend,
  seedTotal: overallSeed.total,
});
