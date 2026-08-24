import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { COLORS } from '@/lib/constants';
import { AppData, Subject } from '@/lib/types';
import { getEntriesForDate, minToTime } from '@/lib/attendance';
import { NextClassCard } from './NextClassCard';

interface Props {
  dateStr: string;
  data: AppData;
  onMark: (entryId: string, status: any) => void;
}

export function DayTimeline({ dateStr, data, onMark }: Props) {
  const entries = getEntriesForDate(data, dateStr);
  const date = new Date(dateStr + 'T00:00:00');
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  const holiday = data.holidays.find((h) => h.date === dateStr);

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No classes scheduled</Text>
        <Text style={styles.emptySub}>
          {holiday ? holiday.label : 'Free day — enjoy it.'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.dateLabel}>
          {dayName}, {monthName} {date.getDate()}
        </Text>
        {holiday && (
          <View style={styles.holidayBadge}>
            <Text style={styles.holidayText}>{holiday.label}</Text>
          </View>
        )}
      </View>

      <View style={styles.timeline}>
        {entries.map((entry, idx) => {
          const subject = data.subjects.find((s) => s.id === entry.subjectId);
          const isLast = idx === entries.length - 1;
          return (
            <View key={entry.id} style={styles.timelineItem}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>
                  {minToTime(entry.startMin)}
                </Text>
                <Text style={styles.timeEnd}>
                  {minToTime(entry.endMin)}
                </Text>
              </View>
              <View style={styles.lineColumn}>
                <View
                  style={[
                    styles.line,
                    isLast && styles.lineEnd,
                  ]}
                />
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: subject?.colorHex ?? COLORS.green },
                  ]}
                />
              </View>
              <View style={styles.cardColumn}>
                <NextClassCard
                  entry={entry}
                  subject={subject}
                  onMark={(status) => onMark(entry.id, status)}
                />
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  holidayBadge: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.amber,
  },
  holidayText: {
    fontSize: 10,
    color: COLORS.amber,
    fontWeight: '600',
  },
  timeline: {
    paddingLeft: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timeColumn: {
    width: 52,
    paddingTop: 14,
  },
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
  lineColumn: {
    width: 20,
    alignItems: 'center',
    paddingTop: 14,
  },
  line: {
    position: 'absolute',
    top: 28,
    bottom: -12,
    width: 1,
    backgroundColor: COLORS.border,
  },
  lineEnd: {
    display: 'none',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    zIndex: 1,
  },
  cardColumn: {
    flex: 1,
    marginLeft: 8,
  },
});
