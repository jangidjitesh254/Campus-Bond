import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Field, Chip, Loading, Card } from '../../components/ui';
import ApplicantRow from '../../components/ApplicantRow';
import { EventsApi, categoryTone } from '../../api/events';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, font, radius, layout } from '../../theme';

export default function EventDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const e = await EventsApi.get(id);
      setEvent(e);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) return <Loading label="Loading…" />;
  if (!event)
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={[font.bodyMuted, { padding: spacing.xl }]}>{error || 'Not found.'}</Text>
      </SafeAreaView>
    );

  const isOwner = String(event.createdBy?._id || event.createdBy) === String(user?._id);
  const myApplication = event.applicants?.find(
    (a) => String(a.user?._id || a.user) === String(user?._id)
  );

  async function onApply() {
    setError('');
    setApplying(true);
    try {
      await EventsApi.apply(id, message.trim());
      setMessage('');
      await load();
      Alert.alert('Request sent', 'The poster will review your request.');
    } catch (e) {
      setError(e.message);
    } finally {
      setApplying(false);
    }
  }

  async function onReview(applicantId, status) {
    try {
      const updated = await EventsApi.review(id, applicantId, status);
      setEvent(updated);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  async function onToggleStatus() {
    const next = event.status === 'open' ? 'closed' : 'open';
    try {
      const updated = await EventsApi.setStatus(id, next);
      setEvent({ ...event, status: updated.status });
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  function onDelete() {
    Alert.alert('Delete post', 'This cannot be undone. Delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await EventsApi.remove(id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  }

  const owner = event.createdBy || {};

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topRow}>
          <Chip label={event.category} tone={categoryTone[event.category] || 'default'} />
          <Chip
            label={event.status === 'open' ? 'Open' : 'Closed'}
            tone={event.status === 'open' ? 'success' : 'muted'}
          />
        </View>

        <Text style={font.h1}>{event.title}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="person-circle-outline" size={18} color={colors.textMuted} />
          <Text style={styles.meta}>
            {owner.name || 'Student'}
            {owner.branch ? ` · ${owner.branch}` : ''}
            {owner.semester ? ` · Sem ${owner.semester}` : ''}
          </Text>
        </View>

        <Text style={styles.desc}>{event.description}</Text>

        {event.skillsNeeded?.length ? (
          <>
            <Text style={styles.sectionLabel}>Skills needed</Text>
            <View style={styles.skills}>
              {event.skillsNeeded.map((s, i) => (
                <View key={i} style={styles.skill}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.statsRow}>
          <Stat icon="people-outline" label="Teammates" value={event.teamSize || 1} />
          <Stat icon="checkmark-done-outline" label="Approved" value={event.approvedCount || 0} />
          <Stat icon="mail-open-outline" label="Responses" value={event.applicants?.length || 0} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* ---------- Owner view: manage applicants ---------- */}
        {isOwner ? (
          <>
            <Text style={styles.sectionLabel}>
              Responses ({event.applicants?.length || 0})
            </Text>
            {event.applicants?.length ? (
              event.applicants.map((a) => (
                <ApplicantRow
                  key={a._id}
                  applicant={a}
                  onApprove={() => onReview(a._id, 'approved')}
                  onReject={() => onReview(a._id, 'rejected')}
                />
              ))
            ) : (
              <Text style={font.bodyMuted}>No responses yet.</Text>
            )}

            <View style={styles.ownerActions}>
              <Button
                title={event.status === 'open' ? 'Close post' : 'Reopen post'}
                variant="secondary"
                onPress={onToggleStatus}
                style={{ flex: 1, marginRight: spacing.md }}
              />
              <Button title="Delete" variant="danger" onPress={onDelete} style={{ width: 110 }} />
            </View>
          </>
        ) : myApplication ? (
          /* ---------- Applicant already applied ---------- */
          <Card style={styles.statusCard}>
            <Text style={font.label}>Your request</Text>
            <View style={{ marginTop: spacing.sm }}>
              <Chip
                label={
                  myApplication.status === 'approved'
                    ? 'Approved 🎉'
                    : myApplication.status === 'rejected'
                    ? 'Not selected'
                    : 'Pending review'
                }
                tone={
                  myApplication.status === 'approved'
                    ? 'success'
                    : myApplication.status === 'rejected'
                    ? 'danger'
                    : 'accent'
                }
              />
            </View>
          </Card>
        ) : event.status === 'open' ? (
          /* ---------- Applicant can apply ---------- */
          <>
            <Text style={styles.sectionLabel}>Apply to join</Text>
            <Field
              placeholder="Add a short message (why you're a good fit)…"
              value={message}
              onChangeText={setMessage}
              multiline
              inputStyle={{ height: 90, textAlignVertical: 'top', paddingTop: spacing.md }}
            />
            <Button title="Send request" onPress={onApply} loading={applying} />
          </>
        ) : (
          <Text style={[font.bodyMuted, { marginTop: spacing.lg }]}>
            This post is closed and no longer accepting responses.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, label, value }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl, paddingBottom: layout.tabBarSpace },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  meta: { ...font.small, marginLeft: 6 },
  desc: { ...font.body, lineHeight: 22, color: colors.text },
  sectionLabel: { ...font.h3, marginTop: spacing.xl, marginBottom: spacing.md },
  skills: { flexDirection: 'row', flexWrap: 'wrap' },
  skill: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  skillText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    justifyContent: 'space-between',
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { ...font.h3, marginTop: 4 },
  statLabel: { ...font.small },
  error: { color: colors.danger, marginTop: spacing.md },
  ownerActions: { flexDirection: 'row', marginTop: spacing.xl },
  statusCard: { marginTop: spacing.xl },
});
