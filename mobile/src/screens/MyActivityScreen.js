import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';
import ActionSheet from '../components/ActionSheet';
import { EmptyState } from '../components/ui';
import { timeAgo } from '../components/ThreadPost';
import { EventsApi } from '../api/events';
import { LostApi } from '../api/lostfound';
import { MarketApi } from '../api/market';
import { useTheme } from '../context/ThemeContext';
import { layout, monoFamily } from '../theme';

const FILTERS = ['All', 'Posts', 'Lost & Found', 'Market'];

/** Everything about one row that differs by the kind of thing it is. */
const KINDS = {
  post: {
    badge: 'POST',
    filter: 'Posts',
    live: (i) => i.status === 'open',
    liveLabel: 'Open',
    doneLabel: 'Closed',
    reopen: 'Reopen post',
    close: 'Close post',
    setStatus: (id, live) => EventsApi.setStatus(id, live ? 'open' : 'closed'),
    remove: (id) => EventsApi.remove(id),
    tab: 'Post',
    screen: 'Thread',
  },
  lost: {
    badge: 'LOST & FOUND',
    filter: 'Lost & Found',
    live: (i) => i.status === 'open',
    liveLabel: 'Open',
    doneLabel: 'Resolved',
    reopen: 'Reopen item',
    close: 'Mark as resolved',
    setStatus: (id, live) => LostApi.setStatus(id, live ? 'open' : 'resolved'),
    remove: (id) => LostApi.remove(id),
    tab: 'Post',
    screen: 'LostDetail',
  },
  market: {
    badge: 'MARKET',
    filter: 'Market',
    live: (i) => i.status === 'available',
    liveLabel: 'On sale',
    doneLabel: 'Sold',
    reopen: 'Relist item',
    close: 'Mark as sold',
    setStatus: (id, live) => MarketApi.setStatus(id, live ? 'available' : 'sold'),
    remove: (id) => MarketApi.remove(id),
    tab: 'Sell',
    screen: 'SellDetail',
  },
};

/** How many people responded, whatever "respond" means for that kind. */
function responsesOf(item) {
  if (item.kind === 'post') return item.applicants?.length || 0;
  if (item.kind === 'lost') return item.interestCount || 0;
  return item.interested?.length || item.interestCount || 0;
}

/**
 * Everything the student has ever posted, in one place — posts, lost & found
 * and marketplace listings — with the controls to reopen or delete each one.
 */
export default function MyActivityScreen({ navigation }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [menuFor, setMenuFor] = useState(null);

  const load = useCallback(async () => {
    try {
      const [posts, lost, listings] = await Promise.all([
        EventsApi.myCreated().catch(() => []),
        LostApi.myPosts().catch(() => []),
        MarketApi.myListings().catch(() => []),
      ]);
      const all = [
        ...(posts || []).map((p) => ({ ...p, kind: 'post' })),
        ...(lost || []).map((p) => ({ ...p, kind: 'lost' })),
        ...(listings || []).map((p) => ({ ...p, kind: 'market' })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setItems(all);
    } catch {
      /* falls through to the empty state */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function open(item) {
    const k = KINDS[item.kind];
    navigation.getParent()?.navigate(k.tab, { screen: k.screen, params: { id: item._id } });
  }

  function menuOptions(item) {
    if (!item) return [];
    const k = KINDS[item.kind];
    const live = k.live(item);
    return [
      { key: 'open', label: 'View', icon: 'compose' },
      { key: 'toggle', label: live ? k.close : k.reopen, icon: 'check' },
      { key: 'delete', label: 'Delete', icon: 'trash', tone: 'danger' },
    ];
  }

  async function onSelect(key) {
    const item = menuFor;
    setMenuFor(null);
    if (!item) return;
    const k = KINDS[item.kind];

    try {
      if (key === 'open') {
        open(item);
      } else if (key === 'toggle') {
        await k.setStatus(item._id, !k.live(item));
        load();
      } else if (key === 'delete') {
        Alert.alert('Delete', 'This cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await k.remove(item._id);
                load();
              } catch (e) {
                Alert.alert('Oops', e.message);
              }
            },
          },
        ]);
      }
    } catch (e) {
      Alert.alert('Oops', e.message);
    }
  }

  const data = filter === 'All' ? items : items.filter((i) => KINDS[i.kind].filter === filter);

  if (loading) return <ActivityIndicator size="large" color={t.primary} style={styles.loading} />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.chips}>
        {FILTERS.map((f) => {
          const active = filter === f;
          const count = f === 'All' ? items.length : items.filter((i) => KINDS[i.kind].filter === f).length;
          return (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} activeOpacity={0.85} hitSlop={{ top: 8, bottom: 8 }}>
              <View style={[styles.chip, active && styles.chipOn]}>
                <Text style={[styles.chipText, active && styles.chipTextOn]}>
                  {f} {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={data}
        keyExtractor={(i) => `${i.kind}-${i._id}`}
        contentContainerStyle={{ paddingBottom: layout.tabBarSpace + 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={t.primary}
            colors={[t.primary]}
          />
        }
        renderItem={({ item }) => {
          const k = KINDS[item.kind];
          const live = k.live(item);
          const responses = responsesOf(item);
          return (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.9}
              onPress={() => open(item)}
              onLongPress={() => setMenuFor(item)}
              delayLongPress={280}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.metaRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{k.badge}</Text>
                  </View>
                  <View style={[styles.state, !live && styles.stateOff]}>
                    <Text style={[styles.stateText, !live && styles.stateTextOff]}>
                      {live ? k.liveLabel : k.doneLabel}
                    </Text>
                  </View>
                  <Text style={styles.age}>{timeAgo(item.createdAt)}</Text>
                </View>

                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.sub}>
                  {responses
                    ? `${responses} ${responses === 1 ? 'response' : 'responses'}`
                    : 'No responses yet'}
                </Text>
              </View>

              <TouchableOpacity style={styles.more} onPress={() => setMenuFor(item)} hitSlop={10}>
                <Icon name="dotsV" size={18} color={t.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="Nothing here yet"
            subtitle="Posts, lost & found reports and listings you create all show up here."
          />
        }
      />

      <ActionSheet
        visible={!!menuFor}
        title={menuFor?.title}
        subtitle={menuFor ? KINDS[menuFor.kind].badge : ''}
        options={menuOptions(menuFor)}
        onSelect={onSelect}
        onClose={() => setMenuFor(null)}
      />
    </SafeAreaView>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.page },
    loading: { flex: 1, backgroundColor: t.page },

    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderSoft,
    },
    chipOn: { backgroundColor: t.primary, borderColor: t.primary },
    chipText: { fontSize: 12, fontWeight: '600', letterSpacing: -0.2, color: t.textMuted },
    chipTextOn: { color: t.onPrimary },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 16,
      marginTop: 10,
      padding: 14,
      borderRadius: 16,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderSoft,
    },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    badge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: t.primarySoft },
    badgeText: { fontFamily: monoFamily, fontSize: 8, fontWeight: '700', letterSpacing: 0.8, color: t.text },
    state: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: t.successSoft },
    stateOff: { backgroundColor: t.field },
    stateText: { fontFamily: monoFamily, fontSize: 8, fontWeight: '700', letterSpacing: 0.8, color: t.success },
    stateTextOff: { color: t.textMuted },
    age: { fontSize: 11, color: t.textFaint },

    title: { fontSize: 14.5, lineHeight: 19, fontWeight: '600', letterSpacing: -0.2, color: t.text, marginTop: 8 },
    sub: { fontSize: 11.5, color: t.textMuted, marginTop: 4 },

    more: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  });
}
