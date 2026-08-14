import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../../components/Icon';
import ClubCard from '../../components/ClubCard';
import { Loading, EmptyState } from '../../components/ui';
import { ClubApi, CLUB_CATEGORIES } from '../../api/clubs';
import { colors, layout } from '../../theme';

const FILTERS = [{ key: null, label: 'All' }, ...CLUB_CATEGORIES];

export default function ClubFeedScreen({ navigation }) {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try { setClubs(await ClubApi.list(category ? { category } : {})); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [category]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggle(club) {
    setBusyId(club._id);
    try {
      const res = club.isMember ? await ClubApi.leave(club._id) : await ClubApi.join(club._id);
      setClubs((cs) => cs.map((c) => (c._id === club._id ? { ...c, isMember: res.isMember, memberCount: res.memberCount } : c)));
    } catch (e) {
      /* ignore */
    } finally { setBusyId(null); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Clubs</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateClub')}>
          <Text style={styles.link}>Create</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 14 }}>
          {FILTERS.map((f) => {
            const active = category === f.key;
            return (
              <TouchableOpacity key={f.label} onPress={() => setCategory(f.key)} activeOpacity={0.8}>
                <View style={[styles.pill, active ? styles.active : styles.inactive]}>
                  <Text style={[styles.pillText, { color: active ? colors.onPrimary : colors.primary }]}>{f.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={clubs}
          keyExtractor={(c) => c._id}
          contentContainerStyle={{ paddingTop: 6, paddingBottom: layout.tabBarSpace + 40 }}
          renderItem={({ item }) => (
            <ClubCard club={item} busy={busyId === item._id} onPress={() => navigation.navigate('ClubDetail', { id: item._id })} onToggle={() => toggle(item)} />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState title="No clubs yet" subtitle="Tap the + to start the first one." />}
        />
      )}

      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => navigation.navigate('CreateClub')}>
        <View style={styles.fabCircle}><Icon name="plus" size={18} color={colors.primary} strokeWidth={2.4} /></View>
        <Text style={styles.fabText}>New club</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  link: { fontSize: 14, fontWeight: '600', color: colors.primary },
  filters: { paddingBottom: 10 },
  pill: { borderRadius: 999, paddingHorizontal: 15, paddingVertical: 8 },
  active: { backgroundColor: colors.primary },
  inactive: { backgroundColor: colors.surfaceAlt },
  pillText: { fontSize: 13, fontWeight: '600' },
  fab: { position: 'absolute', right: 16, bottom: layout.tabBarSpace + 4, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primary, borderRadius: 999, paddingLeft: 8, paddingRight: 22, paddingVertical: 8 },
  fabCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  fabText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
});
