import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Icon from '../components/Icon';
import ScoreRing from '../components/ScoreRing';
import { handleOf, timeAgo } from '../components/ThreadPost';
import { useAuth } from '../context/AuthContext';
import { EventsApi } from '../api/events';
import { colors, spacing, font, radius, shadow, layout } from '../theme';

const TILES = [
  { key: 'team', label: 'Find Team', ion: 'people', color: '#3E9B2E', bg: '#E7F4DA', to: 'Post' },
  { key: 'lost', label: 'Lost & Found', ion: 'search', color: '#2F80ED', bg: '#E4EEFB', to: 'Lost' },
  { key: 'market', label: 'Marketplace', ion: 'pricetag', color: '#EF5B54', bg: '#FDE7E6', to: 'Sell' },
  { key: 'clubs', label: 'Clubs', ion: 'people-circle', color: '#7E5BEF', bg: '#ECE7FB', to: 'Club' },
  { key: 'contests', label: 'Contests', ion: 'trophy', color: '#E39A1C', bg: '#FBF0D5', feature: { title: 'Contests & quizzes', headerTitle: 'Contests', subtitle: 'Branch-wise coding challenges, quizzes and talent contests every week.', label: 'CONTESTS', step: '05', bullets: ['COMPETE', 'RANK', 'WIN'] } },
  { key: 'map', label: 'Campus Map', ion: 'map', color: '#2F80ED', bg: '#E4EEFB', feature: { title: 'Campus map', headerTitle: 'Campus Map', subtitle: 'Find blocks, labs, canteens and venues with an interactive campus map.', label: 'CAMPUS MAP', step: '06', bullets: ['LOCATE', 'NAVIGATE', 'ARRIVE'] } },
  { key: 'qna', label: 'Q&A', ion: 'chatbubbles', color: '#7E5BEF', bg: '#ECE7FB', feature: { title: 'Ask the campus', headerTitle: 'Q&A', subtitle: 'Ask anything and get answers from seniors and peers across every branch.', label: 'CAMPUS Q&A', step: '07', bullets: ['ASK', 'ANSWER', 'LEARN'] } },
  { key: 'papers', label: 'Past Papers', ion: 'document-text', color: '#3E9B2E', bg: '#E7F4DA', feature: { title: 'Previous-year papers', headerTitle: 'Past Papers', subtitle: 'A shared library of previous-year question papers, by branch and semester.', label: 'PAST PAPERS', step: '08', bullets: ['BROWSE', 'DOWNLOAD', 'ACE'] } },
  { key: 'emergency', label: 'Emergency', ion: 'medkit', color: '#EF5B54', bg: '#FDE7E6', feature: { title: 'Campus SOS', headerTitle: 'Emergency Help', subtitle: 'Need blood or urgent help? Notify nearby students instantly for a fast response.', label: 'EMERGENCY HELP', step: '10', bullets: ['ALERT', 'NEARBY', 'RESPOND'] } },
];

