import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MarketCard from '../../components/MarketCard';
import { EmptyState } from '../../components/ui';
import { MarketApi } from '../../api/market';
import { useTheme } from '../../context/ThemeContext';
import { layout } from '../../theme';
import AmbientGlow from '../../components/AmbientGlow';

/** Every listing in one category — the "Show more" destination. */
export default function SellCategoryScreen({ navigation, route }) {
  const { category, label } = route.params;
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (label) navigation.setOptions({ title: label }); }, [navigation, label]);

  const load = useCallback(async () => {
    try {
      const data = await MarketApi.list({ category });
      setItems(data.items || []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onLike(item) {
    try {
      const res = await MarketApi.like(item._id);
      setItems((its) => its.map((i) => (i._id === item._id ? { ...i, isLiked: res.isLiked, likeCount: res.likeCount } : i)));
    } catch {}
  }

  if (loading) return <ActivityIndicator size="large" color={t.primary} style={styles.loading} />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <AmbientGlow />
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        contentContainerStyle={{ paddingTop: 14, paddingBottom: layout.tabBarSpace + 30 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <MarketCard
            wide
            item={item}
            onPress={() => navigation.navigate('SellDetail', { id: item._id })}
            onLike={() => onLike(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={t.primary}
            colors={[t.primary]}
          />
        }
        ListEmptyComponent={<EmptyState title="Nothing here yet" subtitle="No listings in this category." />}
      />
    </SafeAreaView>
  );
}

function makeStyles(t) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.page },
    loading: { flex: 1, backgroundColor: t.page },
  });
}
