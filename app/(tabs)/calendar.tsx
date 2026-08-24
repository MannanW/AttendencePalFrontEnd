import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { COLORS, MONTH_LABELS } from '@/lib/constants';
import { useApp } from '@/lib/AppContext';
import { MonthGrid } from '@/components/MonthGrid';
import { DayTimeline } from '@/components/DayTimeline';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { parseLocalDate } from '@/lib/attendance';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const LEGEND = [
  [COLORS.green, 'Attended'],
  [COLORS.red, 'Missed'],
  [COLORS.borderLight, 'Pending'],
  [COLORS.amber, 'Holiday'],
] as const;

export default function CalendarScreen() {
  const { derived, markEntry } = useApp();
  const now = useMemo(() => new Date(), []);
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDate, setSelectedDate] = useState(derived.today);

  const headerSub = useMemo(() => {
    const d = parseLocalDate(selectedDate);
    return `${WEEKDAYS[d.getDay()]}, ${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`;
  }, [selectedDate]);

  const shiftMonth = useCallback((delta: number) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <Text style={styles.headerSub}>{headerSub}</Text>
      </View>

      <View style={styles.monthNav}>
        <Pressable onPress={() => shiftMonth(-1)} style={styles.navBtn}>
          <ChevronLeft size={20} color={COLORS.textSecondary} strokeWidth={2} />
        </Pressable>
        <Text style={styles.monthLabel}>
          {MONTH_LABELS[view.month]} {view.year}
        </Text>
        <Pressable onPress={() => shiftMonth(1)} style={styles.navBtn}>
          <ChevronRight size={20} color={COLORS.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.legend}>
        {LEGEND.map(([color, label]) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.gridSection}>
        <MonthGrid
          year={view.year}
          month={view.month}
          today={derived.today}
          selectedDate={selectedDate}
          summaries={derived.daySummary}
          holidays={derived.holidays}
          onDayPress={setSelectedDate}
        />
      </View>

      <View style={styles.timelineSection}>
        <View style={styles.timelineDivider} />
        <DayTimeline
          dateStr={selectedDate}
          entries={derived.byDate[selectedDate] ?? []}
          subjectById={derived.subjectById}
          holiday={derived.holidays[selectedDate]}
          onMark={markEntry}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  content: { paddingBottom: 32 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 10, color: COLORS.textSecondary },
  gridSection: { paddingHorizontal: 20, paddingVertical: 12 },
  timelineSection: { paddingHorizontal: 20, paddingTop: 8 },
  timelineDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
});
