import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './Text';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function handleOf(name) {
  return (name || 'student').toLowerCase().replace(/\s+/g, '');
}

export function timeAgo(dateStr) {
  const then = new Date(dateStr).getTime();
  if (!then) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

/** "25 May 2025" */
export function fmtDate(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** "25 Aug · 6:00 pm" — the clock is dropped when the deadline is a bare date. */
export function fmtDeadline(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  if (d.getHours() === 0 && d.getMinutes() === 0) return date;
  return `${date} · ${d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
}

/** How a deadline should read: due date, time left, and urgency. */
export function deadlineState(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return { text: `Closed ${fmtDeadline(value)}`, past: true, soon: false, left: 'Closed' };
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(hours / 24);
  const left = days >= 1 ? `${days}d left` : hours >= 1 ? `${hours}h left` : 'Closing soon';
  return { text: `Due ${fmtDeadline(value)} · ${left}`, past: false, soon: hours < 48, left };
}

const KIND = {
  hackathon: { label: 'TEAM', kind: 'team' },
  project: { label: 'TEAM', kind: 'team' },
  cultural: { label: 'NOTICE', kind: 'notice' },
  competition: { label: 'NOTICE', kind: 'notice' },
  other: { label: 'NOTICE', kind: 'notice' },
  lost: { label: 'LOST', kind: 'lost' },
  found: { label: 'FOUND', kind: 'lost' },
};

/** Resolve a feed item to its badge label and kind key (colours come from the theme). */
export function postKind(post) {
  const key = post.type === 'lost' || post.type === 'found' ? post.type : post.category || 'other';
  return KIND[key] || KIND.other;
}

const EXCERPT_CHARS = 96;

/**
 * Feed card.
 *
 *   ┌ avatar  name              age ┐
 *   │         branch · sem          │
 *   │                               │
 *   │ Title                         │
 *   │ two-line excerpt… more        │
 *   │ ───────────────────────────── │
 *   │ Interested   3 replies  4d ┘  │
 *
 * One quiet surface, generous padding, and only what a student needs to
 * decide whether to open it.
 */
export default function ThreadPost({ post, onOpen, onLongPress, onInterested, onComment }) {
  const { user } = useAuth();
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);

  const owner = post.createdBy || {};
  const isOwner = String(owner._id || post.createdBy) === String(user?._id);
  const isLost = post.type === 'lost' || post.type === 'found';
  const interested = isLost
    ? !!post.isInterested
    : (post.applicants || []).some((a) => String(a.user?._id || a.user) === String(user?._id));
  const myStatus = isLost ? null : (post.applicants || []).find((a) => String(a.user?._id || a.user) === String(user?._id))?.status;
  const replies = post.comments?.length || 0;
  const due = deadlineState(post.deadline);
  const description = (post.description || '').trim().replace(/\s+/g, ' ');
  const long = description.length > EXCERPT_CHARS;
  const initials = (owner.name || '?').split(' ').map((w) => w.charAt(0)).slice(0, 2).join('').toUpperCase();
  const sub = [owner.branch, owner.semester ? `Sem ${owner.semester}` : null].filter(Boolean).join(' · ');

  const action = isOwner ? 'Your post' : !interested ? 'Interested' : myStatus === 'approved' ? 'Accepted' : 'Requested';
  const actionOn = !isOwner && !interested;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onOpen} onLongPress={onLongPress} delayLongPress={280}>
      {/* Who */}
      <View style={styles.who}>
        <View style={styles.ava}><Text style={styles.avaText}>{initials}</Text></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>{handleOf(owner.name)}</Text>
          {sub ? <Text style={styles.sub} numberOfLines={1}>{sub}</Text> : null}
        </View>
        <Text style={styles.age}>{timeAgo(post.createdAt)}</Text>
      </View>

      {/* What */}
      <Text style={styles.title}>{post.title}</Text>
      {description ? (
        <Text style={styles.desc} numberOfLines={2}>
          {long ? `${description.slice(0, EXCERPT_CHARS).trimEnd()}… ` : description}
          {long ? <Text style={styles.more}>more</Text> : null}
        </Text>
      ) : null}

      {/* Foot */}
      <View style={styles.foot}>
        <TouchableOpacity onPress={isOwner ? onOpen : onInterested} hitSlop={10}>
          <Text style={[styles.action, actionOn ? styles.actionOn : styles.actionOff]}>{action}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onComment} hitSlop={10}>
          <Text style={styles.count}>{replies ? `${replies} ${replies === 1 ? 'reply' : 'replies'}` : 'Reply'}</Text>
        </TouchableOpacity>
        {due ? (
          <Text style={[styles.due, due.soon && !due.past && styles.dueSoon]}>{due.left}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    card: {
      backgroundColor: t.glass,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: t.glassBorder,
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 14,
      marginBottom: 14,
    },

    who: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    ava: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.avatarBg, alignItems: 'center', justifyContent: 'center' },
    avaText: { fontSize: 11.5, fontWeight: '700', color: t.avatarText },
    name: { fontSize: 14, fontWeight: '600', color: t.text },
    sub: { fontSize: 12, fontWeight: '500', color: t.textDim, marginTop: 1 },
    age: { fontSize: 12, fontWeight: '500', color: t.textDim },

    title: { fontSize: 16.5, lineHeight: 23, fontWeight: '600', color: t.text, marginTop: 14 },
    desc: { fontSize: 13.5, lineHeight: 19.5, fontWeight: '500', color: t.textMuted, marginTop: 4 },
    more: { color: t.accent, fontWeight: '600' },

    foot: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: t.hairline,
    },
    action: { fontSize: 13, fontWeight: '700' },
    actionOn: { color: t.accent },
    actionOff: { color: t.textFaint },
    count: { fontSize: 13, fontWeight: '500', color: t.textFaint },
    due: { marginLeft: 'auto', fontSize: 12, fontWeight: '500', color: t.textDim },
    dueSoon: { color: t.accent, fontWeight: '600' },
  });
}
