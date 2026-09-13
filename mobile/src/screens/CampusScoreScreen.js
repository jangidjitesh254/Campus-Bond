import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { Text } from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScoreRing from '../components/ScoreRing';
import Avatar from '../components/Avatar';
import { Loading } from '../components/ui';
import { handleOf, timeAgo } from '../components/ThreadPost';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ScoreApi, nextMilestone } from '../api/score';
import { imageUrl } from '../api/lostfound';
import { layout, shadow, monoFamily } from '../theme';
import AmbientGlow from '../components/AmbientGlow';

const ACTION_ION = {
  post_created: 'megaphone-outline',
  comment_posted: 'chatbubble-outline',
  team_joined: 'people-outline',
  request_reviewed: 'checkmark-done-outline',
  resource_uploaded: 'cloud-upload-outline',
  resource_used: 'download-outline',
  club_created: 'flag-outline',
  club_joined: 'people-circle-outline',
  lost_reported: 'search-outline',
  lost_resolved: 'happy-outline',
  listing_created: 'pricetag-outline',
  item_sold: 'cash-outline',
  contest_participation: 'trophy-outline',
  contest_won: 'medal-outline',
};

/**
 * Campus Score — the profile's "why". Total and rank up top, then where the
 * points came from, what happened recently, who is ahead, and how to earn.
 */
