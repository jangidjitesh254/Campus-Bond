import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Avatar from './Avatar';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';
import { colors, radius, shadow } from '../theme';

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

const TAG = { hackathon: '#hackathon', cultural: '#campus', competition: '#contest', project: '#project', other: '#campus' };
const CAT_TYPE = { hackathon: 'team', project: 'team', cultural: 'event', competition: 'event', other: 'notice' };
const TYPE = {
  team: { label: 'TEAM', fg: colors.badgeTeamFg, bg: colors.badgeTeamBg, fill: colors.primary },
  event: { label: 'EVENT', fg: colors.badgeEventFg, bg: colors.badgeEventBg, fill: colors.badgeEventFg },
  notice: { label: 'NOTICE', fg: colors.badgeNoticeFg, bg: colors.badgeNoticeBg, fill: colors.badgeNoticeFg },
};

/** Feed post card — colored by post type (team/event/notice). */
export default function ThreadPost({ post, onOpen, onInterested, onComment, onShare }) {
  const { user } = useAuth();
  const owner = post.createdBy || {};
  const isOwner = String(owner._id || post.createdBy) === String(user?._id);
  const applicants = post.applicants || [];
  const interested = applicants.some((a) => String(a.user?._id || a.user) === String(user?._id));
  const comments = post.comments?.length || 0;
  const t = TYPE[CAT_TYPE[post.category] || 'team'];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onOpen}>
      <View style={styles.head}>
        <Avatar name={owner.name} size={44} bg={t.bg} textColor={t.fg} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.handle}>{handleOf(owner.name)}</Text>
          <Text style={[styles.sub, { color: t.fg }]}>
            {owner.branch || 'Campus'}{owner.semester ? ` · Sem ${owner.semester}` : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={[styles.badge, { backgroundColor: t.bg }]}>
            <Text style={[styles.badgeText, { color: t.fg }]}>{t.label}</Text>
          </View>
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        </View>
        <Icon name="dotsV" size={16} color={colors.textMuted} />
      </View>

      <Text style={styles.body}>{post.title}</Text>
      <Text style={[styles.tag, { color: t.fg }]}>{TAG[post.category] || '#campus'}</Text>

      <View style={styles.hr} />

      <View style={styles.actions}>
        {isOwner ? (
          <View style={[styles.intBtn, styles.intMuted]}>
            <Icon name="star" size={15} color={colors.textMuted} strokeWidth={1.7} />
            <Text style={[styles.intText, { color: colors.textMuted }]}>Your post</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.intBtn, interested ? { backgroundColor: t.fill } : { borderWidth: 1.4, borderColor: t.fg }]}
            onPress={onInterested}
            activeOpacity={0.85}
          >
            <Icon name="star" size={15} color={interested ? '#fff' : t.fg} filled={interested} strokeWidth={1.8} />
            <Text style={[styles.intText, { color: interested ? '#fff' : t.fg }]}>Interested</Text>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.iconBtn} onPress={onComment}>
          <Icon name="comment" size={20} color={colors.textMuted} strokeWidth={1.7} />
          <Text style={styles.count}>{comments}</Text>
        </TouchableOpacity>
        <View style={styles.vDivider} />
        <TouchableOpacity style={styles.iconBtn} onPress={onShare}>
          <Icon name="repost" size={20} color={colors.textMuted} strokeWidth={1.7} />
          <Text style={styles.count}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, marginHorizontal: 14, marginBottom: 16, padding: 16, ...shadow.card },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  handle: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, marginTop: 1, fontWeight: '600' },
  badge: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 4 },
  badgeText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6 },
  time: { fontSize: 12.5, color: colors.textMuted },
  body: { fontSize: 16, lineHeight: 23, color: colors.text },
  tag: { fontSize: 15, marginTop: 8, fontWeight: '700' },
  hr: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  intBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
  intMuted: { backgroundColor: colors.surfaceMuted },
  intText: { fontSize: 14, fontWeight: '700' },
  iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  count: { fontSize: 15, color: colors.textMuted, fontWeight: '500' },
  vDivider: { width: 1, height: 22, backgroundColor: colors.border, marginHorizontal: 16 },
});
