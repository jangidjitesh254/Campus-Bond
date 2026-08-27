import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../../components/Icon';
import MarketCard, { CARD_WIDTH } from '../../components/MarketCard';
import { EmptyState } from '../../components/ui';
import { MarketApi, MARKET_CATEGORIES } from '../../api/market';
import { useTheme } from '../../context/ThemeContext';
import { layout, monoFamily } from '../../theme';

// How many of a category's listings the carousel shows before "Show more".
const PREVIEW = 8;

export default function SellFeedScreen({ navigation }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await MarketApi.list({});
      setItems(data.items || []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onLike(item) {
    try {
      const res = await MarketApi.like(item._id);
      setItems((its) => its.map((i) => (i._id === item._id ? { ...i, isLiked: res.isLiked, likeCount: res.likeCount } : i)));
    } catch {}
  }

  const open = (item) => navigation.navigate('SellDetail', { id: item._id });

  async function onBuy(item) {
    try {
      await MarketApi.interest(item._id);
      setItems((its) => its.map((i) => (i._id === item._id ? { ...i, myInterest: 'pending' } : i)));
      Alert.alert('Request sent', 'The seller will review it. You can chat once they accept.');
    } catch (e) {
      Alert.alert('Oops', e.message);
    }
  }

  const q = query.trim().toLowerCase();
  const matches = q
    ? items.filter((i) =>
        [i.title, i.description, i.seller?.name].some((f) => (f || '').toLowerCase().includes(q))
      )
    : [];

  // One carousel per category that actually has listings.
  const sections = MARKET_CATEGORIES.map((c) => ({
    ...c,
    items: items.filter((i) => i.category === c.key),
  })).filter((s) => s.items.length > 0);

  const header = (
    <>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Campus Market</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.action, styles.actionPrimary]} activeOpacity={0.85} onPress={() => navigation.navigate('CreateSell')}>
          <Icon name="plus" size={14} color={t.onPrimary} strokeWidth={2.4} />
          <Text style={[styles.actionText, { color: t.onPrimary }]}>Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} activeOpacity={0.85} onPress={() => navigation.navigate('MyOrders')}>
          <Icon name="bag" size={14} color={t.text} strokeWidth={1.8} />
          <Text style={styles.actionText}>My orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} activeOpacity={0.85} onPress={() => navigation.navigate('MyListings')}>
          <Icon name="tag" size={14} color={t.text} strokeWidth={1.8} />
          <Text style={styles.actionText}>My listings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.search}>
          <Icon name="search" size={17} color={t.textMuted} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books, kits, electronics..."
            placeholderTextColor={t.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {q ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
              <Text style={styles.clear}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        {header}
        <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  // Searching collapses the carousels into a plain result list.
  if (q) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        {header}
        <FlatList
          data={matches}
          keyExtractor={(i) => i._id}
          contentContainerStyle={{ paddingTop: 6, paddingBottom: layout.tabBarSpace + 30 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {matches.length} {matches.length === 1 ? 'RESULT' : 'RESULTS'}
            </Text>
          }
          renderItem={({ item }) => (
            <MarketCard wide item={item} onPress={() => open(item)} onLike={() => onLike(item)} />
          )}
          ListEmptyComponent={<EmptyState title="No matches" subtitle={`Nothing found for “${query.trim()}”.`} />}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {header}
      <ScrollView
        contentContainerStyle={{ paddingBottom: layout.tabBarSpace + 30 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={t.primary}
            colors={[t.primary]}
          />
        }
      >
        {sections.length === 0 ? (
          <EmptyState title="Nothing for sale yet" subtitle="Tap + to list your first item." />
        ) : (
          sections.map((s) => (
            <View key={s.key} style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>{s.label}</Text>
                <Text style={styles.sectionCount}>{s.items.length}</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={styles.seeAll}
                  onPress={() => navigation.navigate('SellCategory', { category: s.key, label: s.label })}
                  hitSlop={10}
                >
                  <Text style={styles.seeAllText}>See All</Text>
                  <Icon name="chevronRight" size={13} color={t.accent} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              <FlatList
                horizontal
                data={s.items.slice(0, PREVIEW)}
                keyExtractor={(i) => i._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rail}
                snapToInterval={CARD_WIDTH + 12}
                decelerationRate="fast"
                renderItem={({ item }) => (
                  <MarketCard item={item} onPress={() => open(item)} onLike={() => onLike(item)} onBuy={() => onBuy(item)} />
                )}
              />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.page },

    titleRow: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 12 },
    title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.9, color: t.text },
    actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 12 },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 999,
      paddingHorizontal: 13,
      paddingVertical: 8,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderSoft,
    },
    actionPrimary: { backgroundColor: t.primary, borderColor: t.primary },
    actionText: { fontSize: 12.5, fontWeight: '600', letterSpacing: -0.2, color: t.text },

    searchWrap: { paddingHorizontal: 18, paddingBottom: 8 },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      height: 44,
      backgroundColor: t.field,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: t.borderSoft,
      paddingHorizontal: 15,
    },
    searchInput: { flex: 1, fontSize: 14.5, color: t.text, padding: 0 },
    clear: { fontSize: 14, color: t.textMuted, paddingHorizontal: 2 },

    section: { paddingTop: 16 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingBottom: 11 },
    sectionTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.4, color: t.text },
    sectionCount: { fontFamily: monoFamily, fontSize: 10, fontWeight: '500', color: t.textDim },
    seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    seeAllText: { fontSize: 12.5, fontWeight: '600', color: t.accent },
    rail: { gap: 12, paddingHorizontal: 18, paddingBottom: 4 },

    resultCount: { fontFamily: monoFamily, fontSize: 10, letterSpacing: 1.4, fontWeight: '700', color: t.accent, paddingHorizontal: 18, paddingBottom: 12 },
  });
}