export default function CampusScoreScreen() {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [board, setBoard] = useState([]);
  const [rules, setRules] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [me, lb, rl] = await Promise.all([ScoreApi.me(), ScoreApi.leaderboard(10).catch(() => null), ScoreApi.rules().catch(() => [])]);
      setData(me);
      setBoard(lb?.leaders || []);
      setRules(rl);
      // Keep the cached user's total in step for the profile stat.
      refreshUser().catch(() => {});
    } catch {
    } finally {
      setRefreshing(false);
    }
    // refreshUser is recreated on every AuthProvider render; depending on it
    // would refetch (and re-render) in a loop.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!data) return <Loading label="Adding it up…" />;

  const total = data.total ?? 0;
  const target = nextMilestone(total);
  const earned = data.breakdown || [];
  const earnedKeys = new Set(earned.map((b) => b.action));

  return (
    <View style={styles.safe}>
    <AmbientGlow />
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={t.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <ScoreRing value={total} target={target} size={118} stroke={10} trackColor={t.surfaceHi} progressColor={t.accent} badgeColor={t.primary} />
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.eyebrow}>CAMPUS SCORE</Text>
          <Text style={styles.total}>{total}</Text>
          <Text style={styles.rank}>
            Rank <Text style={styles.rankNum}>#{data.rank}</Text> of {data.students} students
          </Text>
          <Text style={styles.next}>{Math.max(0, target - total)} more to reach {target}</Text>
        </View>
      </View>

      {/* Breakdown */}
      <Text style={styles.groupTitle}>Where it came from</Text>
      <View style={styles.card}>
        {earned.length === 0 ? (
          <Text style={styles.emptyText}>Nothing yet. Post, reply, share a past paper or join a team — it all counts.</Text>
        ) : (
          earned.map((b, i) => (
            <View key={b.action} style={[styles.row, i < earned.length - 1 && styles.rowBorder]}>
              <View style={styles.rowIcon}><Ionicons name={ACTION_ION[b.action] || 'star-outline'} size={18} color={t.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{b.label}</Text>
                <Text style={styles.rowSub}>{b.count} × {Math.round(b.points / b.count)} pts</Text>
              </View>
              <Text style={styles.rowPts}>+{b.points}</Text>
            </View>
          ))
        )}
      </View>

      {/* Recent */}
      {data.recent?.length ? (
        <>
          <Text style={styles.groupTitle}>Recent</Text>
          <View style={styles.card}>
            {data.recent.slice(0, 8).map((e, i, arr) => (
              <View key={e._id} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
                <View style={styles.dot} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowLabel} numberOfLines={1}>{e.label}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>{e.note ? `${e.note} · ` : ''}{timeAgo(e.at)}</Text>
                </View>
                <Text style={styles.rowPtsSmall}>+{e.points}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {/* Leaderboard */}
      {board.length ? (
        <>
          <Text style={styles.groupTitle}>Leaderboard</Text>
          <View style={styles.card}>
            {board.map((u, i) => {
              const me = String(u._id) === String(user?._id);
              const uri = imageUrl(u.avatar);
              return (
                <View key={u._id} style={[styles.row, i < board.length - 1 && styles.rowBorder, me && styles.rowMe]}>
                  <Text style={[styles.pos, i < 3 && styles.posTop]}>{u.rank}</Text>
                  {uri ? <Image source={{ uri }} style={styles.lbAvatar} /> : <Avatar name={u.name} size={34} />}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.rowLabel} numberOfLines={1}>{u.name}{me ? ' (you)' : ''}</Text>
                    <Text style={styles.rowSub} numberOfLines={1}>{handleOf(u.name)}{u.branch ? ` · ${u.branch}` : ''}</Text>
                  </View>
                  <Text style={styles.rowPts}>{u.campusScore}</Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      {/* How to earn */}
      {rules.length ? (
        <>
          <Text style={styles.groupTitle}>How to earn</Text>
          <View style={styles.card}>
            {rules.map((r, i) => (
              <View key={r.action} style={[styles.row, i < rules.length - 1 && styles.rowBorder]}>
                <View style={[styles.rowIcon, earnedKeys.has(r.action) && styles.rowIconDone]}>
                  <Ionicons name={ACTION_ION[r.action] || 'star-outline'} size={17} color={earnedKeys.has(r.action) ? t.onPrimary : t.textMuted} />
                </View>
                <Text style={[styles.rowLabel, { flex: 1, fontWeight: '500' }]}>{r.label}</Text>
                <Text style={styles.rulePts}>+{r.points}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.footHint}>EACH ACTION COUNTS ONCE PER THING — NO FARMING</Text>
        </>
      ) : null}
    </ScrollView>
    </View>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    container: { padding: 14, paddingBottom: layout.tabBarSpace + 20 },
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: t.borderSoft,
      padding: 18,
      ...shadow.card,
    },
    eyebrow: { fontFamily: monoFamily, fontSize: 9.5, fontWeight: '700', letterSpacing: 1.4, color: t.accent },
    total: { fontSize: 40, fontWeight: '900', letterSpacing: -1.5, color: t.text, marginTop: 2 },
    rank: { fontSize: 13.5, color: t.textMuted, marginTop: 2 },
    rankNum: { fontWeight: '800', color: t.text },
    next: { fontSize: 12, color: t.textFaint, marginTop: 6 },
    groupTitle: { fontFamily: monoFamily, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', color: t.textMuted, marginTop: 24, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.surface, borderRadius: 20, borderWidth: 1, borderColor: t.border, ...shadow.card },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: t.hairline },
    rowMe: { backgroundColor: t.surfaceAlt },
    rowIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: t.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    rowIconDone: { backgroundColor: t.primary },
    rowLabel: { fontSize: 14, fontWeight: '600', color: t.text },
    rowSub: { fontSize: 12, color: t.textMuted, marginTop: 2 },
    rowPts: { fontSize: 15, fontWeight: '800', color: t.text },
    rowPtsSmall: { fontFamily: monoFamily, fontSize: 11, fontWeight: '700', color: t.accent },
    rulePts: { fontFamily: monoFamily, fontSize: 11, fontWeight: '700', color: t.textMuted },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent, marginHorizontal: 13 },
    pos: { width: 22, fontFamily: monoFamily, fontSize: 11, fontWeight: '700', color: t.textFaint, textAlign: 'center' },
    posTop: { color: t.accent },
    lbAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: t.surfaceMuted },
    emptyText: { fontSize: 13.5, color: t.textMuted, lineHeight: 19, padding: 16 },
    footHint: { fontFamily: monoFamily, fontSize: 9, letterSpacing: 1, color: t.textFaint, textAlign: 'center', marginTop: 16 },
  });
}
