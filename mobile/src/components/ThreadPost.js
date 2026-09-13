import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './Text';
import Icon from './Icon';
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
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
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

/** How a deadline should read on the card: due date, time left, and urgency. */
export function deadlineState(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return { text: `Closed ${fmtDeadline(value)}`, past: true, soon: false, left: 'closed' };
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(hours / 24);
  const left = days >= 1 ? `${days}d left` : hours >= 1 ? `${hours}h left` : 'closing soon';
  return { text: `Due ${fmtDeadline(value)} · ${left}`, past: false, soon: hours < 48, left };
}

/**
 * The design has three kinds — team, lost and notice. Our event categories fold
 * into notice, which is what the "Notice" chip is scoped to cover.
 */
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

function replyLabel(n) {
  if (!n) return 'no replies';
  return n === 1 ? '1 reply' : `${n} replies`;
}

/**
 * Home feed post card — glass surface, kind tag + age, title, deadline,
 * divider, author, then the action row: Interested pill · counts · Share.
 */
export default function ThreadPost({ post, onOpen, onLongPress, onInterested, onComment, onShare }) {
  const { user } = useAuth();
  const { t, kinds, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, kinds, isDark), [t, kinds, isDark]);

  const owner = post.createdBy || {};
  const isOwner = String(owner._id || post.createdBy) === String(user?._id);
  // Lost & found tracks a flat interest list; posts track applicants.
  const isLost = post.type === 'lost' || post.type === 'found';
  const interested = isLost
    ? !!post.isInterested
    : (post.applicants || []).some((a) => String(a.user?._id || a.user) === String(user?._id));
  const myStatus = isLost
    ? null
    : (post.applicants || []).find((a) => String(a.user?._id || a.user) === String(user?._id))?.status;
  const replies = post.comments?.length || 0;
  const responses = isLost ? post.interestCount || 0 : (post.applicants || []).length;
  const meta = postKind(post);
  const due = deadlineState(post.deadline);
  const k = kinds[meta.kind];
  // "3 replies · 1 interested" — both halves grow as people engage.
  const countLabel = isLost
    ? responses
      ? `${responses} interested`
      : 'no responses yet'
    : [replies ? replyLabel(replies) : null, responses ? `${responses} interested` : null].filter(Boolean).join(' · ') || 'no replies';

  const initials = (owner.name || '?').split(' ').map((w) => w.charAt(0)).slice(0, 2).join('').toUpperCase();
  // Team posts get the violet avatar tint; the other kinds use their own tint.
  const avaBg = meta.kind === 'team' ? t.avatarBg : k.bg;
  const avaFg = meta.kind === 'team' ? t.avatarText : k.fg;

  const pillLabel = isOwner
    ? 'Your post'
    : !interested
    ? 'Interested'
    : myStatus === 'approved'
    ? 'Accepted ✓'
    : isLost
    ? 'Interested ✓'
    : 'Requested ✓';
  const solid = !isOwner && !interested;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.96} onPress={onOpen} onLongPress={onLongPress} delayLongPress={280}>
      {/* kind · age, as plain tracked text — no pill */}
      <View style={styles.meta}>
        <Text style={[styles.kind, { color: k.fg }]}>{meta.label}</Text>
        <Text style={styles.age}>{timeAgo(post.createdAt)}</Text>
      </View>

      <Text style={styles.title}>{post.title}</Text>

      {due ? (
        <View style={styles.due}>
          <Icon name="calendar" size={13} color={due.past ? t.textDim : due.soon ? t.accent : t.textFaint} strokeWidth={1.6} />
          <Text style={[styles.dueText, due.past && styles.duePast, due.soon && !due.past && styles.dueSoon]}>{due.text}</Text>
        </View>
      ) : null}

      <View style={styles.author}>
        <View style={[styles.ava, { backgroundColor: avaBg }]}>
          <Text style={[styles.avaText, { color: avaFg }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>{handleOf(owner.name)}</Text>
          <Text style={styles.sub} numberOfLines={1}>
            {owner.branch || 'Campus'}{owner.semester ? ` · Sem ${owner.semester}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.pill, solid ? styles.pillSolid : styles.pillOutline]}
          onPress={isOwner ? onOpen : onInterested}
          activeOpacity={0.85}
        >
          <Text style={[styles.pillText, { color: solid ? t.onPrimary : t.text }]}>{pillLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onComment} hitSlop={10} style={{ flexShrink: 1 }}>
          <Text style={styles.count} numberOfLines={1}>{countLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onShare} hitSlop={10} style={styles.shareBtn}>
          <Text style={styles.share}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

/** Minimal: one quiet surface, a hairline edge, no pills except the action. */
function makeStyles(t, kinds, isDark) {
  return StyleSheet.create({
    card: {
      backgroundColor: t.glass,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: t.glassBorder,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 12,
      marginBottom: 12,
      gap: 10,
    },
    meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    kind: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1 },
    age: { fontSize: 12, fontWeight: '500', color: t.textDim },
    title: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: t.text },
    due: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -2 },
    dueText: { fontSize: 12.5, fontWeight: '500', color: t.textFaint },
    dueSoon: { color: t.accent, fontWeight: '600' },
    duePast: { color: t.textDim },
    author: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 2 },
    ava: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    avaText: { fontSize: 11, fontWeight: '700' },
    name: { fontSize: 13, fontWeight: '600', color: t.text },
    sub: { fontSize: 11.5, fontWeight: '500', color: t.textDim, marginTop: 1 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
    pill: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 16, borderWidth: 1 },
    pillSolid: { backgroundColor: t.primary, borderColor: t.primary },
    pillOutline: { backgroundColor: 'transparent', borderColor: t.borderSoft },
    pillText: { fontSize: 12.5, fontWeight: '700' },
    count: { fontSize: 12.5, fontWeight: '500', color: t.textFaint },
    shareBtn: { marginLeft: 'auto' },
    share: { fontSize: 12.5, fontWeight: '600', color: t.textMuted },
  });
}
