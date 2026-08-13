import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SectionTitle } from '../components/ui';
import ScoreRing from '../components/ScoreRing';
import CampusDoodle from '../components/CampusDoodle';
import { useAuth } from '../context/AuthContext';
import { EventsApi } from '../api/events';
import { colors, spacing, font, radius, shadow, monoFamily, layout } from '../theme';

/** Explore tiles. `to` opens a tab; `feature` opens a teaser via the Menu stack. */
const TILES = [
  { key: 'team', label: 'Find Team', icon: 'people', to: 'Post' },
  { key: 'lost', label: 'Lost & Found', icon: 'search', to: 'Lost' },
  { key: 'market', label: 'Marketplace', icon: 'pricetag', to: 'Sell' },
  { key: 'club', label: 'Clubs', icon: 'people-circle', to: 'Club' },
  { key: 'contest', label: 'Contests', icon: 'trophy', feature: { step: '05', label: 'CONTESTS', title: 'Contests & quizzes', headerTitle: 'Contests', subtitle: 'Branch-wise coding challenges, quizzes and talent contests every week.', bullets: ['COMPETE', 'RANK', 'WIN'], icon: 'trophy-outline' } },
  { key: 'map', label: 'Campus Map', icon: 'map', feature: { step: '06', label: 'CAMPUS MAP', title: 'Campus map', headerTitle: 'Campus Map', subtitle: 'Find blocks, labs, canteens and venues with an interactive campus map.', bullets: ['LOCATE', 'NAVIGATE', 'ARRIVE'], icon: 'map-outline' } },
  { key: 'qna', label: 'Q&A', icon: 'chatbubbles', feature: { step: '07', label: 'CAMPUS Q&A', title: 'Ask the campus', headerTitle: 'Q&A', subtitle: 'Ask anything and get answers from seniors and peers across every branch.', bullets: ['ASK', 'ANSWER', 'LEARN'], icon: 'chatbubbles-outline' } },
  { key: 'papers', label: 'Past Papers', icon: 'document-text', feature: { step: '08', label: 'PAST PAPERS', title: 'Previous-year papers', headerTitle: 'Past Papers', subtitle: 'A shared library of previous-year question papers, by branch and semester.', bullets: ['BROWSE', 'DOWNLOAD', 'ACE'], icon: 'document-text-outline' } },
  { key: 'sos', label: 'Emergency', icon: 'medkit', feature: { step: '10', label: 'EMERGENCY HELP', title: 'Campus SOS', headerTitle: 'Emergency Help', subtitle: 'Need blood or urgent help? Notify nearby students instantly for a fast response.', bullets: ['ALERT', 'NEARBY', 'RESPOND'], icon: 'medkit-outline' } },
];

const CATEGORY_LABEL = {
  hackathon: 'Hackathon',
  cultural: 'Cultural',
  competition: 'Competition',
  project: 'Project',
  other: 'General',
};

