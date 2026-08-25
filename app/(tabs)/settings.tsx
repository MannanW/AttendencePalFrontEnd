import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { COLORS } from '@/lib/constants';
import { useApp } from '@/lib/AppContext';
import { Download, FileSpreadsheet, Trash2, AlertTriangle, X } from 'lucide-react-native';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { data, derived, exportToJson, exportCsv, clearAllData, metricMode, setMetricMode, closeTerm, reopenTerm, bulkPause, copyDaySchedule, notificationsEnabled, setNotificationsEnabled } = useApp();
  const { overall } = derived;
  const [showExport, setShowExport] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [exportText, setExportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [pauseFrom, setPauseFrom] = useState('');
  const [pauseTo, setPauseTo] = useState('');
  const [copyWeek, setCopyWeek] = useState(derived.today);

  function handleExport() {
    const json = exportToJson();
    setExportText(json);
    setShowExport(true);
  }

  function handleCopy() {
    // Web clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(exportText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        // clipboard permission denied
      });
    }
  }

  function handleReset() {
    clearAllData();
    setShowConfirm(false);
    router.replace('/onboarding');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Stats summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Subjects</Text>
            <Text style={styles.statValue}>{data.subjects.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total classes tracked</Text>
            <Text style={styles.statValue}>{overall.total}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Overall attendance</Text>
            <Text
              style={[
                styles.statValue,
                { color: overall.percent >= 75 ? COLORS.green : COLORS.red },
              ]}
            >
              {overall.total > 0 ? `${overall.percent.toFixed(1)}%` : '—'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analytics</Text>
        <View style={styles.toggleRow}>
          {(['count', 'hours'] as const).map((mode) => (
            <Pressable key={mode} accessibilityRole="button" onPress={() => setMetricMode(mode)} style={[styles.toggle, metricMode === mode && styles.toggleActive]}>
              <Text style={[styles.toggleText, metricMode === mode && styles.toggleTextActive]}>{mode === 'count' ? 'Class Count' : 'Hours'}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statLabel}>Cached attendance time</Text>
          <Text style={styles.statValue}>{metricMode === 'hours' ? `${((data.phase3Cache?.overallMinutes.attended ?? 0) / 60).toFixed(1)} h attended` : `${overall.total} classes counted`}</Text>
        </View>
        <Text style={styles.sectionTitle}>Weekly Trend</Text>
        {(data.weeklySnapshots ?? []).slice(-6).map((snapshot) => (
          <View key={`${snapshot.subjectId}-${snapshot.weekStartDate}`} style={styles.trendRow}>
            <Text style={styles.statLabel}>{snapshot.weekStartDate}</Text><Text style={styles.statValue}>{snapshot.percent.toFixed(1)}%</Text>
          </View>
        ))}
      </View>

      {/* Data management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <Pressable
          style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}
          onPress={handleExport}
        >
          <View style={styles.actionLeft}>
            <View style={styles.actionIcon}>
              <Download size={18} color={COLORS.green} strokeWidth={2} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Export Backup</Text>
              <Text style={styles.actionSub}>
                Copy your data as JSON to save or transfer
              </Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]} onPress={() => { if (typeof navigator !== 'undefined' && navigator.clipboard) void navigator.clipboard.writeText(exportCsv()).catch(() => undefined); }}>
          <View style={styles.actionLeft}><View style={styles.actionIcon}><FileSpreadsheet size={18} color={COLORS.green} /></View><View><Text style={styles.actionTitle}>Export CSV</Text><Text style={styles.actionSub}>Copy a spreadsheet-ready attendance report</Text></View></View><Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}
          onPress={() => setShowConfirm(true)}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: COLORS.redDim }]}>
              <Trash2 size={18} color={COLORS.red} strokeWidth={2} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Reset All Data</Text>
              <Text style={styles.actionSub}>
                Delete everything and start fresh
              </Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schedule Tools</Text>
        {(data.terms ?? []).map((term) => (
          <Pressable key={term.id} style={styles.toolRow} onPress={() => term.isActive ? closeTerm(term.id) : reopenTerm(term.id)}>
            <Text style={styles.statLabel}>{term.name}</Text><Text style={styles.toolAction}>{term.isActive ? 'Close term' : 'Reopen term'}</Text>
          </Pressable>
        ))}
        <TextInput style={styles.toolInput} value={copyWeek} onChangeText={setCopyWeek} placeholder="Week start: YYYY-MM-DD" placeholderTextColor={COLORS.textTertiary} />
        <Pressable style={styles.toolButton} onPress={() => copyDaySchedule(0, 5, copyWeek)}><Text style={styles.toolButtonText}>Copy Monday to Saturday</Text></Pressable>
        <TextInput style={styles.toolInput} value={pauseFrom} onChangeText={setPauseFrom} placeholder="Pause from: YYYY-MM-DD" placeholderTextColor={COLORS.textTertiary} />
        <TextInput style={styles.toolInput} value={pauseTo} onChangeText={setPauseTo} placeholder="Pause to: YYYY-MM-DD" placeholderTextColor={COLORS.textTertiary} />
        <Pressable style={styles.toolButton} disabled={!pauseFrom || !pauseTo} onPress={() => bulkPause(pauseFrom, pauseTo)}><Text style={styles.toolButtonText}>Bulk pause schedule</Text></Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminders</Text>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: notificationsEnabled }}
          style={styles.toolRow}
          onPress={() => void setNotificationsEnabled(!notificationsEnabled)}
        >
          <View>
            <Text style={styles.statLabel}>Class reminders</Text>
            <Text style={styles.actionSub}>Local alerts for upcoming unmarked classes</Text>
          </View>
          <Text style={[styles.toolAction, !notificationsEnabled && { color: COLORS.textTertiary }]}>{notificationsEnabled ? 'ON' : 'OFF'}</Text>
        </Pressable>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutText}>
            ATTEND is a local-only attendance tracker built for the 75%
            compliance threshold. All data stays on this device — no cloud
            sync, no account required.
          </Text>
          <Text style={styles.aboutVersion}>Version 1.0.0 · Phase 1 MVP</Text>
        </View>
      </View>

      {/* Export modal */}
      <Modal visible={showExport} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Export Backup</Text>
              <Pressable onPress={() => setShowExport(false)}>
                <X size={20} color={COLORS.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>
            <Text style={styles.modalSub}>
              Copy this JSON and save it somewhere safe. You can restore it
              later from the onboarding screen.
            </Text>
            <ScrollView style={styles.exportScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.exportText}>{exportText}</Text>
            </ScrollView>
            <Pressable
              style={[styles.modalBtn, styles.modalBtnPrimary]}
              onPress={handleCopy}
            >
              <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Confirm reset modal */}
      <Modal visible={showConfirm} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.warningIcon}>
              <AlertTriangle size={32} color={COLORS.red} strokeWidth={2} />
            </View>
            <Text style={styles.modalTitle}>Reset All Data?</Text>
            <Text style={styles.modalSub}>
              This will permanently delete all subjects, schedules, and
              attendance records. This cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: COLORS.red }]}
                onPress={handleReset}
              >
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>
                  Delete All
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
  },
  toggleRow: { flexDirection: 'row', borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  toggle: { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: COLORS.surface },
  toggleActive: { backgroundColor: COLORS.green },
  toggleText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  toggleTextActive: { color: COLORS.textPrimary },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  toolRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  toolAction: { color: COLORS.green, fontSize: 11, fontWeight: '700' },
  toolInput: { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, color: COLORS.textPrimary, padding: 11, marginBottom: 8, fontSize: 12 },
  toolButton: { alignItems: 'center', backgroundColor: COLORS.green, padding: 12, marginBottom: 10 },
  toolButtonText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 8,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  chevron: {
    fontSize: 22,
    color: COLORS.textTertiary,
  },
  aboutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  aboutText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  aboutVersion: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontFamily: 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    lineHeight: 18,
  },
  exportScroll: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 12,
    maxHeight: 300,
    marginBottom: 16,
  },
  exportText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  warningIcon: {
    alignItems: 'center',
    marginBottom: 16,
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
});
