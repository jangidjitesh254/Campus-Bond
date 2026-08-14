import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Share, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';
import Doodles from '../components/Doodles';
import ThreadPost from '../components/ThreadPost';
import CelebrationOverlay from '../components/CelebrationOverlay';
import { Loading, EmptyState } from '../components/ui';
import { EventsApi } from '../api/events';
import { colors, layout, shadow } from '../theme';

const GROUPS = {
  Teams: ['hackathon', 'project'],
  Events: ['cultural', 'competition'],
  Notices: ['other'],
};
const SUBFILTERS = [
  { key: 'All', icon: 'grid' },
  { key: 'Teams', icon: 'users' },
  { key: 'Events', icon: 'calendarCheck' },
  { key: 'Notices', icon: 'megaphone' },
  { key: 'Lost & Found', icon: 'bag' },
];

export default function HomeScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('foryou');
  const [sub, setSub] = useState('All');
  const [celebrating, setCelebrating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await EventsApi.list({ limit: 40 });
      setEvents(data.events || []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onInterested(event) {
    try {
      const { conversation, alreadyInterested } = await EventsApi.interest(event._id);
      if (alreadyInterested) {
        navigation.navigate('Chat', { conversationId: conversation._id, title: event.createdBy?.name || 'Chat' });
      } else {
        setCelebrating(true);
        load();
      }
    } catch (e) { Alert.alert('Oops', e.message); }
  }

  async function onShare(event) {
    try { await Share.share({ message: `${event.title}\n\n${event.description}\n\n— shared from Campus Bond` }); } catch {}
  }

  function selectSub(s) {
    if (s === 'Lost & Found') { navigation.getParent()?.navigate('Lost'); return; }
    setSub(s);
  }

  const filtered = sub === 'All' || !GROUPS[sub] ? events : events.filter((e) => GROUPS[sub].includes(e.category));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Doodles />
      {/* Header — brand centered at top */}
      <View style={styles.header}>
        <View style={styles.side} />
        <View style={styles.brandRow}>
          <Icon name="shield" size={24} color={colors.primary} filled />
          <Text style={styles.brand}>Campus Bond</Text>
        </View>
        <TouchableOpacity style={styles.side} onPress={() => navigation.navigate('ChatList')}>
          <Icon name="chat" size={23} color={colors.text} strokeWidth={1.7} />
          <View style={styles.bellBadge}><Text style={styles.bellBadgeText}>2</Text></View>
        </TouchableOpacity>
      </View>

      {/* Search + filter */}
      <View style={styles.searchRow}>
        <TouchableOpacity style={styles.search} activeOpacity={0.8} onPress={() => navigation.getParent()?.navigate('Lost')}>
          <Icon name="search" size={18} color={colors.textMuted} strokeWidth={1.9} />
          <Text style={styles.searchText}>Search people, posts, notices...</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn}>
          <Icon name="filter" size={20} color={colors.onPrimary} strokeWidth={1.7} />
        </TouchableOpacity>
      </View>

      {/* For you / Campus */}
      <View style={styles.segRow}>
        <TouchableOpacity style={[styles.seg, tab === 'foryou' && styles.segActive]} onPress={() => setTab('foryou')}>
          <Text style={[styles.segText, tab === 'foryou' && styles.segTextActive]}>For you</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.seg, tab === 'campus' && styles.segActive]} onPress={() => setTab('campus')}>
          <Text style={[styles.segText, tab === 'campus' && styles.segTextActive]}>Campus</Text>
        </TouchableOpacity>
      </View>

      {/* Sub-filters */}
      <View style={styles.subRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 14 }}>
          {SUBFILTERS.map((s) => {
            const active = sub === s.key;
            const fg = active ? colors.onPrimary : colors.primary;
            return (
              <TouchableOpacity key={s.key} onPress={() => selectSub(s.key)} activeOpacity={0.8}>
                <View style={[styles.subPill, active ? styles.subActive : styles.subInactive]}>
                  <Icon name={s.icon} size={16} color={fg} strokeWidth={1.8} />
                  <Text style={[styles.subText, { color: fg }]}>{s.key}</Text>
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
          data={filtered}
          keyExtractor={(i) => i._id}
          contentContainerStyle={{ paddingTop: 6, paddingBottom: layout.tabBarSpace + 20 }}
          renderItem={({ item }) => (
            <ThreadPost
              post={item}
              onOpen={() => navigation.navigate('Thread', { id: item._id })}
              onComment={() => navigation.navigate('Thread', { id: item._id, focusComment: true })}
              onInterested={() => onInterested(item)}
              onShare={() => onShare(item)}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState title="Nothing here yet" subtitle="Tap Post to share the first thing." />}
        />
      )}

      {/* Post pill FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => navigation.navigate('CreateEvent')}>
        <View style={styles.fabCircle}>
          <Icon name="plus" size={18} color={colors.primary} strokeWidth={2.4} />
        </View>
        <Text style={styles.fabText}>Post</Text>
      </TouchableOpacity>

      <CelebrationOverlay visible={celebrating} onDone={() => setCelebrating(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 2, paddingBottom: 12 },
  side: { width: 40, alignItems: 'flex-end', justifyContent: 'center' },
  brandRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  brand: { fontSize: 20, fontWeight: '800', color: colors.primary },
  bellBadge: { position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: colors.bg },
  bellBadgeText: { fontSize: 9, fontWeight: '800', color: colors.onPrimary },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceMuted, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 11 },
  searchText: { fontSize: 14.5, color: colors.textMuted },
  filterBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  segRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  seg: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  segActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  segTextActive: { color: colors.onPrimary },
  subRow: { paddingBottom: 8 },
  subPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 9 },
  subActive: { backgroundColor: colors.primary },
  subInactive: { backgroundColor: colors.surfaceAlt },
  subText: { fontSize: 13.5, fontWeight: '600' },
  fab: { position: 'absolute', right: 16, bottom: layout.tabBarSpace + 4, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primary, borderRadius: 999, paddingLeft: 8, paddingRight: 22, paddingVertical: 8, ...shadow.card },
  fabCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  fabText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
});
