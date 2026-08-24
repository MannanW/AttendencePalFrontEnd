import { StyleSheet, View, Text, Pressable } from 'react-native';
import { COLORS, MONTH_LABELS, DAY_LABELS } from '@/lib/constants';
import { AppData } from '@/lib/types';
import { getEntriesForDate, isCounted } from '@/lib/attendance';

interface Props {
  year: number;
  month: number; // 0-indexed
  data: AppData;
  onDayPress: (dateStr: string) => void;
  selectedDate?: string;
}

export function MonthGrid({ year, month, data, onDayPress, selectedDate }: Props) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Convert to Monday=0
  const firstDayInt = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((firstDayInt + daysInMonth) / 7) * 7;

  const cells: (string | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstDayInt + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push(null);
    } else {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum
        .toString()
        .padStart(2, '0')}`;
      cells.push(dateStr);
    }
  }

  function getDaySummary(dateStr: string) {
    const entries = getEntriesForDate(data, dateStr);
    if (entries.length === 0) return null;
    const counted = entries.filter((e) => isCounted(e.status));
    if (counted.length === 0) {
      const hasUnmarked = entries.some((e) => e.status === 'unmarked');
      return { hasUnmarked, attended: 0, missed: 0, total: 0, percent: 0 };
    }
    const attended = counted.filter(
      (e) => e.status === 'attended' || e.status === 'late' || e.status === 'official_leave'
    ).length;
    const missed = counted.filter((e) => e.status === 'missed').length;
    return {
      hasUnmarked: entries.some((e) => e.status === 'unmarked'),
      attended,
      missed,
      total: counted.length,
      percent: (attended / counted.length) * 100,
    };
  }

  return (
    <View style={styles.container}>
      <View style={styles.dayHeader}>
        {DAY_LABELS.map((d) => (
          <Text key={d} style={styles.dayLabel}>
            {d[0]}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((dateStr, i) => {
          if (!dateStr) {
            return <View key={i} style={styles.emptyCell} />;
          }
          const summary = getDaySummary(dateStr);
          const dayNum = parseInt(dateStr.slice(8), 10);
          const isSelected = dateStr === selectedDate;
          const holiday = data.holidays.find((h) => h.date === dateStr);

          return (
            <Pressable
              key={i}
              onPress={() => onDayPress(dateStr)}
              style={({ pressed }) => [
                styles.cell,
                isSelected && styles.cellSelected,
                pressed && styles.cellPressed,
              ]}
            >
              <Text
                style={[
                  styles.dayNum,
                  !summary && styles.dayNumEmpty,
                  holiday && styles.dayNumHoliday,
                ]}
              >
                {dayNum}
              </Text>
              {summary && (
                <View style={styles.indicatorRow}>
                  {summary.attended > 0 && (
                    <View
                      style={[styles.indicator, { backgroundColor: COLORS.green }]}
                    />
                  )}
                  {summary.missed > 0 && (
                    <View
                      style={[styles.indicator, { backgroundColor: COLORS.red }]}
                    />
                  )}
                  {summary.hasUnmarked && (
                    <View
                      style={[styles.indicator, { backgroundColor: COLORS.borderLight }]}
                    />
                  )}
                </View>
              )}
              {holiday && <Text style={styles.holidayDot}>●</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.2857%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    position: 'relative',
  },
  emptyCell: {
    width: '14.2857%',
    aspectRatio: 1,
  },
  cellSelected: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  cellPressed: {
    opacity: 0.6,
  },
  dayNum: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
  },
  dayNumEmpty: {
    color: COLORS.textTertiary,
  },
  dayNumHoliday: {
    color: COLORS.amber,
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 3,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  holidayDot: {
    position: 'absolute',
    bottom: 2,
    fontSize: 6,
    color: COLORS.amber,
  },
});
