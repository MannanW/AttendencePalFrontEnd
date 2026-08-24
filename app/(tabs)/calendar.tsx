import { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { COLORS, MONTH_LABELS } from '@/lib/constants';
import { useApp } from '@/lib/AppContext';
import { MonthGrid } from '@/components/MonthGrid';
import { DayTimeline } from '@/components/DayTimeline';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { todayStr } from '@/lib/attendance';

export default function CalendarScreen() {
  const { data, markEntry } = useApp();
  const today = todayStr();
  const now = new Date();

  const [viewDate, setViewDate] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthLabel = `${MONTH_LABELS[viewDate.month]} ${viewDate.year}`;

  const goPrevMonth = useCallback(() => {
    setViewDate((prev) => {
      const d = new Date(prev.year, prev.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }, []);

  const goNextMonth = useCallback(() => {
    setViewDate((prev) => {
      const d = new Date(prev.year, prev.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }, []);

  const handleDayPress = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
  }, []);

  const handleMark = useCallback(
    (entryId: string, status: any) => {
      markEntry(entryId, status);
    },
    [markEntry]
  );

  const selectedDateObj = useMemo(() => {
    if (!selectedDate) return null;
    const d = new Date(selectedDate + 'T00:00:00');
    return {
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
      monthName: MONTH_LABELS[d.getMonth()],
      day: d.getDate(),
    };
  }, [selectedDate]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Calendar</Text>
          <Text style={styles.headerSub}>
            {selectedDate && selectedDateObj
              ? `${selectedDateObj.dayName}, ${selectedDateObj.monthName} ${selectedDateObj.day}`
              : 'Tap a day to see classes'}
          </Text>
        </View>
      </View>

      {/* Month navigation */}
      <View style={styles.monthNav}>
        <Pressable onPress={goPrevMonth} style={styles.navBtn}>
          <ChevronLeft size={20} color={COLORS.textSecondary} strokeWidth={2} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={goNextMonth} style={styles.navBtn}>
          <ChevronRight size={20} color={COLORS.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.green }]} />
          <Text style={styles.legendText}>Attended</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.red }]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: COLORS.borderLight }]}
          />
          <Text style={styles.legendText}>Pending</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.amber }]} />
          <Text style={styles.legendText}>Holiday</Text>
        </View>
      </View>

      {/* Month grid */}
      <View style={styles.gridSection}>
        <MonthGrid
          year={viewDate.year}
          month={viewDate.month}
          data={data}
          onDayPress={handleDayPress}
          selectedDate={selectedDate ?? undefined}
        />
      </View>

      {/* Day timeline (lazy — only shows when a day is selected) */}
      {selectedDate && (
        <View style={styles.timelineSection}>
          <View style={styles.timelineDivider} />
          <DayTimeline
            dateStr={selectedDate}
            data={data}
            onMark={handleMark}
          />
        </View>
      )}

      {!selectedDate && (
        <View style={styles.hintSection}>
          <Text style={styles.hintText}>
            Select a date to view and mark classes
          </Text>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
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
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  gridSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  timelineSection: {
    flex: 1,
    paddingHorizontal: 20,
  paddingTop: 8,
  },
  timelineDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  hintSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  hintText: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
});
