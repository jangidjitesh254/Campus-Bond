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
  if (ms <= 0) return { text: `Closed ${fmtDeadline(value)}`, past: true, soon: false, left: 'closed' };
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(hours / 24);
  const left = days >= 1 ? `${days}d left` : hours >= 1 ? `${hours}h left` : 'closing soon';
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

const EXCERPT_CHARS = 100;

/**
 * Feed item. Three lines and one action, nothing else:
 *   who · when
 *   title
 *   excerpt… more
 *   Interested · N replies
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
  const description = (post.description || '').trim();
  const long = description.length > EXCERPT_CHARS || description.includes('\n');
  const initial = (owner.name || '?').charAt(0).toUpperCase();

  const action = isOwner ? null : !interested ? 'Interested' : myStatus === 'approved' ? 'Accepted' : 'Requested';

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={onOpen} onLongPress={onLongPress} delayLongPress={280}>
      <View style={styles.who}>
        <View style={styles.ava}><Text style={styles.avaText}>{initial}</Text></View>
        <Text style={styles.meta} numberOfLines={1}>
          {handleOf(owner.name)} · {timeAgo(post.createdAt)}
          {due ? <Text style={[styles.metaDue, due.soon && !due.past && { color: t.accent }]}> · {due.left}</Text> : null}
        </Text>
      </View>

      <Text style={styles.title}>{post.title}</Text>

      {description ? (
        <Text style={styles.desc} numberOfLines={2}>
          {long ? `${description.slice(0, EXCERPT_CHARS).trimEnd()}… ` : description}
          {long ? <Text style={styles.more}>more</Text> : null}
        </Text>
      ) : null}

      <View style={styles.actions}>
        {action ? (
          <TouchableOpacity onPress={onInterested} hitSlop={10}>
            <Text style={[styles.action, interested && styles.actionDone]}>{action}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={onComment} hitSlop={10}>
          <Text style={styles.count}>{replies ? `${replies} ${replies === 1 ? 'reply' : 'replies'}` : 'Reply'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.hairline },
    who: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ava: { width: 22, height: 22, borderRadius: 11, backgroundColor: t.avatarBg, alignItems: 'center', justifyContent: 'center' },
    avaText: { fontSize: 10, fontWeight: '700', color: t.avatarText },
    meta: { flex: 1, fontSize: 12.5, fontWeight: '500', color: t.textFaint },
    metaDue: { fontWeight: '600' },
    title: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: t.text, marginTop: 8 },
    desc: { fontSize: 13.5, lineHeight: 19, fontWeight: '500', color: t.textMuted, marginTop: 3 },
    more: { color: t.accent, fontWeight: '600' },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 10 },
    action: { fontSize: 13, fontWeight: '700', color: t.accent },
    actionDone: { color: t.textFaint },
    count: { fontSize: 13, fontWeight: '500', color: t.textFaint },
  });
}