function timeAgo(dateStr) {
  const then = new Date(dateStr).getTime();
  if (!then) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [activity, setActivity] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      EventsApi.list({ limit: 5 })
        .then((data) => active && setActivity(data.events || []))
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [])
  );

  function openTile(t) {
    if (t.to) navigation.navigate(t.to);
    else if (t.feature) navigation.navigate('More', { screen: 'Feature', params: t.feature });
  }

  const first = user?.name?.split(' ')[0] || 'there';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('More')} hitSlop={8}>
            <Ionicons name="menu" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.logo}>
            CAMPUS <Text style={{ color: colors.primary }}>BOND</Text>
          </Text>
          <View style={styles.headerRight}>
            <View>
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
              <View style={styles.dotGreen} />
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{first.charAt(0).toUpperCase()}</Text>
              <View style={styles.avatarDot} />
            </View>
          </View>
        </View>

        {/* Greeting + doodle */}
        <View style={styles.greetRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greet}>Hi {first} 👋</Text>
            <Text style={styles.greetSub}>Let's make your campus journey better</Text>
          </View>
          <CampusDoodle style={styles.doodle} />
        </View>

        {/* Campus Score card */}
        <TouchableOpacity
          style={styles.scoreCard}
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate('More', {
              screen: 'Feature',
              params: { step: '06', label: 'CAMPUS SCORE', title: 'Your campus score', headerTitle: 'Campus Score', subtitle: 'Earn points for helping out, posting and staying active. Climb the leaderboard.', bullets: ['ENGAGE', 'EARN', 'CLIMB'], icon: 'ribbon-outline' },
            })
          }
        >
          <ScoreRing value={user?.campusScore ?? 0} target={100} />
          <View style={styles.scoreMid}>
            <Text style={styles.scoreLabel}>YOUR CAMPUS SCORE</Text>
            <Text style={styles.scoreValue}>{user?.campusScore ?? 0}</Text>
            <Text style={styles.scoreHint}>Stay active to climb the leaderboard</Text>
          </View>
          <View style={styles.scoreBlob}>
            <Ionicons name="stats-chart" size={26} color={colors.primary} />
            <Ionicons name="sparkles-outline" size={13} color={colors.primaryLight} style={styles.spark1} />
            <Ionicons name="sparkles" size={11} color={colors.primaryLight} style={styles.spark2} />
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textFaint} style={styles.scoreChevron} />
        </TouchableOpacity>

        {/* Explore */}
        <SectionTitle action="See all" onAction={() => navigation.navigate('More')} style={styles.sectionSpace}>
          Explore
        </SectionTitle>
        <View style={styles.grid}>
          {TILES.map((t) => (
            <TouchableOpacity key={t.key} style={styles.tileWrap} activeOpacity={0.85} onPress={() => openTile(t)}>
              <View style={styles.tile}>
                <View style={styles.tileIcon}>
                  <Ionicons name={t.icon} size={24} color={colors.primary} />
                </View>
                <Text style={styles.tileLabel} numberOfLines={1}>
                  {t.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Post a team request banner */}
        <TouchableOpacity
          style={styles.banner}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Post', { screen: 'CreateEvent' })}
        >
          <View style={styles.bannerPlus}>
            <View style={styles.plusCircle}>
              <Ionicons name="add" size={26} color={colors.primary} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Post a team request</Text>
            <Text style={styles.bannerSub}>Looking for hackathon teammates? Post it now.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        {/* Activity Feed */}
        <SectionTitle
          action="View all"
          onAction={() => navigation.navigate('Post')}
          style={styles.sectionSpace}
        >
          Activity Feed
        </SectionTitle>
        <View style={styles.feed}>
          {activity.length === 0 ? (
            <Text style={[font.bodyMuted, { padding: spacing.lg }]}>
              No activity yet — be the first to post something.
            </Text>
          ) : (
            activity.map((e, i) => (
              <TouchableOpacity
                key={e._id}
                style={[styles.actRow, i < activity.length - 1 && styles.actBorder]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Post', { screen: 'EventDetail', params: { id: e._id } })}
              >
                <View style={styles.actAvatar}>
                  <Text style={styles.actAvatarText}>
                    {(e.createdBy?.name || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actName}>
                    {e.createdBy?.name || 'Student'}{' '}
                    <Text style={styles.actAction}>posted a team request</Text>
                  </Text>
                  <Text style={styles.actSub} numberOfLines={1}>
                    {e.title}
                  </Text>
                  <View style={styles.actMeta}>
                    <Text style={styles.actTime}>{timeAgo(e.createdAt)}</Text>
                    <Text style={styles.actDot}>·</Text>
                    <Text style={styles.actTag}>{CATEGORY_LABEL[e.category] || 'General'}</Text>
                  </View>
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
  container: { padding: spacing.lg, paddingBottom: layout.tabBarSpace },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dotGreen: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  avatarDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  greetRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.lg, minHeight: 74 },
  greet: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  greetSub: { ...font.bodyMuted, marginTop: 2 },
  doodle: { position: 'absolute', right: -8, top: -18 },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadow.card,
  },
  scoreMid: { flex: 1, marginLeft: spacing.md },
  scoreLabel: { fontFamily: monoFamily, fontSize: 11, letterSpacing: 1, color: colors.textMuted },
  scoreValue: { fontSize: 30, fontWeight: '900', color: colors.text, marginVertical: 1 },
  scoreHint: { fontSize: 12.5, color: colors.textMuted, lineHeight: 17 },
  scoreBlob: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark1: { position: 'absolute', top: 8, right: 8 },
  spark2: { position: 'absolute', bottom: 9, left: 9 },
  scoreChevron: { marginLeft: spacing.xs },
  sectionSpace: { marginTop: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tileWrap: { width: '31.5%', marginBottom: spacing.md },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  tileIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  tileLabel: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  bannerPlus: {
    width: 74,
    height: 74,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  plusCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  bannerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 3, lineHeight: 18 },
  feed: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  actRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  actBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  actAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actAvatarText: { color: colors.onPrimary, fontWeight: '800', fontSize: 17 },
  actName: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  actAction: { fontWeight: '600', color: colors.text },
  actSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  actMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  actTime: { fontSize: 12, color: colors.textFaint },
  actDot: { fontSize: 12, color: colors.textFaint, marginHorizontal: 6 },
  actTag: { fontSize: 12, color: colors.primaryDark, fontWeight: '700' },
});
