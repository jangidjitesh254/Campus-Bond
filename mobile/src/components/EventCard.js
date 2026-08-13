import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Chip } from './ui';
import { categoryTone } from '../api/events';
import { colors, spacing, font, radius } from '../theme';

/** A single event/team-request card in the feed. Mirrors Sunstone's event cards. */
export default function EventCard({ event, onPress }) {
  const owner = event.createdBy || {};
  const applicants = event.applicants?.length || 0;

  return (
    <Card style={styles.card} onPress={onPress}>
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
        <Ionicons name="person-outline" size={14} color={colors.textMuted} />
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

      <View style={styles.footer}>
        <View style={styles.footItem}>
          <Ionicons name="people-outline" size={15} color={colors.primary} />
          <Text style={styles.footText}>
            {event.teamSize ? `${event.teamSize} needed` : 'Team'}
          </Text>
        </View>
        <View style={styles.footItem}>
          <Ionicons name="mail-open-outline" size={15} color={colors.primary} />
          <Text style={styles.footText}>
            {applicants} {applicants === 1 ? 'response' : 'responses'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { ...font.h3, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  meta: { ...font.small, marginLeft: 6 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  skill: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  skillText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  footItem: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.xl },
  footText: { ...font.small, color: colors.primary, marginLeft: 5, fontWeight: '600' },
});
