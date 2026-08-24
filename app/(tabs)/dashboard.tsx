import { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { COLORS, DAY_LABELS_FULL, MONTH_LABELS } from '@/lib/constants';
import { useApp } from '@/lib/AppContext';
import {
  computeOverallStats,
  computeSubjectStats,
  getEntriesForDate,
  getUnmarkedCount,
  minToTime,
  todayStr,
} from '@/lib/attendance';
import { AttendanceRing } from '@/components/AttendanceRing';
import { BufferMeter } from '@/components/BufferMeter';
import { SubjectCard } from '@/components/SubjectCard';
import { NextClassCard } from '@/components/NextClassCard';
import { Undo2, RotateCcw } from 'lucide-react-native';

export default function DashboardScreen() {
  const { data, markEntry, undoLastMark, canUndo } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [showUndo, setShowUndo] = useState(false);

  const overall = useMemo(() => computeOverallStats(data), [data]);

  const today = todayStr();
  const todayEntries = useMemo(
    () => getEntriesForDate(data, today),
    [data, today]
  );

  const subjectStats = useMemo(
    () =>
      data.subjects.map((s) => ({
        subject: s,
        stats: computeSubjectStats(data.schedule, s),
      })),
    [data]
  );

  const unmarkedCount = getUnmarkedCount(data);

  const now = new Date();
  const dayName = DAY_LABELS_FULL[(now.getDay() + 6) % 7];
  const monthName = MONTH_LABELS[now.getMonth()];
  const dateNum = now.getDate();

  const handleMark = useCallback(
    (entryId: string, status: any) => {
      markEntry(entryId, status);
      setShowUndo(true);
      setTimeout(() => setShowUndo(false), 4000);
    },
    [markEntry]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.greenBright}
            colors={[COLORS.greenBright]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateLine}>
              {dayName}, {monthName} {dateNum}
            </Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakNum}>{overall.total}</Text>
            <Text style={styles.streakLabel}>classes</Text>
          </View>
        </View>

        {/* Overall ring + buffer */}
        <View style={styles.overallSection}>
          <View style={styles.ringWrap}>
            <AttendanceRing
              percent={overall.percent}
              size={130}
              label="Overall"
            />
          </View>
          <View style={styles.statsCol}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.greenBright }]}>
                {overall.attended + overall.late + overall.officialLeave}
              </Text>
              <Text style={styles.statKey}>Attended</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.red }]}>
                {overall.missed}
              </Text>
              <Text style={styles.statKey}>Missed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {overall.total}
              </Text>
              <Text style={styles.statKey}>Total</Text>
            </View>
          </View>
        </View>

        {overall.total > 0 && (
          <View style={styles.bufferWrap}>
            <BufferMeter
              buffer={overall.buffer}
              mustAttend={overall.mustAttend}
              percent={overall.percent}
            />
          </View>
        )}

        {/* Today's classes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Classes</Text>
            {unmarkedCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>
                  {unmarkedCount} pending
                </Text>
              </View>
            )}
          </View>

          {todayEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No classes today</Text>
              <Text style={styles.emptySub}>
                Enjoy your free day or check the calendar.
              </Text>
            </View>
          ) : (
            <View style={styles.classList}>
              {todayEntries.map((entry) => {
                const subject = data.subjects.find(
                  (s) => s.id === entry.subjectId
                );
                return (
                  <NextClassCard
                    key={entry.id}
                    entry={entry}
                    subject={subject}
                    onMark={(status) => handleMark(entry.id, status)}
                  />
                );
              })}
            </View>
          )}
        </View>

        {/* Subject breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject Breakdown</Text>
          {subjectStats.length === 0 ? (
            <Text style={styles.emptySub}>No subjects yet.</Text>
          ) : (
            subjectStats.map(({ subject, stats }) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                stats={stats}
              />
            ))
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Undo toast */}
      {showUndo && canUndo && (
        <View style={styles.undoToast}>
          <Text style={styles.undoText}>Status updated</Text>
          <Pressable
            onPress={() => {
              undoLastMark();
              setShowUndo(false);
            }}
            style={styles.undoBtn}
          >
            <Undo2 size={14} color={COLORS.greenBright} strokeWidth={2.5} />
            <Text style={styles.undoBtnText}>Undo</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  dateLine: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  streakBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  streakNum: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
  },
  streakLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  overallSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  ringWrap: {
    marginRight: 24,
  },
  statsCol: {
    flex: 1,
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
  },
  statKey: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bufferWrap: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  pendingBadge: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  borderWidth: 1,
    borderColor: COLORS.amber,
  },
  pendingText: {
    fontSize: 10,
    color: COLORS.amber,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  classList: {
    gap: 10,
  },
  undoToast: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  undoText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  paddingVertical: 4,
    paddingHorizontal: 8,
  },
  undoBtnText: {
    fontSize: 13,
    color: COLORS.greenBright,
    fontWeight: '700',
  },
});
