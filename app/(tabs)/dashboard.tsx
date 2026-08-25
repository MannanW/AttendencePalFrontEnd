import { memo, useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { COLORS, DAY_LABELS_FULL, MONTH_LABELS } from '@/lib/constants';
import { useApp } from '@/lib/AppContext';
import { AttendanceRing } from '@/components/AttendanceRing';
import { BufferMeter } from '@/components/BufferMeter';
import { SubjectCard } from '@/components/SubjectCard';
import { NextClassCard } from '@/components/NextClassCard';
import { Undo2 } from 'lucide-react-native';
import { MarkStatus } from '@/lib/types';

export default function DashboardScreen() {
  const { derived, markEntry, undoLastMark, canUndo } = useApp();
  const { overall, subjectStats, todayEntries, unmarkedToday, subjectById, recoveryEntries, streakDays, termEndProjection, searchIndex, insights } =
    derived;
  const [showUndo, setShowUndo] = useState(false);
  const [query, setQuery] = useState('');
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const now = new Date();
  const handleMark = useCallback(
    (entryId: string, status: MarkStatus) => {
      markEntry(entryId, status);
      setShowUndo(true);
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setShowUndo(false), 4000);
    },
    [markEntry]
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.dateLine}>
              {DAY_LABELS_FULL[(now.getDay() + 6) % 7]}, {MONTH_LABELS[now.getMonth()]}{' '}
              {now.getDate()}
            </Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakNum}>{overall.total}</Text>
            <Text style={styles.streakLabel}>classes</Text>
          </View>
        </View>

        <View style={styles.overallSection}>
          <AttendanceRing percent={overall.percent} size={130} label="Overall" />
          <View style={styles.statsCol}>
            <Stat n={overall.effectiveAttended} label="Attended" color={COLORS.green} />
            <Stat n={overall.missed} label="Missed" color={COLORS.red} />
            <Stat n={overall.total} label="Total" />
          </View>
        </View>

        <View style={styles.intelligenceRow}>
          <View>
            <Text style={styles.intelligenceLabel}>TERM-END PROJECTION</Text>
            <Text style={[styles.intelligenceValue, { color: termEndProjection >= 75 ? COLORS.green : COLORS.red }]}>
              {termEndProjection.toFixed(1)}%
            </Text>
          </View>
          <View>
            <Text style={styles.intelligenceLabel}>MARKED STREAK</Text>
            <Text style={styles.intelligenceValue}>{streakDays} days</Text>
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

        {derived.phase3Cache && (
          <View style={styles.whatIfBox}>
            <Text style={styles.sectionTitle}>What If Next Class?</Text>
            <View style={styles.whatIfRow}>
              <Text style={styles.whatIfLabel}>Attend</Text><Text style={styles.whatIfValue}>{derived.phase3Cache.whatIf.attendNext.toFixed(1)}%</Text>
              <Text style={styles.whatIfLabel}>Miss</Text><Text style={[styles.whatIfValue, { color: COLORS.red }]}>{derived.phase3Cache.whatIf.missNext.toFixed(1)}%</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search</Text>
          <TextInput
            accessibilityLabel="Search subjects, rooms, and notes"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Subject, room, or note"
            placeholderTextColor={COLORS.textTertiary}
          />
          {query.trim() ? searchIndex.filter((item) => item.text.includes(query.trim().toLowerCase())).slice(0, 5).map(({ entry, subject }) => (
            <View key={entry.id} style={styles.searchResult}>
              <Text style={styles.searchSubject}>{subject.name}</Text>
              <Text style={styles.searchMeta}>{entry.note || entry.room} · {entry.status}</Text>
            </View>
          )) : null}
        </View>

        {recoveryEntries.length > 0 && (
          <View style={styles.recoveryBox}>
            <Text style={styles.recoveryTitle}>{recoveryEntries.length} unmarked classes found</Text>
            <Text style={styles.recoverySub}>Recovery Mode includes every pending class before today.</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Classes</Text>
            {unmarkedToday > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>{unmarkedToday} pending</Text>
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
              {todayEntries.map((entry) => (
                <NextClassCard
                  key={entry.id}
                  entry={entry}
                  subject={subjectById[entry.subjectId]}
                  onMark={(status) => handleMark(entry.id, status)}
                />
              ))}
            </View>
          )}
        </View>
        {insights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Smart Insights</Text>
            {insights.slice(0, 3).map((insight) => <Text key={insight} style={styles.insightText}>{insight}</Text>)}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject Breakdown</Text>
          {subjectStats.length === 0 ? (
            <Text style={styles.emptySub}>No subjects yet.</Text>
          ) : (
            subjectStats.map(({ subject, stats }) => (
              <SubjectCard key={subject.id} subject={subject} stats={stats} />
            ))
          )}
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>

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
            <Undo2 size={14} color={COLORS.green} strokeWidth={2.5} />
            <Text style={styles.undoBtnText}>Undo</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const Stat = memo(function Stat({
  n,
  label,
  color,
}: {
  n: number;
  label: string;
  color?: string;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, color ? { color } : null]}>{n}</Text>
      <Text style={styles.statKey}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
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
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
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
    gap: 24,
  },
  statsCol: { flex: 1, gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
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
  bufferWrap: { paddingHorizontal: 20, marginBottom: 24 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
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
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.amber,
  },
  pendingText: { fontSize: 10, color: COLORS.amber, fontWeight: '600' },
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
  emptySub: { fontSize: 12, color: COLORS.textTertiary },
  classList: { gap: 10 },
  intelligenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  intelligenceLabel: { fontSize: 9, color: COLORS.textSecondary, letterSpacing: 1 },
  intelligenceValue: { fontSize: 18, color: COLORS.textPrimary, fontWeight: '700', marginTop: 4 },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  searchResult: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 10 },
  searchSubject: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  searchMeta: { color: COLORS.textSecondary, fontSize: 11, marginTop: 3 },
  recoveryBox: { marginHorizontal: 20, marginBottom: 24, padding: 14, borderWidth: 1, borderColor: COLORS.amber, backgroundColor: COLORS.surface },
  recoveryTitle: { color: COLORS.amber, fontSize: 13, fontWeight: '700' },
  recoverySub: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4 },
  insightText: { color: COLORS.textSecondary, fontSize: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  whatIfBox: { marginHorizontal: 20, marginBottom: 24, padding: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  whatIfRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  whatIfLabel: { color: COLORS.textSecondary, fontSize: 11, textTransform: 'uppercase' },
  whatIfValue: { color: COLORS.green, fontSize: 18, fontWeight: '700', fontFamily: 'monospace' },
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
  undoText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '500' },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  undoBtnText: { fontSize: 13, color: COLORS.green, fontWeight: '700' },
});
