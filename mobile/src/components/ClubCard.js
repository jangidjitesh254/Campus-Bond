import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ClubDoodle from './ClubDoodle';
import { handleOf, timeAgo } from './ThreadPost';
import { useTheme } from '../context/ThemeContext';
import { monoFamily } from '../theme';

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
 * Club card — same anatomy as the home feed card (badge + meta, title, author
 * row, action bar). The category doodle is the only flourish.
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
    ? { label: 'Requested', kind: 'muted' }
    : club.myRequest === 'rejected'
    ? { label: 'Not selected', kind: 'muted' }
    : { label: 'Request to join', kind: 'cta' };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.96} onPress={onPress}>
      <View style={styles.body}>
        {/* the flourish, kept faint so the card still reads as branding */}
        <ClubDoodle category={club.category} color={c.fg} size={74} style={styles.doodle} />

        <View style={styles.meta}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{CAT[club.category] || 'CLUB'}</Text>
          </View>
          <Text style={styles.age}>{timeAgo(club.createdAt)}</Text>
          {club.isAdmin && club.pendingCount ? (
            <View style={styles.pending}>
              <Text style={styles.pendingText}>{club.pendingCount} new</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.title}>{club.name}</Text>
        {club.description ? (
          <Text style={styles.desc} numberOfLines={2}>{club.description}</Text>
        ) : null}

        <View style={styles.author}>
          <View style={styles.ava}>
            <Text style={styles.avaText}>{initials(president.name)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>{handleOf(president.name)}</Text>
            <Text style={styles.sub} numberOfLines={1}>
              President{president.branch ? ` · ${president.branch}` : ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionbar}>
        {state.kind === 'cta' ? (
          <TouchableOpacity style={styles.btn} onPress={onAction} disabled={busy} activeOpacity={0.85}>
            <Text style={styles.btnText}>{state.label}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.btn, styles.btnOn, state.kind === 'muted' && styles.btnMuted]}>
            <Text style={[styles.btnText, styles.btnOnText, state.kind === 'muted' && { color: t.textMuted }]}>
              {state.label}
            </Text>
          </View>
        )}

        <Text style={styles.count}>
          {members} {members === 1 ? 'member' : 'members'}
        </Text>
        <Text style={styles.tier}>{tierFor(members)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(t, c, isDark) {
  return StyleSheet.create({
    // mirrors the home feed card exactly
    card: {
      backgroundColor: t.surface,
      borderRadius: 18,
      marginHorizontal: 18,
      marginBottom: 12,
      overflow: 'hidden',
      borderWidth: isDark ? 1 : 0,
      borderColor: t.hairline,
      shadowColor: '#171B1D',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 20,
      elevation: isDark ? 0 : 2,
    },
    body: { paddingTop: 15, paddingHorizontal: 16, paddingBottom: 13 },
    doodle: { position: 'absolute', right: 6, top: 4, opacity: isDark ? 0.14 : 0.1 },

    meta: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    badge: { borderRadius: 7, paddingTop: 5, paddingBottom: 5, paddingLeft: 6, paddingRight: 8, backgroundColor: c.bg },
    badgeText: { fontFamily: monoFamily, fontSize: 9.5, fontWeight: '700', letterSpacing: 0.8, color: c.fg },
    age: { fontSize: 11.5, color: t.textFaint },
    pending: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: t.accentSoft },
    pendingText: { fontFamily: monoFamily, fontSize: 8.5, fontWeight: '700', letterSpacing: 0.5, color: t.accent },

    title: { fontSize: 16.5, lineHeight: 22, fontWeight: '600', letterSpacing: -0.3, color: t.text, marginTop: 11 },
    desc: { fontSize: 12.5, lineHeight: 17.5, color: t.textMuted, marginTop: 5 },

    author: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12 },
    ava: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' },
    avaText: { fontFamily: monoFamily, fontSize: 11, fontWeight: '700', color: c.fg },
    name: { fontSize: 12.5, fontWeight: '600', color: t.text },
    sub: { fontSize: 11.5, color: t.textMuted, marginTop: 4 },

    actionbar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 11,
      paddingHorizontal: 16,
      backgroundColor: t.surfaceAlt,
      borderTopWidth: 1,
      borderTopColor: t.hairlineAlt,
    },
    btn: { borderRadius: 999, borderWidth: 1, paddingVertical: 9, paddingHorizontal: 15, backgroundColor: c.fg, borderColor: c.fg },
    btnOn: { backgroundColor: c.bg, borderColor: c.bg },
    btnMuted: { backgroundColor: t.field, borderColor: t.borderSoft },
    btnText: { fontSize: 12.5, fontWeight: '600', letterSpacing: -0.13, color: t.surface },
    btnOnText: { color: c.fg },
    count: { fontSize: 12, fontWeight: '500', color: t.textMuted },
    tier: { marginLeft: 'auto', fontFamily: monoFamily, fontSize: 9, fontWeight: '700', letterSpacing: 1, color: t.textDim },
  });
}
