import { memo, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { COLORS, DAY_LABELS } from '@/lib/constants';
import { DaySummary } from '@/lib/attendance';

interface Props {
  year: number;
  month: number;
  today: string;
  selectedDate: string;
  summaries: Record<string, DaySummary>;
  holidays: Record<string, string>;
  onDayPress: (dateStr: string) => void;
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export const MonthGrid = memo(function MonthGrid({
  year,
  month,
  today,
  selectedDate,
  summaries,
  holidays,
  onDayPress,
}: Props) {
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const days = new Date(year, month + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    const total = Math.ceil((offset + days) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const day = i - offset + 1;
      if (day < 1 || day > days) return null;
      return `${year}-${pad(month + 1)}-${pad(day)}`;
    });
  }, [year, month]);

  return (
    <View>
      <View style={styles.dayHeader}>
        {DAY_LABELS.map((d) => (
          <Text key={d} style={styles.dayLabel}>
            {d[0]}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((dateStr, i) => {
          if (!dateStr) return <View key={i} style={styles.emptyCell} />;
          const summary = summaries[dateStr];
          const holiday = holidays[dateStr];
          return (
            <Pressable
              key={dateStr}
              accessibilityLabel={`${dateStr}${holiday ? `, holiday: ${holiday}` : ''}${summary ? ', has attendance records' : ''}`}
              accessibilityRole="button"
              onPress={() => onDayPress(dateStr)}
              style={({ pressed }) => [
                styles.cell,
                dateStr === today && styles.cellToday,
                dateStr === selectedDate && styles.cellSelected,
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
                {dateStr.slice(8)}
              </Text>
              {summary ? (
                <View style={styles.indicatorRow}>
                  {summary.attended ? (
                    <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
                  ) : null}
                  {summary.missed ? (
                    <View style={[styles.dot, { backgroundColor: COLORS.red }]} />
                  ) : null}
                  {summary.hasUnmarked ? (
                    <View
                      style={[styles.dot, { backgroundColor: COLORS.borderLight }]}
                    />
                  ) : null}
                  {summary.officialLeave ? <View style={styles.leaveDot} /> : null}
                </View>
              ) : null}
              {holiday ? <Text style={styles.holidayDot}>●</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const CELL_W = '14.2857%';

const styles = StyleSheet.create({
  dayHeader: { flexDirection: 'row', marginBottom: 8 },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: CELL_W,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    position: 'relative',
  },
  emptyCell: { width: CELL_W, aspectRatio: 1 },
  cellToday: { borderWidth: 1, borderColor: COLORS.green },
  cellSelected: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  cellPressed: { opacity: 0.6 },
  dayNum: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
  },
  dayNumEmpty: { color: COLORS.textTertiary },
  dayNumHoliday: { color: COLORS.amber },
  indicatorRow: { flexDirection: 'row', gap: 2, marginTop: 3 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  leaveDot: { width: 5, height: 5, borderRadius: 3, borderWidth: 1, borderColor: COLORS.blue },
  holidayDot: {
    position: 'absolute',
    bottom: 2,
    fontSize: 6,
    color: COLORS.amber,
  },
});