const CATEGORY_LABEL = { hackathon: 'Hackathon', cultural: 'Cultural', competition: 'Competition', project: 'Project', other: 'Notice' };

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [activity, setActivity] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      EventsApi.list({ limit: 5 }).then((d) => active && setActivity(d.events || [])).catch(() => {});
      return () => { active = false; };
    }, [])
  );

  function openTile(t) {
    if (t.to) navigation.getParent()?.navigate(t.to);
    else if (t.feature) navigation.navigate('Feature', t.feature);
  }

  const initial = (user?.name || 'U').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Icon name="shield" size={22} color={colors.primary} filled />
          <Text style={styles.brand}>Campus Bond</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Post', { screen: 'ChatList' })}>
          <Icon name="chat" size={22} color={colors.text} strokeWidth={1.7} />
          <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Score card */}
        <TouchableOpacity
          style={styles.scoreCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Feature', { title: 'Your campus score', headerTitle: 'Campus Score', subtitle: 'Earn points for helping out, posting and staying active. Climb the leaderboard.', label: 'CAMPUS SCORE', step: '06', bullets: ['ENGAGE', 'EARN', 'CLIMB'] })}
        >
          <ScoreRing centerText={initial} value={user?.campusScore ?? 0} trackColor={colors.primary} progressColor={colors.primaryLight} badgeColor={colors.primary} />
          <View style={styles.scoreMid}>
            <View style={styles.statsRow}>
              <View style={styles.stat}><Text style={styles.statNum}>{user?.campusScore ?? 0}</Text><Text style={styles.statLabel}>Points</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.stat}><Text style={styles.statNum}>0</Text><Text style={styles.statLabel}>Rank</Text></View>
            </View>
            <Text style={styles.scoreHint}>Stay active to climb the leaderboard</Text>
          </View>
          <View style={styles.scoreBlob}>
            <Ionicons name="stats-chart" size={24} color={colors.primary} />
            <Ionicons name="sparkles" size={11} color={colors.primaryLight} style={styles.spark} />
          </View>
          <Icon name="chevronRight" size={18} color={colors.textFaint} strokeWidth={2} style={styles.scoreChevron} />
        </TouchableOpacity>

        {/* Explore */}
        <View style={styles.sectionHead}>
          <Text style={styles.section}>Explore</Text>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Post')}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
        </View>
        <View style={styles.grid}>
          {TILES.map((t) => (
            <TouchableOpacity key={t.key} style={styles.tileWrap} activeOpacity={0.85} onPress={() => openTile(t)}>
              <View style={styles.tile}>
                <View style={[styles.tileIcon, { backgroundColor: t.bg }]}>
                  <Ionicons name={t.ion} size={22} color={t.color} />
                </View>
                <Text style={styles.tileLabel} numberOfLines={1}>{t.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Post a team request banner */}
        <TouchableOpacity style={styles.banner} activeOpacity={0.9} onPress={() => navigation.getParent()?.navigate('Post', { screen: 'CreateEvent' })}>
          <View style={styles.bannerPlus}><Icon name="plus" size={24} color={colors.primary} strokeWidth={2.4} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Post a team request</Text>
            <Text style={styles.bannerSub}>Looking for hackathon teammates? Post it now.</Text>
          </View>
          <Icon name="chevronRight" size={20} color="rgba(255,255,255,0.7)" strokeWidth={2} />
        </TouchableOpacity>

        {/* Activity Feed */}
        <View style={styles.sectionHead}>
          <Text style={styles.section}>Activity Feed</Text>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Post')}><Text style={styles.seeAll}>View all</Text></TouchableOpacity>
        </View>
        <View style={styles.feed}>
          {activity.length === 0 ? (
            <Text style={[font.bodyMuted, { padding: spacing.lg }]}>No activity yet.</Text>
          ) : (
            activity.map((e, i) => (
              <TouchableOpacity
                key={e._id}
                style={[styles.actRow, i < activity.length - 1 && styles.actBorder]}
                activeOpacity={0.8}
                onPress={() => navigation.getParent()?.navigate('Post', { screen: 'Thread', params: { id: e._id } })}
              >
                <View style={styles.actAvatar}><Text style={styles.actAvatarText}>{(e.createdBy?.name || '?').charAt(0).toUpperCase()}</Text></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.actName} numberOfLines={1}>{handleOf(e.createdBy?.name)} <Text style={styles.actAction}>posted</Text></Text>
                  <Text style={styles.actSub} numberOfLines={1}>{e.title}</Text>
                  <Text style={styles.actMeta}>{timeAgo(e.createdAt)} · {CATEGORY_LABEL[e.category] || 'Post'}</Text>
                </View>
                <Ionicons name="bookmark-outline" size={18} color={colors.textFaint} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { fontSize: 19, fontWeight: '800', color: colors.primary },
  badge: { position: 'absolute', top: -5, right: -5, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: colors.bg },
  badgeText: { fontSize: 8.5, fontWeight: '800', color: colors.onPrimary },
  container: { padding: 14, paddingBottom: layout.tabBarSpace + 20 },
  scoreCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.xl, padding: 16, ...shadow.card },
  scoreMid: { flex: 1, marginLeft: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { alignItems: 'flex-start' },
  statNum: { fontSize: 22, fontWeight: '900', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: -2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border, marginHorizontal: 14 },
  scoreHint: { fontSize: 12.5, color: colors.textMuted, lineHeight: 17, marginTop: 6 },
  scoreBlob: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  spark: { position: 'absolute', top: 8, left: 9 },
  scoreChevron: { position: 'absolute', top: 12, right: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12, paddingHorizontal: 2 },
  section: { fontSize: 20, fontWeight: '800', color: colors.text },
  seeAll: { fontSize: 14, fontWeight: '600', color: colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tileWrap: { width: '31.8%', marginBottom: 12 },
  tile: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', ...shadow.soft },
  tileIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileLabel: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.primary, borderRadius: radius.lg, padding: 16, marginTop: 20 },
  bannerPlus: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 3, lineHeight: 18 },
  feed: { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadow.soft },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  actBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  actAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.avatarBg, alignItems: 'center', justifyContent: 'center' },
  actAvatarText: { color: colors.avatarText, fontWeight: '800', fontSize: 16 },
  actName: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  actAction: { fontWeight: '400', color: colors.textMuted },
  actSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  actMeta: { fontSize: 12, color: colors.textFaint, marginTop: 3 },
});
