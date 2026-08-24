import { memo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS, DAY_LABELS_FULL, MONTH_LABELS } from '@/lib/constants';
import { MarkStatus, ScheduleEntry, Subject } from '@/lib/types';
import { minToTime, parseLocalDate } from '@/lib/attendance';
import { NextClassCard } from './NextClassCard';

interface Props {
  dateStr: string;
  entries: ScheduleEntry[];
  subjectById: Record<string, Subject>;
  holiday?: string;
  onMark: (entryId: string, status: MarkStatus) => void;
}

export const DayTimeline = memo(function DayTimeline({
  dateStr,
  entries,
  subjectById,
  holiday,
  onMark,
}: Props) {
  const date = parseLocalDate(dateStr);
  const heading = `${DAY_LABELS_FULL[(date.getDay() + 6) % 7]}, ${MONTH_LABELS[date.getMonth()].slice(0, 3)} ${date.getDate()}`;

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No classes scheduled</Text>
        <Text style={styles.emptySub}>{holiday ?? 'Free day — enjoy it.'}</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.dateLabel}>{heading}</Text>
        {holiday ? (
          <View style={styles.holidayBadge}>
            <Text style={styles.holidayText}>{holiday}</Text>
          </View>
        ) : null}
      </View>
      {entries.map((entry, idx) => {
        const subject = subjectById[entry.subjectId];
        return (
          <View key={entry.id} style={styles.row}>
            <View style={styles.timeCol}>
              <Text style={styles.timeText}>{minToTime(entry.startMin)}</Text>
              <Text style={styles.timeEnd}>{minToTime(entry.endMin)}</Text>
            </View>
            <View style={styles.lineCol}>
              {idx < entries.length - 1 ? <View style={styles.line} /> : null}
              <View
                style={[
                  styles.dot,
                  { backgroundColor: subject?.colorHex ?? COLORS.green },
                ]}
              />
            </View>
            <View style={styles.cardCol}>
              <NextClassCard
                entry={entry}
                subject={subject}
                onMark={(status) => onMark(entry.id, status)}
              />
            </View>
          </View>
        );
      })}
      <View style={{ height: 40 }} />
    </View>
  );
});

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  emptySub: { fontSize: 12, color: COLORS.textTertiary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  holidayBadge: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.amber,
  },
  holidayText: { fontSize: 10, color: COLORS.amber, fontWeight: '600' },
  row: { flexDirection: 'row', marginBottom: 12 },
  timeCol: { width: 52, paddingTop: 14 },
  timeText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  timeEnd: {
    fontSize: 9,
    color: COLORS.textTertiary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  lineCol: { width: 20, alignItems: 'center', paddingTop: 14 },
  line: {
    position: 'absolute',
    top: 28,
    bottom: -12,
    width: 1,
    backgroundColor: COLORS.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, zIndex: 1 },
  cardCol: { flex: 1, marginLeft: 8 },
});
