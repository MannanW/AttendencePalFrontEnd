import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Modal, TextInput } from 'react-native';
import { COLORS, MONTH_LABELS } from '@/lib/constants';
import { useApp } from '@/lib/AppContext';
import { MonthGrid } from '@/components/MonthGrid';
import { DayTimeline } from '@/components/DayTimeline';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react-native';
import { getWeekStart, parseLocalDate } from '@/lib/attendance';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const LEGEND = [
  [COLORS.green, 'Attended'],
  [COLORS.red, 'Missed'],
  [COLORS.borderLight, 'Pending'],
  [COLORS.amber, 'Holiday'],
] as const;

export default function CalendarScreen() {
  const { data, derived, markEntry, addExtraClass } = useApp();
  const now = useMemo(() => new Date(), []);
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDate, setSelectedDate] = useState(derived.today);
  const [showExtra, setShowExtra] = useState(false);
  const [extraTime, setExtraTime] = useState('09:00');
  const [extraNote, setExtraNote] = useState('');
  const [extraSubject, setExtraSubject] = useState(data.subjects[0]?.id ?? '');
  const [extraError, setExtraError] = useState('');

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

      <Pressable
        accessibilityLabel="Add extra or make-up class"
        accessibilityRole="button"
        style={styles.fab}
        onPress={() => setShowExtra(true)}
      >
        <Plus size={20} color={COLORS.textPrimary} strokeWidth={2.5} />
        <Text style={styles.fabText}>Extra class</Text>
      </Pressable>

      <Modal visible={showExtra} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Extra Class</Text>
              <Pressable accessibilityLabel="Close" onPress={() => setShowExtra(false)}>
                <X size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.modalSub}>Selected day: {headerSub}</Text>
            <Text style={styles.fieldLabel}>SUBJECT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectPicker}>
              {data.subjects.map((subject) => (
                <Pressable key={subject.id} onPress={() => setExtraSubject(subject.id)} style={[styles.subjectPill, extraSubject === subject.id && { backgroundColor: subject.colorHex }]}>
                  <Text style={[styles.subjectPillText, extraSubject === subject.id && styles.subjectPillActive]}>{subject.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.fieldLabel}>START TIME</Text>
            <TextInput style={styles.modalInput} value={extraTime} onChangeText={setExtraTime} placeholder="09:00" placeholderTextColor={COLORS.textTertiary} keyboardType="numbers-and-punctuation" />
            <Text style={styles.fieldLabel}>NOTE</Text>
            <TextInput style={styles.modalInput} value={extraNote} onChangeText={setExtraNote} placeholder="Make-up class" placeholderTextColor={COLORS.textTertiary} />
            {extraError ? <Text style={styles.errorText}>{extraError}</Text> : null}
            <Pressable
              style={[styles.saveButton, !extraSubject && styles.disabledButton]}
              disabled={!extraSubject}
              onPress={() => {
                const [hours, minutes] = extraTime.split(':').map(Number);
                const startMin = (Number.isFinite(hours) ? hours : 9) * 60 + (Number.isFinite(minutes) ? minutes : 0);
                const date = parseLocalDate(selectedDate);
                const added = addExtraClass({
                  termId: data.terms.find((term) => term.isActive)?.id ?? 'manual',
                  weekStartDate: getWeekStart(selectedDate),
                  dayInt: (date.getDay() + 6) % 7,
                  startMin,
                  endMin: startMin + 60,
                  subjectId: extraSubject,
                  room: 'TBD',
                  status: 'unmarked',
                  note: extraNote.trim(),
                });
                if (!added) {
                  setExtraError('This time overlaps an existing class.');
                  return;
                }
                setExtraNote('');
                setExtraError('');
                setShowExtra(false);
              }}
            >
              <Text style={styles.saveButtonText}>Add to calendar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  fab: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-end', marginHorizontal: 20, marginTop: 4, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: COLORS.green, borderRadius: 6 },
  fabText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.82)' },
  modalContent: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.borderLight, padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  modalSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6, marginBottom: 18 },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 10, letterSpacing: 1, marginTop: 12, marginBottom: 7 },
  subjectPicker: { flexGrow: 0 },
  subjectPill: { borderWidth: 1, borderColor: COLORS.borderLight, paddingHorizontal: 10, paddingVertical: 8, marginRight: 7 },
  subjectPillText: { color: COLORS.textSecondary, fontSize: 11 },
  subjectPillActive: { color: COLORS.textPrimary, fontWeight: '700' },
  modalInput: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt, color: COLORS.textPrimary, padding: 11, fontSize: 13 },
  saveButton: { alignItems: 'center', backgroundColor: COLORS.green, padding: 13, marginTop: 20 },
  disabledButton: { opacity: 0.4 },
  saveButtonText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 12 },
  errorText: { color: COLORS.red, fontSize: 11, marginTop: 8 },
});
