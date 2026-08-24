import { memo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '@/lib/constants';
import { MarkStatus, ScheduleEntry, Subject, STATUS_META } from '@/lib/types';
import { minToTime } from '@/lib/attendance';
import { MarkButton } from './MarkButton';

interface Props {
  entry: ScheduleEntry;
  subject: Subject | undefined;
  onMark: (status: MarkStatus) => void;
}

const MARKS: { status: MarkStatus; color: string }[] = [
  { status: 'attended', color: COLORS.green },
  { status: 'missed', color: COLORS.red },
  { status: 'late', color: COLORS.amber },
  { status: 'official_leave', color: COLORS.blue },
];

export const NextClassCard = memo(function NextClassCard({
  entry,
  subject,
  onMark,
}: Props) {
  const meta = STATUS_META[entry.status];
  const pending = entry.status === 'unmarked';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={[
            styles.accentBar,
            { backgroundColor: subject?.colorHex ?? COLORS.green },
          ]}
        />
        <View style={styles.headerContent}>
          <Text style={styles.subjectName} numberOfLines={1}>
            {subject?.name ?? 'Unknown'}
          </Text>
          <Text style={styles.timeRoom}>
            {minToTime(entry.startMin)} — {minToTime(entry.endMin)} · {entry.room}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: pending ? COLORS.surfaceAlt : meta.color },
          ]}
        >
          <Text style={styles.statusText}>
            {pending ? 'PENDING' : meta.label.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.markRow}>
        {MARKS.map(({ status, color }) => {
          const m = STATUS_META[status];
          return (
            <MarkButton
              key={status}
              status={status}
              active={entry.status === status}
              onPress={() => onMark(status)}
              label={m.label}
              short={m.short}
              color={color}
              size="sm"
            />
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  accentBar: { width: 3, height: 32, borderRadius: 2, marginRight: 12 },
  headerContent: { flex: 1 },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  timeRoom: { fontSize: 11, color: COLORS.textSecondary, fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  markRow: { flexDirection: 'row', gap: 6, padding: 10, paddingTop: 0 },
});
