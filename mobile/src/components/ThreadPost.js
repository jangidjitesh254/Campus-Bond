import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { monoFamily } from '../theme';

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
  if (ms <= 0) return { text: `Closed ${fmtDeadline(value)}`, past: true, soon: false };
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(hours / 24);
  const left = days >= 1 ? `${days}d left` : hours >= 1 ? `${hours}h left` : 'closing soon';
  return { text: `Due ${fmtDeadline(value)} · ${left}`, past: false, soon: hours < 48 };
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

/** Home feed post card — badge + age, title, author row, then an action bar. */
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
  // "1 reply · 3 interested" — both halves grow as people engage.
  const countLabel = isLost
    ? responses
      ? `${responses} interested`
      : 'no responses yet'
    : [replies ? replyLabel(replies) : null, responses ? `${responses} interested` : null]
        .filter(Boolean)
        .join(' · ') || 'no replies';

  const initials = (owner.name || '?')
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.96}
      onPress={onOpen}
      onLongPress={onLongPress}
      delayLongPress={280}
    >
      <View style={styles.body}>
        <View style={styles.meta}>
          <View style={[styles.badge, { backgroundColor: k.bg }]}>
            <Text style={[styles.badgeText, { color: k.fg }]}>{meta.label}</Text>
          </View>
          <Text style={styles.age}>{timeAgo(post.createdAt)}</Text>
        </View>

        <Text style={styles.title}>{post.title}</Text>

        {due ? (
          <View style={styles.due}>
            <Icon
              name="calendar"
              size={13}
              color={due.past ? t.textFaint : due.soon ? t.accent : t.textMuted}
              strokeWidth={1.8}
            />
            <Text style={[styles.dueText, due.past && styles.duePast, due.soon && !due.past && styles.dueSoon]}>
              {due.text}
            </Text>
          </View>
        ) : null}

        <View style={styles.author}>
          <View style={[styles.ava, { backgroundColor: k.bg }]}>
            <Text style={[styles.avaText, { color: k.fg }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>{handleOf(owner.name)}</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {owner.branch || 'Campus'}{owner.semester ? ` • Sem ${owner.semester}` : ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionbar}>
        {isOwner ? (
          <View style={[styles.btn, styles.btnOn]}>
            <Text style={[styles.btnText, { color: t.text }]}>Your post</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.btn, interested ? styles.btnOn : { backgroundColor: k.fg, borderColor: k.fg }]}
            onPress={onInterested}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnText, { color: interested ? t.text : k.on }]}>
              {!interested
                ? 'Interested'
                : myStatus === 'approved'
                ? 'Accepted ✓'
                : isLost
                ? 'Interested ✓'
                : 'Requested ✓'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={onComment} hitSlop={10} style={{ flexShrink: 1 }}>
          <Text style={styles.count} numberOfLines={1}>
            {countLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onShare} hitSlop={10} style={styles.shareBtn}>
          <Text style={styles.count}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(t, kinds, isDark) {
  return StyleSheet.create({
    card: {
      backgroundColor: t.surface,
      borderRadius: 18,
      marginBottom: 12,
      overflow: 'hidden',
      // Shadows vanish on a dark canvas, so lean on a hairline instead.
      borderWidth: isDark ? 1 : 0,
      borderColor: t.hairline,
      shadowColor: '#171B1D',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 20,
      elevation: isDark ? 0 : 2,
    },
    body: { paddingTop: 15, paddingHorizontal: 16, paddingBottom: 13 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    badge: { borderRadius: 7, paddingTop: 5, paddingBottom: 5, paddingLeft: 6, paddingRight: 8 },
    badgeText: { fontFamily: monoFamily, fontSize: 9.5, fontWeight: '700', letterSpacing: 0.8 },
    age: { fontSize: 11.5, color: t.textFaint },
    title: { fontSize: 16.5, lineHeight: 22, fontWeight: '600', letterSpacing: -0.3, color: t.text, marginTop: 11, marginBottom: 10 },
    due: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    dueText: { fontSize: 11.5, fontWeight: '500', color: t.textMuted },
    dueSoon: { color: t.accent, fontWeight: '600' },
    duePast: { color: t.textFaint },
    author: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    ava: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    avaText: { fontFamily: monoFamily, fontSize: 11, fontWeight: '700' },
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
    btn: { borderRadius: 999, borderWidth: 1, paddingVertical: 9, paddingHorizontal: 15 },
    btnOn: { backgroundColor: kinds.team.bg, borderColor: kinds.team.ring },
    btnText: { fontSize: 12.5, fontWeight: '600', letterSpacing: -0.13 },
    count: { fontSize: 12, fontWeight: '500', color: t.textMuted },
    shareBtn: { marginLeft: 'auto' },
  });
}
