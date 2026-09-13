import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Switch } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Icon from '../components/Icon';
import ScoreRing from '../components/ScoreRing';
import AmbientGlow from '../components/AmbientGlow';
import { handleOf } from '../components/ThreadPost';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { imageUrl } from '../api/market';
import { EventsApi } from '../api/events';
import { MarketApi } from '../api/market';
import { ClubApi } from '../api/clubs';
import { ScoreApi, nextMilestone } from '../api/score';
import { layout } from '../theme';

/**
 * More / profile. The Campus Score ring wraps the avatar, then a stats strip,
 * skills, and everything else as a grid of rounded tiles instead of a list.
 */
export default function ProfileScreen({ navigation }) {
  const { t, isDark, toggle } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const { user, logout } = useAuth();
  const [counts, setCounts] = useState({ posts: 0, listings: 0, clubs: 0 });
  const [score, setScore] = useState(null); // { total, rank, students }

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([EventsApi.myCreated().catch(() => []), MarketApi.myListings().catch(() => []), ClubApi.mine().catch(() => [])])
        .then(([p, l, c]) => active && setCounts({ posts: p.length, listings: l.length, clubs: c.length }))
        .catch(() => {});
      ScoreApi.me().then((s) => active && setScore(s)).catch(() => {});
      return () => { active = false; };
    }, [])
  );

  function onLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  }

  const avatarUri = imageUrl(user?.avatar);
  const total = score?.total ?? user?.campusScore ?? 0;
  const target = nextMilestone(total);
  const initial = (user?.name || 'U').charAt(0).toUpperCase();
  const tabs = navigation.getParent();

  const tiles = [
    { key: 'edit', ion: 'create-outline', label: 'Edit profile', onPress: () => navigation.navigate('EditProfile') },
    { key: 'score', ion: 'trophy-outline', label: 'Campus score', hint: `${total} pts`, onPress: () => navigation.navigate('CampusScore') },
    { key: 'map', ion: 'map-outline', label: 'Campus map', onPress: () => tabs?.navigate('Map') },
    { key: 'activity', ion: 'list-outline', label: 'My activity', onPress: () => navigation.navigate('MyActivity') },
    { key: 'papers', ion: 'document-text-outline', label: 'Papers & notes', onPress: () => navigation.navigate('Resources') },
    { key: 'clubs', ion: 'people-outline', label: 'My clubs', hint: counts.clubs ? `${counts.clubs} joined` : null, onPress: () => tabs?.navigate('Club') },
    { key: 'chat', ion: 'chatbubble-ellipses-outline', label: 'Messages', onPress: () => tabs?.navigate('Post', { screen: 'ChatList' }) },
    { key: 'theme', ion: isDark ? 'moon' : 'moon-outline', label: 'Dark theme', toggle: true, onPress: toggle },
    { key: 'settings', ion: 'settings-outline', label: 'Settings', onPress: () => navigation.navigate('Feature', { step: '00', label: 'SETTINGS', headerTitle: 'Settings', title: 'Settings', subtitle: 'Notifications, privacy and account settings are coming soon.', bullets: ['NOTIFY', 'PRIVACY', 'ACCOUNT'] }) },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AmbientGlow />
      <ScrollView contentContainerStyle={{ paddingBottom: layout.tabBarSpace + 16 }} showsVerticalScrollIndicator={false}>
        {/* Identity — the score ring wraps the avatar */}
        <View style={styles.identity}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('CampusScore')} style={styles.ringWrap}>
            <ScoreRing value={total} target={target} size={124} stroke={7} centerText={initial} trackColor={t.surfaceHi} progressColor={t.primary} valueColor={t.text} badgeColor={t.primary} />
            {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatarImg} /> : null}
          </TouchableOpacity>

          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{user?.name}</Text>
            {user?.isVerified ? <Icon name="verified" size={15} color={t.accent} strokeWidth={2} /> : null}
          </View>
          <Text style={styles.handle}>@{handleOf(user?.name)}{user?.branch ? ` · ${user.branch}` : ''}{user?.semester ? ` · Sem ${user.semester}` : ''}</Text>

          <TouchableOpacity style={styles.scorePill} activeOpacity={0.85} onPress={() => navigation.navigate('CampusScore')}>
            <Ionicons name="trophy" size={13} color={t.accent} />
            <Text style={styles.scoreText}>{total} Campus Score</Text>
            {score?.rank ? <Text style={styles.scoreRank}>· #{score.rank} on campus</Text> : null}
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <Stat styles={styles} num={counts.posts} label="Posts" />
          <View style={styles.statLine} />
          <Stat styles={styles} num={counts.listings} label="Listings" />
          <View style={styles.statLine} />
          <Stat styles={styles} num={counts.clubs} label="Clubs" />
          <View style={styles.statLine} />
          <Stat styles={styles} num={target - total} label="To next" />
        </View>

        {/* Skills */}
        <View style={styles.skills}>
          {user?.skills?.length ? (
            <View style={styles.tags}>
              {user.skills.map((s) => <View key={s} style={styles.tag}><Text style={styles.tagText}>{s}</Text></View>)}
              {user.learning?.map((s) => <View key={`l-${s}`} style={[styles.tag, styles.tagLearn]}><Text style={[styles.tagText, { color: t.textMuted }]}>{s}</Text></View>)}
            </View>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.7} style={styles.addSkills}>
              <Ionicons name="sparkles-outline" size={15} color={t.accent} />
              <Text style={styles.addSkillsText}>Add your skills so teams can find you</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Everything else as tiles */}
        <View style={styles.grid}>
          {tiles.map((tile) => (
            <TouchableOpacity key={tile.key} style={styles.tile} activeOpacity={0.8} onPress={tile.onPress}>
              <View style={styles.tileTop}>
                <View style={styles.tileIcon}><Ionicons name={tile.ion} size={19} color={t.accent} /></View>
                {tile.toggle ? (
                  <Switch value={isDark} onValueChange={toggle} trackColor={{ true: t.primary, false: t.surfaceHi }} thumbColor="#fff" style={styles.switch} />
                ) : null}
              </View>
              <Text style={styles.tileLabel} numberOfLines={1}>{tile.label}</Text>
              {tile.hint ? <Text style={styles.tileHint} numberOfLines={1}>{tile.hint}</Text> : null}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logout} onPress={onLogout} activeOpacity={0.8}>
          <Icon name="logout" size={16} color={t.danger} strokeWidth={1.7} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
        <Text style={styles.version}>{user?.email} · Campus Bond v0.2</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ num, label, styles }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNum}>{num}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },

    identity: { alignItems: 'center', paddingTop: 22, paddingHorizontal: 20 },
    ringWrap: { width: 124, height: 124, alignItems: 'center', justifyContent: 'center' },
    avatarImg: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: t.surfaceMuted },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
    name: { fontSize: 20, fontWeight: '700', color: t.text },
    handle: { fontSize: 12.5, fontWeight: '500', color: t.textMuted, marginTop: 3 },
    scorePill: {
      flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: t.accentSoft,
    },
    scoreText: { fontSize: 12.5, fontWeight: '700', color: t.accent },
    scoreRank: { fontSize: 12.5, fontWeight: '500', color: t.accent },

    stats: {
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 20, marginTop: 20, paddingVertical: 14,
      borderRadius: 18, backgroundColor: t.glass, borderWidth: 1, borderColor: t.glassBorder,
    },
    stat: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 17, fontWeight: '700', color: t.text },
    statLabel: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.6, color: t.textDim, marginTop: 3, textTransform: 'uppercase' },
    statLine: { width: 1, height: 26, backgroundColor: t.hairlineAlt },

    skills: { marginHorizontal: 20, marginTop: 12 },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tag: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: t.surfaceAlt },
    tagLearn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.borderSoft },
    tagText: { fontSize: 12, fontWeight: '600', color: t.text },
    addSkills: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: t.borderSoft },
    addSkillsText: { fontSize: 13, fontWeight: '600', color: t.accent },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginTop: 20 },
    tile: {
      width: '30%', flexGrow: 1, minHeight: 104,
      borderRadius: 20, backgroundColor: t.glass, borderWidth: 1, borderColor: t.glassBorder,
      padding: 12, justifyContent: 'space-between',
    },
    tileTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    tileIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' },
    switch: { transform: [{ scale: 0.7 }], marginRight: -8, marginTop: -6 },
    tileLabel: { fontSize: 12.5, fontWeight: '600', color: t.text, marginTop: 10 },
    tileHint: { fontSize: 11, fontWeight: '500', color: t.textDim, marginTop: 2 },

    logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 22, marginHorizontal: 20, paddingVertical: 13, borderRadius: 999, backgroundColor: t.dangerSoft },
    logoutText: { fontSize: 14, fontWeight: '700', color: t.danger },
    version: { textAlign: 'center', fontSize: 11.5, fontWeight: '500', color: t.textDim, marginTop: 16 },
  });
}
