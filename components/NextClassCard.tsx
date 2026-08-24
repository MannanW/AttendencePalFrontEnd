import { StyleSheet, View, Text, Pressable } from 'react-native';
import { COLORS } from '@/lib/constants';
import { AppData, ScheduleEntry, Subject } from '@/lib/types';
import { minToTime } from '@/lib/attendance';
import { MarkButton } from './MarkButton';
import { STATUS_META } from '@/lib/types';

interface Props {
  entry: ScheduleEntry;
  subject: Subject | undefined;
  onMark: (status: ScheduleEntry['status']) => void;
}

export function NextClassCard({ entry, subject, onMark }: Props) {
  const subjectColor = subject?.colorHex ?? COLORS.green;
  const meta = STATUS_META[entry.status];
  const isUnmarked = entry.status === 'unmarked';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.accentBar, { backgroundColor: subjectColor }]} />
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
            { backgroundColor: isUnmarked ? COLORS.surfaceAlt : meta.color },
          ]}
        >
          <Text style={styles.statusText}>
            {isUnmarked ? 'PENDING' : meta.label.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.markRow}>
        <MarkButton
          status="attended"
          active={entry.status === 'attended'}
          onPress={() => onMark('attended')}
          label="Attended"
          short="A"
          color={COLORS.green}
          size="sm"
        />
        <MarkButton
          status="missed"
          active={entry.status === 'missed'}
          onPress={() => onMark('missed')}
          label="Missed"
          short="M"
          color={COLORS.red}
          size="sm"
        />
        <MarkButton
          status="late"
          active={entry.status === 'late'}
          onPress={() => onMark('late')}
          label="Late"
          short="L"
          color={COLORS.amber}
          size="sm"
        />
        <MarkButton
          status="official_leave"
          active={entry.status === 'official_leave'}
          onPress={() => onMark('official_leave')}
          label="On Duty"
          short="OD"
          color={COLORS.blue}
          size="sm"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  accentBar: {
    width: 3,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  timeRoom: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  markRow: {
    flexDirection: 'row',
    gap: 6,
    padding: 10,
    paddingTop: 0,
  },
});
