import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './Text';
import { handleOf, timeAgo } from './ThreadPost';
import { useTheme } from '../context/ThemeContext';
import { shadow } from '../theme';

const CAT = {
  tech: 'TECH', cultural: 'CULTURAL', sports: 'SPORTS',
  academic: 'ACADEMIC', arts: 'ARTS', social: 'SOCIAL', other: 'GENERAL',
};

/** Milestones give a club something to grow towards. */
const TIERS = [
  { at: 0, label: 'NEW' },
  { at: 5, label: 'GROWING' },
  { at: 15, label: 'ACTIVE' },
  { at: 30, label: 'THRIVING' },
  { at: 60, label: 'FLAGSHIP' },
];

function tierFor(count) {
  let tier = TIERS[0];
  for (const step of TIERS) if (count >= step.at) tier = step;
  return tier.label;
}

function initials(name) {
  return (name || '?').split(' ').filter(Boolean).map((w) => w.charAt(0)).slice(0, 2).join('').toUpperCase();
}

/**
 * Club card — category tag + age, name, one-line pitch, divider, president,
 * then the request pill with member count and growth tier.
 */
export default function ClubCard({ club, onPress, onAction, busy }) {
  const { t, clubs, isDark } = useTheme();
  const c = clubs[club.category] || clubs.other;
  const styles = useMemo(() => makeStyles(t, c, isDark), [t, c, isDark]);

  const members = club.memberCount || 0;
  const president = club.createdBy || {};

  const state = club.isAdmin
    ? { label: 'President', kind: 'role' }
    : club.isMember
    ? { label: 'Member', kind: 'role' }
    : club.myRequest === 'pending'
    ? { label: 'Request sent', kind: 'muted' }
    : club.myRequest === 'rejected'
    ? { label: 'Not selected', kind: 'muted' }
    : { label: 'Request to join', kind: 'cta' };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.96} onPress={onPress}>
      <View style={styles.meta}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{CAT[club.category] || 'CLUB'}</Text>
        </View>
        <View style={styles.metaRight}>
          {club.isAdmin && club.pendingCount ? (
            <View style={styles.pending}><Text style={styles.pendingText}>{club.pendingCount} to review</Text></View>
          ) : null}
          <Text style={styles.age}>{timeAgo(club.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.title}>{club.name}</Text>
      {club.description ? <Text style={styles.desc} numberOfLines={2}>{club.description}</Text> : null}

      <View style={styles.divider} />

      <View style={styles.author}>
        <View style={styles.ava}><Text style={styles.avaText}>{initials(president.name)}</Text></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>{handleOf(president.name)}</Text>
          <Text style={styles.sub} numberOfLines={1}>President{president.branch ? ` · ${president.branch}` : ''}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {state.kind === 'cta' ? (
          <TouchableOpacity style={[styles.pill, styles.pillTint]} onPress={onAction} disabled={busy} activeOpacity={0.85}>
            <Text style={[styles.pillText, { color: c.fg }]}>{state.label}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.pill, state.kind === 'muted' ? styles.pillMuted : styles.pillOutline]}>
            <Text style={[styles.pillText, { color: state.kind === 'muted' ? t.textMuted : t.text }]}>{state.label}</Text>
          </View>
        )}
        <Text style={styles.count}>{members} {members === 1 ? 'member' : 'members'}</Text>
        <Text style={styles.tier}>{tierFor(members)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(t, c, isDark) {
  return StyleSheet.create({
    card: {
      backgroundColor: t.glass,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: t.glassBorder,
      padding: 18,
      marginHorizontal: 20,
      marginBottom: 14,
      gap: 12,
      ...shadow.card,
    },
    meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    metaRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: c.bg },
    badgeText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: c.fg },
    age: { fontSize: 12, fontWeight: '600', color: t.textDim },
    pending: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: t.accentSoft },
    pendingText: { fontSize: 10.5, fontWeight: '800', color: t.accent },
    title: { fontSize: 18, fontWeight: '600', color: t.text },
    desc: { fontSize: 14, lineHeight: 19.5, fontWeight: '600', color: t.textMuted, marginTop: -4 },
    divider: { height: 1, backgroundColor: t.hairline },
    author: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    ava: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' },
    avaText: { fontSize: 12, fontWeight: '800', color: c.fg },
    name: { fontSize: 14, fontWeight: '700', color: t.text },
    sub: { fontSize: 12, fontWeight: '600', color: t.textDim, marginTop: 1 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
    pill: { borderRadius: 20, paddingVertical: 9, paddingHorizontal: 18, borderWidth: 1.5, borderColor: 'transparent' },
    pillTint: { backgroundColor: c.bg },
    pillOutline: { borderColor: t.borderSoft },
    pillMuted: { backgroundColor: t.primarySoft },
    pillText: { fontSize: 13, fontWeight: '800' },
    count: { fontSize: 13, fontWeight: '600', color: t.textFaint },
    tier: { marginLeft: 'auto', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5, color: t.textDim },
  });
}
