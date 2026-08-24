import { StyleSheet, View, Text, Pressable } from 'react-native';
import { COLORS } from '@/lib/constants';
import { Subject } from '@/lib/types';
import { SubjectStats } from '@/lib/attendance';

interface Props {
  subject: Subject;
  stats: SubjectStats;
  onPress?: () => void;
}

export function SubjectCard({ subject, stats, onPress }: Props) {
  const isAbove = stats.percent >= stats.target;
  const barColor = isAbove ? COLORS.green : COLORS.red;
  const barWidth = Math.max(0, Math.min(100, stats.percent));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={styles.leftRow}>
          <View
            style={[styles.colorDot, { backgroundColor: subject.colorHex }]}
          />
          <Text style={styles.name} numberOfLines={1}>
            {subject.name}
          </Text>
        </View>
        <Text
          style={[
            styles.percent,
            { color: isAbove ? COLORS.greenBright : COLORS.red },
          ]}
        >
          {stats.total > 0 ? `${stats.percent.toFixed(1)}%` : '—'}
        </Text>
      </View>

      <View style={styles.barTrack}>
        <View
          style={{
            width: `${barWidth}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: 2,
          }}
        />
        <View
          style={[styles.targetMarker, { left: `${stats.target}%` }]}
        />
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statLabel}>
          {stats.attended + stats.late + stats.officialLeave} attended
        </Text>
        <Text style={styles.statLabel}>{stats.missed} missed</Text>
        <Text style={styles.statLabel}>{stats.total} total</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  percent: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  barTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  targetMarker: {
    position: 'absolute',
    top: -2,
    width: 1,
    height: 8,
    backgroundColor: COLORS.textTertiary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
});
