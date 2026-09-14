import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Switch } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScoreRing from '../components/ScoreRing';
import Confirm from '../components/Confirm';
import { handleOf } from '../components/ThreadPost';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { imageUrl } from '../api/market';
import { EventsApi } from '../api/events';
import { MarketApi } from '../api/market';
import { ClubApi } from '../api/clubs';
import { ScoreApi, nextMilestone } from '../api/score';
import { colors, layout } from '../theme';

/**
 * Profile, Instagram-style: the avatar (wrapped in the Campus Score ring)
 * beside a stats strip, name + skills, an outlined Edit button, then flat
 * hairline rows for everything else.
 */
export default function ProfileScreen({ navigation }) {
  const { isDark, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [counts, setCounts] = useState({ posts: 0, listings: 0, clubs: 0 });
  const [score, setScore] = useState(null); // { total, rank, students }
  const [askLogout, setAskLogout] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([EventsApi.myCreated().catch(() => []), MarketApi.myListings().catch(() => []), ClubApi.mine().catch(() => [])])
        .then(([p, l, c]) => {
          if (!active) return;
          const next = { posts: p.length, listings: l.length, clubs: c.length };
          setCounts((prev) => (prev.posts === next.posts && prev.listings === next.listings && prev.clubs === next.clubs ? prev : next));
        })
        .catch(() => {});
      ScoreApi.me()
        .then((s) => active && setScore((prev) => (prev && prev.total === s.total && prev.rank === s.rank ? prev : s)))
        .catch(() => {});
      return () => { active = false; };
    }, [])
  );

  const avatarUri = imageUrl(user?.avatar);
  const total = score?.total ?? user?.campusScore ?? 0;
  const target = nextMilestone(total);
  const initial = (user?.name || 'U').charAt(0).toUpperCase();
  const tabs = navigation.getParent();

  const SECTIONS = [
    {
      title: 'Me',
      rows: [
        { key: 'score', icon: 'trophy-outline', label: 'Campus score', hint: `${total} pts${score?.rank ? ` · #${score.rank}` : ''}`, onPress: () => navigation.navigate('CampusScore') },
        { key: 'activity', icon: 'list-outline', label: 'My activity', onPress: () => navigation.navigate('MyActivity') },
        { key: 'posts', icon: 'megaphone-outline', label: 'My posts', hint: counts.posts ? `${counts.posts}` : '', onPress: () => tabs?.navigate('Post', { screen: 'MyPosts' }) },
        { key: 'clubs', icon: 'people-outline', label: 'My clubs', hint: counts.clubs ? `${counts.clubs} joined` : '', onPress: () => tabs?.navigate('Club') },
        { key: 'listings', icon: 'pricetag-outline', label: 'My listings', hint: counts.listings ? `${counts.listings}` : '', onPress: () => tabs?.navigate('Sell', { screen: 'MyListings' }) },
        { key: 'wishlist', icon: 'heart-outline', label: 'My wishlist', onPress: () => tabs?.navigate('Sell', { screen: 'Wishlist' }) },
        { key: 'orders', icon: 'bag-handle-outline', label: 'My orders', onPress: () => tabs?.navigate('Sell', { screen: 'MyOrders' }) },
      ],
    },
    {
      title: 'Campus',
      rows: [
        { key: 'papers', icon: 'document-text-outline', label: 'Past papers & notes', onPress: () => navigation.navigate('Resources') },
        { key: 'map', icon: 'map-outline', label: '3D campus map', onPress: () => tabs?.navigate('Map') },
        { key: 'chat', icon: 'chatbubble-ellipses-outline', label: 'Messages', onPress: () => tabs?.navigate('Post', { screen: 'ChatList' }) },
      ],
    },
    {
      title: 'App',
      rows: [
        { key: 'theme', icon: isDark ? 'moon' : 'moon-outline', label: 'Dark theme', toggle: true, onPress: toggle },
        { key: 'settings', icon: 'settings-outline', label: 'Settings', onPress: () => navigation.navigate('Feature', { step: '00', label: 'SETTINGS', headerTitle: 'Settings', title: 'Settings', subtitle: 'Notifications, privacy and account settings are coming soon.', bullets: ['NOTIFY', 'PRIVACY', 'ACCOUNT'] }) },
        { key: 'logout', icon: 'log-out-outline', label: 'Log out', danger: true, onPress: () => setAskLogout(true) },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.handle} numberOfLines={1}>{handleOf(user?.name)}</Text>
        {user?.isVerified ? <Ionicons name="checkmark-circle" size={16} color={colors.text} /> : null}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: layout.tabBarSpace + 16 }} showsVerticalScrollIndicator={false}>
        {/* Identity row: ring-wrapped avatar left, stats right */}
        <View style={styles.identity}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('CampusScore')} style={styles.ringWrap}>
            <ScoreRing value={total} target={target} size={92} stroke={5} centerText={initial} trackColor={colors.surfaceHi} progressColor={colors.text} valueColor={colors.text} badgeColor={colors.text} />
            {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatarImg} /> : null}
          </TouchableOpacity>
          <View style={styles.stats}>
            <Stat num={counts.posts} label="Posts" onPress={() => tabs?.navigate('Post', { screen: 'MyPosts' })} />
            <Stat num={counts.clubs} label="Clubs" onPress={() => tabs?.navigate('Club')} />
            <Stat num={total} label="Score" onPress={() => navigation.navigate('CampusScore')} />
          </View>
        </View>

        <View style={styles.bio}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.meta}>{user?.branch ? `${user.branch}${user.semester ? ` · Sem ${user.semester}` : ''}` : user?.email}</Text>
          {user?.skills?.length || user?.learning?.length ? (
            <View style={styles.tags}>
              {user.skills?.map((s) => <View key={s} style={styles.tag}><Text style={styles.tagText}>{s}</Text></View>)}
              {user.learning?.map((s) => <View key={`l-${s}`} style={[styles.tag, styles.tagLearn]}><Text style={[styles.tagText, { color: colors.textMuted }]}>{s}</Text></View>)}
            </View>
          ) : null}
          <Text style={styles.toNext}>{target - total} pts to the next milestone</Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.btn} activeOpacity={0.8} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.btnText}>Edit profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} activeOpacity={0.8} onPress={() => tabs?.navigate('Post', { screen: 'ChatList' })}>
            <Text style={styles.btnText}>Messages</Text>
          </TouchableOpacity>
        </View>

        {SECTIONS.map((sec) => (
          <View key={sec.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            {sec.rows.map((row) => (
              <TouchableOpacity key={row.key} style={styles.row} activeOpacity={0.7} onPress={row.onPress}>
                <View style={styles.rowIcon}>
                  <Ionicons name={row.icon} size={20} color={row.danger ? colors.danger : colors.text} />
                </View>
                <Text style={[styles.rowLabel, row.danger && { color: colors.danger }]}>{row.label}</Text>
                {row.hint ? <Text style={styles.rowHint}>{row.hint}</Text> : null}
                {row.toggle ? (
                  <Switch value={isDark} onValueChange={toggle} trackColor={{ true: colors.text, false: colors.surfaceHi }} thumbColor="#fff" />
                ) : row.danger ? null : (
                  <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <Text style={styles.version}>{user?.email} · Campus Bond v0.2</Text>
      </ScrollView>

      <Confirm
        visible={askLogout}
        title="Log out?"
        message="You can log back in any time."
        confirmText="Log out"
        destructive
        onCancel={() => setAskLogout(false)}
        onConfirm={() => {
          setAskLogout(false);
          logout();
        }}
      />
    </SafeAreaView>
  );
}

function Stat({ num, label, onPress }) {
  return (
    <TouchableOpacity style={styles.stat} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.statNum}>{num}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const HAIRLINE = StyleSheet.hairlineWidth;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16 },
  handle: { fontSize: 20, fontWeight: '700', color: colors.text, flexShrink: 1 },

  identity: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 16, paddingTop: 4 },
  ringWrap: { width: 92, height: 92, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { position: 'absolute', width: 74, height: 74, borderRadius: 37, backgroundColor: colors.surfaceMuted },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', minWidth: 56 },
  statNum: { fontSize: 18, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 1 },

  bio: { paddingHorizontal: 16, paddingTop: 12 },
  name: { fontSize: 15.5, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.surfaceMuted, borderWidth: HAIRLINE, borderColor: colors.border },
  tagLearn: { backgroundColor: 'transparent' },
  tagText: { fontSize: 12.5, fontWeight: '600', color: colors.text },
  toNext: { fontSize: 12.5, color: colors.textFaint, marginTop: 8 },

  buttons: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10, backgroundColor: colors.surfaceMuted },
  btnText: { fontSize: 14, fontWeight: '700', color: colors.text },

  section: { marginTop: 12, borderTopWidth: HAIRLINE, borderTopColor: colors.border },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 11 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  rowHint: { fontSize: 13, color: colors.textMuted, marginRight: 4 },

  version: { textAlign: 'center', fontSize: 11.5, color: colors.textFaint, marginTop: 20 },
});
