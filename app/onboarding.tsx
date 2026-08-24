import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, TextInput, Modal } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SUBJECT_COLORS, DAY_LABELS_FULL } from '@/lib/constants';
import { useApp } from '@/lib/AppContext';
import { getWeekStart, todayStr } from '@/lib/attendance';
import { Subject } from '@/lib/types';

export default function OnboardingScreen() {
  const { loadSampleData, importFromJson, completeManualSetup } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [restoreText, setRestoreText] = useState('');
  const [restoreError, setRestoreError] = useState('');

  function handleLoadSample() {
    loadSampleData();
    router.replace('/(tabs)/dashboard');
  }

  function handleRestore() {
    try {
      if (!restoreText.trim()) {
        setRestoreError('Paste your backup JSON first.');
        return;
      }
      importFromJson(restoreText).then(() => {
        router.replace('/(tabs)/dashboard');
      }).catch(() => {
        setRestoreError('Invalid backup file — check the JSON format.');
      });
    } catch {
      setRestoreError('Invalid backup file — check the JSON format.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.appName}>ATTEND</Text>
        <Text style={styles.tagline}>75% compliance tracker</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Get Started</Text>
        <Text style={styles.cardSub}>
          Set up your timetable to start tracking attendance.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
          onPress={() => setShowAddForm(true)}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.optionIconText}>+</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Add Subjects & Schedule</Text>
            <Text style={styles.optionSub}>
              Manually enter your subjects and weekly class times
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
          onPress={handleLoadSample}
        >
          <View style={[styles.optionIcon, { backgroundColor: COLORS.greenDim }]}>
            <Text style={[styles.optionIconText, { color: COLORS.green }]}>
              ★
            </Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Load Sample Timetable</Text>
            <Text style={styles.optionSub}>
              B.Tech CSE sample with realistic attendance near 75%
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
          onPress={() => setShowRestore(true)}
        >
          <View style={[styles.optionIcon, { backgroundColor: COLORS.surfaceHover }]}>
            <Text style={styles.optionIconText}>↺</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Restore from Backup</Text>
            <Text style={styles.optionSub}>
              Import a previously exported JSON backup file
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          All data stays on this device. No cloud, no account.
        </Text>
      </View>

      <AddScheduleModal
        visible={showAddForm}
        onClose={() => setShowAddForm(false)}
        completeManualSetup={completeManualSetup}
      />

      <Modal visible={showRestore} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Restore from Backup</Text>
            <Text style={styles.modalSub}>
              Paste your exported JSON backup below:
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={restoreText}
              onChangeText={setRestoreText}
              placeholder='{"version":1,"subjects":...'
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            {restoreError ? (
              <Text style={styles.errorText}>{restoreError}</Text>
            ) : null}
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => {
                  setShowRestore(false);
                  setRestoreText('');
                  setRestoreError('');
                }}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleRestore}
              >
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>
                  Restore
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function AddScheduleModal({
  visible,
  onClose,
  completeManualSetup,
}: {
  visible: boolean;
  onClose: () => void;
  completeManualSetup: ReturnType<typeof useApp>['completeManualSetup'];
}) {
  const [subjects, setSubjects] = useState<
    { name: string; colorHex: string; targetPercent: number }[]
  >([{ name: '', colorHex: SUBJECT_COLORS[0], targetPercent: 75 }]);
  const [slots, setSlots] = useState<
    { dayInt: number; startMin: number; endMin: number; subjectIdx: number; room: string }[]
  >([]);

  function addSubjectRow() {
    setSubjects([
      ...subjects,
      {
        name: '',
        colorHex: SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length],
        targetPercent: 75,
      },
    ]);
  }

  function addSlot() {
    setSlots([
      ...slots,
      { dayInt: 0, startMin: 9 * 60, endMin: 10 * 60, subjectIdx: 0, room: '' },
    ]);
  }

  function handleSave() {
    const validSubjects = subjects.filter((s) => s.name.trim());
    if (validSubjects.length === 0) return;

    const createdSubjects = validSubjects.map((s) => ({
      name: s.name.trim(),
      colorHex: s.colorHex,
      targetPercent: s.targetPercent,
      aliases: [] as string[],
    }));

    const weekStartStr = getWeekStart(todayStr());
    const entries = slots
      .filter((slot) => slot.subjectIdx < createdSubjects.length)
      .map((slot) => ({
        termId: 'manual',
        weekStartDate: weekStartStr,
        dayInt: slot.dayInt,
        startMin: slot.startMin,
        endMin: slot.endMin,
        subjectIdx: slot.subjectIdx,
        room: slot.room || 'TBD',
        status: 'unmarked' as const,
        note: '',
        isExtra: false,
      }));

    completeManualSetup(createdSubjects, entries);
    onClose();
    router.replace('/(tabs)/dashboard');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.modalTitle}>Add Your Schedule</Text>

          <Text style={styles.sectionLabel}>SUBJECTS</Text>
          {subjects.map((subj, i) => (
            <View key={i} style={styles.subjectRow}>
              <View
                style={[styles.colorSwatch, { backgroundColor: subj.colorHex }]}
              />
              <TextInput
                style={styles.subjectInput}
                value={subj.name}
                onChangeText={(text) => {
                  const next = [...subjects];
                  next[i].name = text;
                  setSubjects(next);
                }}
                placeholder="Subject name"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
          ))}
          <Pressable style={styles.addBtn} onPress={addSubjectRow}>
            <Text style={styles.addBtnText}>+ Add Subject</Text>
          </Pressable>

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>CLASS SLOTS</Text>
          {slots.map((slot, i) => (
            <View key={i} style={styles.slotRow}>
              <View style={styles.slotDayPicker}>
                {DAY_LABELS_FULL.slice(0, 6).map((d, di) => (
                  <Pressable
                    key={di}
                    onPress={() => {
                      const next = [...slots];
                      next[i].dayInt = di;
                      setSlots(next);
                    }}
                    style={[
                      styles.dayPill,
                      slot.dayInt === di && styles.dayPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayPillText,
                        slot.dayInt === di && styles.dayPillTextActive,
                      ]}
                    >
                      {d[0]}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.slotInputs}>
                <TextInput
                  style={[styles.timeInput, { flex: 1 }]}
                  value={String(Math.floor(slot.startMin / 60)).padStart(2, '0')}
                  onChangeText={(text) => {
                    const h = parseInt(text) || 0;
                    const next = [...slots];
                    next[i].startMin = h * 60 + (slot.startMin % 60);
                    setSlots(next);
                  }}
                  placeholder="HH"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="numeric"
                />
                <Text style={styles.timeColon}>:</Text>
                <TextInput
                  style={[styles.timeInput, { flex: 1 }]}
                  value={String(slot.startMin % 60).padStart(2, '0')}
                  onChangeText={(text) => {
                    const m = parseInt(text) || 0;
                    const next = [...slots];
                    next[i].startMin = Math.floor(slot.startMin / 60) * 60 + m;
                    setSlots(next);
                  }}
                  placeholder="MM"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="numeric"
                />
                <Text style={styles.timeDash}>—</Text>
                <TextInput
                  style={[styles.timeInput, { flex: 1 }]}
                  value={String(Math.floor(slot.endMin / 60)).padStart(2, '0')}
                  onChangeText={(text) => {
                    const h = parseInt(text) || 0;
                    const next = [...slots];
                    next[i].endMin = h * 60 + (slot.endMin % 60);
                    setSlots(next);
                  }}
                  placeholder="HH"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="numeric"
                />
                <Text style={styles.timeColon}>:</Text>
                <TextInput
                  style={[styles.timeInput, { flex: 1 }]}
                  value={String(slot.endMin % 60).padStart(2, '0')}
                  onChangeText={(text) => {
                    const m = parseInt(text) || 0;
                    const next = [...slots];
                    next[i].endMin = Math.floor(slot.endMin / 60) * 60 + m;
                    setSlots(next);
                  }}
                  placeholder="MM"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.slotBottomRow}>
                <View style={styles.subjectPicker}>
                  {subjects.map((s, si) => (
                    <Pressable
                      key={si}
                      onPress={() => {
                        const next = [...slots];
                        next[i].subjectIdx = si;
                        setSlots(next);
                      }}
                      style={[
                        styles.subjectPill,
                        slot.subjectIdx === si && {
                          backgroundColor: s.colorHex,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.subjectPillText,
                          slot.subjectIdx === si && { color: '#FFFFFF' },
                        ]}
                        numberOfLines={1}
                      >
                        {s.name || `Sub ${si + 1}`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={[styles.roomInput, { flex: 1 }]}
                  value={slot.room}
                  onChangeText={(text) => {
                    const next = [...slots];
                    next[i].room = text;
                    setSlots(next);
                  }}
                  placeholder="Room"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
            </View>
          ))}
          <Pressable style={styles.addBtn} onPress={addSlot}>
            <Text style={styles.addBtnText}>+ Add Class Slot</Text>
          </Pressable>

          <View style={styles.modalButtons}>
            <Pressable
              style={[styles.modalBtn, styles.modalBtnSecondary]}
              onPress={onClose}
            >
              <Text style={styles.modalBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalBtn, styles.modalBtnPrimary]}
              onPress={handleSave}
            >
              <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>
                Save & Start
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionIconText: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  optionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  chevron: {
    fontSize: 22,
    color: COLORS.textTertiary,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  textArea: {
    minHeight: 120,
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.red,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnSecondary: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modalBtnPrimary: {
    backgroundColor: COLORS.green,
  },
  modalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 10,
  },
  subjectInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  addBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addBtnText: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: '600',
  },
  slotRow: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  slotDayPicker: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  dayPill: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  dayPillActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  dayPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dayPillTextActive: {
    color: '#FFFFFF',
  },
  slotInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 6,
    color: COLORS.textPrimary,
    fontSize: 12,
    fontFamily: 'monospace',
    minWidth: 32,
    textAlign: 'center',
  },
  timeColon: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
  timeDash: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginHorizontal: 4,
  },
  slotBottomRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  subjectPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  subjectPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  subjectPillText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  roomInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: COLORS.textPrimary,
    fontSize: 12,
    maxWidth: 80,
  },
});
