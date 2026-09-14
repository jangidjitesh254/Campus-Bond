import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MarketCard from '../../components/MarketCard';
import { EmptyState } from '../../components/ui';
import { MarketApi } from '../../api/market';
import { useTheme } from '../../context/ThemeContext';
import { layout } from '../../theme';
import AmbientGlow from '../../components/AmbientGlow';

/** Every listing the current user has hearted. */
export default function WishlistScreen({ navigation }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await MarketApi.myWishlist());
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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
            badge={item.status === 'sold' ? { label: 'SOLD', tone: 'off' } : null}
            onPress={() => navigation.navigate('SellDetail', { id: item._id })}
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
        ListEmptyComponent={
          <EmptyState
            title="Your wishlist is empty"
            subtitle="Tap the heart on a listing to save it here."
          />
        }
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
