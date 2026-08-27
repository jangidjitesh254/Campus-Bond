import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chip } from './ui';
import { useTheme } from '../context/ThemeContext';
import { spacing, font, radius } from '../theme';

/** One applicant inside the owner's review list, with approve/reject actions. */
export default function ApplicantRow({ applicant, onApprove, onReject, onMessage }) {
  const { t, kinds, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const u = applicant.user || {};
  const pending = applicant.status === 'pending';

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(u.name || '?').charAt(0).toUpperCase()}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{u.name || 'Student'}</Text>
        <Text style={styles.sub}>
          {u.branch || '—'}
          {u.semester ? ` · Sem ${u.semester}` : ''}
        </Text>
        {applicant.message ? <Text style={styles.msg}>“{applicant.message}”</Text> : null}

        {pending ? (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.action, styles.approve]} onPress={onApprove}>
              <Ionicons name="checkmark" size={16} color={t.onPrimary} />
              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.action, styles.reject]} onPress={onReject}>
              <Ionicons name="close" size={16} color={t.danger} />
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.reviewedRow}>
            <Chip
              label={applicant.status === 'approved' ? 'Approved' : 'Rejected'}
              tone={applicant.status === 'approved' ? 'success' : 'danger'}
            />
            {applicant.status === 'approved' && onMessage ? (
              <TouchableOpacity style={styles.msgBtn} onPress={onMessage}>
                <Ionicons name="chatbubbles" size={14} color={t.onPrimary} />
                <Text style={styles.msgBtnText}>Message</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      backgroundColor: t.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: t.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    avatarText: { color: t.onPrimary, fontWeight: '800', fontSize: 18 },
    name: { ...font.label, color: t.text, fontSize: 15 },
    sub: { ...font.small, color: t.textMuted, marginTop: 2 },
    msg: { ...font.small, color: t.textMuted, fontStyle: 'italic', color: t.text, marginTop: spacing.sm },
    actions: { flexDirection: 'row', marginTop: spacing.md },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: 8,
      borderRadius: radius.pill,
      marginRight: spacing.md,
    },
    approve: { backgroundColor: t.success },
    approveText: { color: t.onPrimary, fontWeight: '700', marginLeft: 4, fontSize: 13 },
    reject: { backgroundColor: t.dangerSoft, borderWidth: 1, borderColor: t.danger },
    rejectText: { color: t.danger, fontWeight: '700', marginLeft: 4, fontSize: 13 },
    reviewedRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.md },
    msgBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
      gap: 4,
    },
    msgBtnText: { color: t.onPrimary, fontWeight: '700', fontSize: 12 },
    });
  }
