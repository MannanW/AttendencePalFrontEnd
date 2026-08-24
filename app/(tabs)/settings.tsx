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
import { computeOverallStats } from '@/lib/attendance';
import { Download, Trash2, AlertTriangle, X } from 'lucide-react-native';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { data, exportToJson, clearAllData } = useApp();
  const [showExport, setShowExport] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [exportText, setExportText] = useState('');
  const [copied, setCopied] = useState(false);

  const overall = computeOverallStats(data);

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
                { color: overall.percent >= 75 ? COLORS.greenBright : COLORS.red },
              ]}
            >
              {overall.total > 0 ? `${overall.percent.toFixed(1)}%` : '—'}
            </Text>
          </View>
        </View>
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
              <Download size={18} color={COLORS.greenBright} strokeWidth={2} />
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
