import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Chip } from './ui';
import { categoryTone } from '../api/events';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, font, radius } from '../theme';

/** A single event/team-request card in the feed, with inline post actions. */
export default function EventCard({ event, onPress, onInterested, onComment, onShare }) {
  const { t, kinds, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const { user } = useAuth();
  const owner = event.createdBy || {};
  const isOwner = String(owner._id || event.createdBy) === String(user?._id);
  const interested = (event.applicants || []).some(
    (a) => String(a.user?._id || a.user) === String(user?._id)
  );

  return (
    <Card style={styles.card}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        <View style={styles.topRow}>
          <Chip label={event.category} tone={categoryTone[event.category] || 'default'} />
          <Chip
            label={event.status === 'open' ? 'Open' : 'Closed'}
            tone={event.status === 'open' ? 'success' : 'muted'}
          />
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={14} color={t.textMuted} />
          <Text style={styles.meta}>
            {owner.name || 'Student'}
            {owner.branch ? ` · ${owner.branch}` : ''}
            {owner.semester ? ` · Sem ${owner.semester}` : ''}
          </Text>
        </View>

        {event.skillsNeeded?.length ? (
          <View style={styles.skills}>
            {event.skillsNeeded.slice(0, 4).map((s, i) => (
              <View key={i} style={styles.skill}>
                <Text style={styles.skillText}>{s}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Inline action bar — always visible on the post */}
      <View style={styles.actions}>
        {isOwner ? (
          <View style={[styles.interest, styles.interestMuted]}>
            <Ionicons name="megaphone-outline" size={16} color={t.textMuted} />
            <Text style={styles.interestMutedText}>Your post</Text>
          </View>
        ) : interested ? (
          <TouchableOpacity style={[styles.interest, styles.interestDone]} onPress={onInterested}>
            <Ionicons name="checkmark-circle" size={16} color={t.primary} />
            <Text style={styles.interestDoneText}>Interested</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.interest} onPress={onInterested} activeOpacity={0.85}>
            <Ionicons name="hand-left" size={15} color={t.onPrimary} />
            <Text style={styles.interestText}>I'm interested</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.iconBtn} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={19} color={t.text} />
          <Text style={styles.iconBtnText}>
            {event.comments?.length ? event.comments.length : ''} Comment
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={onShare}>
          <Ionicons name="share-social-outline" size={19} color={t.text} />
          <Text style={styles.iconBtnText}>Share</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    card: { marginBottom: spacing.lg },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
    title: { ...font.h3, color: t.text, marginBottom: spacing.sm },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    meta: { ...font.small, color: t.textMuted, marginLeft: 6 },
    skills: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
    skill: {
      backgroundColor: t.surfaceAlt,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
    },
    skillText: { fontSize: 12, color: t.primaryDark, fontWeight: '600' },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: t.border,
      paddingTop: spacing.md,
      marginTop: spacing.xs,
    },
    interest: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.primary,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      height: 36,
      gap: 5,
    },
    interestText: { color: t.onPrimary, fontWeight: '800', fontSize: 13 },
    interestDone: { backgroundColor: t.primarySoft },
    interestDoneText: { color: t.primary, fontWeight: '800', fontSize: 13 },
    interestMuted: { backgroundColor: t.surfaceAlt },
    interestMutedText: { color: t.textMuted, fontWeight: '800', fontSize: 13 },
    iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.md, height: 36, marginLeft: 'auto' },
    iconBtnText: { fontSize: 12.5, fontWeight: '700', color: t.text },
    });
  }
