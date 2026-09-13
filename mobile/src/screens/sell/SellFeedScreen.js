import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Text, TextInput } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../../components/Icon';
import MarketCard from '../../components/MarketCard';
import AmbientGlow from '../../components/AmbientGlow';
import { EmptyState } from '../../components/ui';
import { MarketApi, MARKET_CATEGORIES } from '../../api/market';
import { useTheme } from '../../context/ThemeContext';
import { layout, shadow } from '../../theme';

// How many listings a category shows on the home grid before "See All".
const PREVIEW = 4;

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
  const matches = q ? items.filter((i) => [i.title, i.description, i.seller?.name].some((f) => (f || '').toLowerCase().includes(q))) : [];

  // One section per category that actually has listings.
  const sections = MARKET_CATEGORIES.map((c) => ({ ...c, items: items.filter((i) => i.category === c.key) })).filter((s) => s.items.length > 0);

  const header = (
    <>
      <Text style={styles.title}>Campus Market</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.action, styles.actionPrimary]} activeOpacity={0.85} onPress={() => navigation.navigate('CreateSell')}>
          <Icon name="plus" size={14} color={t.onPrimary} strokeWidth={2.4} />
          <Text style={[styles.actionText, { color: t.onPrimary }]}>Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} activeOpacity={0.85} onPress={() => navigation.navigate('MyOrders')}>
          <Icon name="bag" size={14} color={t.textMuted} strokeWidth={1.8} />
          <Text style={styles.actionText}>My orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} activeOpacity={0.85} onPress={() => navigation.navigate('MyListings')}>
          <Icon name="tag" size={14} color={t.textMuted} strokeWidth={1.8} />
          <Text style={styles.actionText}>Listings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.search}>
        <Icon name="search" size={17} color={t.textFaint} strokeWidth={1.8} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search books, kits, electronics..."
          placeholderTextColor={t.textFaint}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {q ? (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
            <Icon name="plus" size={14} color={t.textMuted} strokeWidth={2.2} style={{ transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
        ) : null}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AmbientGlow />
      {loading ? (
        <>
          {header}
          <ActivityIndicator size="large" color={t.accentFill} style={{ marginTop: 40 }} />
        </>
      ) : q ? (
        // Searching collapses the grid into a plain result list.
        <>
          {header}
          <FlatList
            data={matches}
            keyExtractor={(i) => i._id}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: layout.tabBarSpace + 30 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={<Text style={styles.resultCount}>{matches.length} {matches.length === 1 ? 'RESULT' : 'RESULTS'}</Text>}
            renderItem={({ item }) => <MarketCard wide item={item} onPress={() => open(item)} onLike={() => onLike(item)} />}
            ListEmptyComponent={<EmptyState title="No matches" subtitle={`Nothing found for “${query.trim()}”.`} />}
          />
        </>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: layout.tabBarSpace + 30 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={t.accentFill} colors={[t.accentFill]} />
          }
        >
          {header}
          {sections.length === 0 ? (
            <EmptyState title="Nothing for sale yet" subtitle="Tap Sell to list your first item." />
          ) : (
            sections.map((s) => (
              <View key={s.key} style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>{s.label}</Text>
                  <Text style={styles.sectionCount}>{s.items.length}</Text>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity onPress={() => navigation.navigate('SellCategory', { category: s.key, label: s.label })} hitSlop={10}>
                    <Text style={styles.seeAll}>See All ›</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.grid}>
                  {s.items.slice(0, PREVIEW).map((item) => (
                    <View key={item._id} style={styles.cell}>
                      <MarketCard item={item} onPress={() => open(item)} onLike={() => onLike(item)} onBuy={() => onBuy(item)} />
                    </View>
                  ))}
                  {s.items.length % 2 === 1 && s.items.length < PREVIEW ? <View style={styles.cell} /> : null}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.page },
    title: { fontSize: 25, fontWeight: '800', color: t.text, paddingHorizontal: 20, paddingTop: 20 },
    actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 16 },
    action: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      borderRadius: 20, paddingHorizontal: 16, paddingVertical: 11,
      borderWidth: 1, borderColor: t.borderSoft,
    },
    actionPrimary: { backgroundColor: t.primary, borderColor: t.primary, ...(isDark ? {} : shadow.soft) },
    actionText: { fontSize: 13, fontWeight: '700', color: t.textMuted },

    search: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      marginHorizontal: 20, marginTop: 16, paddingHorizontal: 16, paddingVertical: 13,
      borderRadius: 20, backgroundColor: t.glass, borderWidth: 1, borderColor: t.borderSoft,
    },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '600', color: t.text, padding: 0 },

    section: { paddingTop: 26 },
    sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 20, paddingBottom: 14 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: t.text },
    sectionCount: { fontSize: 13, fontWeight: '700', color: t.textDim },
    seeAll: { fontSize: 13, fontWeight: '700', color: t.accent },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingHorizontal: 20 },
    cell: { width: '47%', flexGrow: 1 },

    resultCount: { fontSize: 12, letterSpacing: 1.5, fontWeight: '800', color: t.accent, paddingHorizontal: 20, paddingBottom: 14 },
  });
}
