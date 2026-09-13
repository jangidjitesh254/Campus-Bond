import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../../components/Icon';
import ClubCard from '../../components/ClubCard';
import AmbientGlow from '../../components/AmbientGlow';
import { EmptyState } from '../../components/ui';
import { ClubApi, CLUB_CATEGORIES } from '../../api/clubs';
import { useTheme } from '../../context/ThemeContext';
import { layout, shadow } from '../../theme';

const ALL = { key: null, label: 'All' };

export default function ClubFeedScreen({ navigation }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState(null);

  const load = useCallback(async () => {
    try {
      setClubs(await ClubApi.list({}));
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = (club) => navigation.navigate('ClubDetail', { id: club._id });
  const apply = (club) => navigation.navigate('JoinClub', { id: club._id, name: club.name, category: club.category });

  const mine = clubs.filter((c) => c.isMember);
  const explore = clubs.filter((c) => !c.isMember && (!category || c.category === category));
  const pending = clubs.filter((c) => !c.isMember && c.myRequest === 'pending').length;
  const reviewing = mine.reduce((n, c) => n + (c.pendingCount || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AmbientGlow />
      {loading ? (
        <ActivityIndicator size="large" color={t.accentFill} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: layout.tabBarSpace + 30 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={t.accentFill} colors={[t.accentFill]} />
          }
        >
          {/* Title + a start-your-own action */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title}>Clubs</Text>
              <Text style={styles.subtitle}>Find your people. Build something.</Text>
            </View>
            <TouchableOpacity style={styles.startBtn} activeOpacity={0.85} onPress={() => navigation.navigate('CreateClub')}>
              <Icon name="plus" size={14} color={t.onPrimary} strokeWidth={2.4} />
              <Text style={styles.startText}>Start a club</Text>
            </TouchableOpacity>
          </View>

          {/* Progress strip — how involved the student is right now */}
          <View style={styles.stats}>
            <Stat styles={styles} value={mine.length} label="JOINED" />
            <View style={styles.statLine} />
            <Stat styles={styles} value={pending} label="PENDING" />
            <View style={styles.statLine} />
            <Stat styles={styles} value={clubs.length} label="ON CAMPUS" />
          </View>

          {/* ---- My clubs ---- */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>My clubs</Text>
            {reviewing > 0 ? (
              <View style={styles.reviewChip}><Text style={styles.reviewText}>{reviewing} to review</Text></View>
            ) : null}
          </View>

          {mine.length === 0 ? (
            <View style={styles.blank}>
              <Text style={styles.blankTitle}>You have not joined a club yet</Text>
              <Text style={styles.blankSub}>Pick one below and send the president a request.</Text>
            </View>
          ) : (
            mine.map((c) => <ClubCard key={c._id} club={c} onPress={() => open(c)} />)
          )}

          {/* ---- Explore ---- */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Explore our clubs</Text>
            <Text style={styles.sectionCount}>{explore.length}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {[ALL, ...CLUB_CATEGORIES].map((f) => {
              const active = category === f.key;
              return (
                <TouchableOpacity key={f.label} onPress={() => setCategory(f.key)} activeOpacity={0.85} hitSlop={{ top: 8, bottom: 8 }}>
                  <View style={[styles.chip, active && styles.chipOn]}>
                    <Text style={[styles.chipText, active && styles.chipTextOn]}>{f.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {explore.length === 0 ? (
            <EmptyState title="Nothing here" subtitle="No clubs in this category yet — start one?" />
          ) : (
            explore.map((c) => <ClubCard key={c._id} club={c} onPress={() => open(c)} onAction={() => apply(c)} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Stat({ value, label, styles }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.page },

    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingTop: 20 },
    title: { fontSize: 27, fontWeight: '800', color: t.text },
    subtitle: { fontSize: 14, lineHeight: 19.5, fontWeight: '600', color: t.textMuted, marginTop: 8 },
    startBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: t.primary, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 11,
      ...(isDark ? {} : shadow.soft),
    },
    startText: { fontSize: 13, fontWeight: '800', color: t.onPrimary },

    stats: {
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 20, marginTop: 22, paddingVertical: 20, paddingHorizontal: 8,
      borderRadius: 26, backgroundColor: t.glass, borderWidth: 1, borderColor: t.glassBorder,
      ...shadow.card,
    },
    stat: { flex: 1, alignItems: 'center', gap: 4 },
    statValue: { fontSize: 25, fontWeight: '800', color: t.text },
    statLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1, color: t.textDim },
    statLine: { width: 1, height: 30, backgroundColor: t.hairlineAlt },

    sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: t.text },
    sectionCount: { fontSize: 14, fontWeight: '700', color: t.textDim },
    reviewChip: { backgroundColor: t.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    reviewText: { fontSize: 11, fontWeight: '800', color: t.accent },

    blank: {
      marginHorizontal: 20, paddingVertical: 26, paddingHorizontal: 20,
      borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.borderSoft, alignItems: 'center',
    },
    blankTitle: { fontSize: 15, fontWeight: '800', color: t.text },
    blankSub: { fontSize: 13, lineHeight: 19.5, fontWeight: '600', color: t.textMuted, marginTop: 6, textAlign: 'center' },

    chips: { gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
    chip: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, borderWidth: 1, borderColor: t.borderSoft },
    chipOn: { backgroundColor: t.primary, borderColor: t.primary },
    chipText: { fontSize: 13, fontWeight: '600', color: t.textFaint },
    chipTextOn: { color: t.onPrimary, fontWeight: '700' },
  });
}
