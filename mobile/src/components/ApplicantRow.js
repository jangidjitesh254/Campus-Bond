import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chip } from './ui';
import { colors, spacing, font, radius } from '../theme';

/** One applicant inside the owner's review list, with approve/reject actions. */
export default function ApplicantRow({ applicant, onApprove, onReject }) {
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
              <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.action, styles.reject]} onPress={onReject}>
              <Ionicons name="close" size={16} color={colors.danger} />
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginTop: spacing.sm }}>
            <Chip
              label={applicant.status === 'approved' ? 'Approved' : 'Rejected'}
              tone={applicant.status === 'approved' ? 'success' : 'danger'}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { color: colors.onPrimary, fontWeight: '800', fontSize: 18 },
  name: { ...font.label, fontSize: 15 },
  sub: { ...font.small, marginTop: 2 },
  msg: { ...font.small, fontStyle: 'italic', color: colors.text, marginTop: spacing.sm },
  actions: { flexDirection: 'row', marginTop: spacing.md },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.pill,
    marginRight: spacing.md,
  },
  approve: { backgroundColor: colors.success },
  approveText: { color: colors.onPrimary, fontWeight: '700', marginLeft: 4, fontSize: 13 },
  reject: { backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger },
  rejectText: { color: colors.danger, fontWeight: '700', marginLeft: 4, fontSize: 13 },
});
