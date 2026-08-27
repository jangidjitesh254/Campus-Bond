import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MarketCard from '../../components/MarketCard';
import { EmptyState } from '../../components/ui';
import { MarketApi } from '../../api/market';
import { useTheme } from '../../context/ThemeContext';
import { layout } from '../../theme';

/** How the buyer's request currently stands with the seller. */
const STATUS = {
  pending: { label: 'REQUESTED', tone: 'warn' },
  accepted: { label: 'ACCEPTED', tone: 'ok' },
  rejected: { label: 'DECLINED', tone: 'off' },
};

/** Everything the current user has asked to buy. */
export default function MyOrdersScreen({ navigation }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await MarketApi.myOrders());
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
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        contentContainerStyle={{ paddingTop: 14, paddingBottom: layout.tabBarSpace + 30 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <MarketCard
            wide
            item={item}
            badge={STATUS[item.myInterest] || null}
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
            title="No orders yet"
            subtitle="Tap BUY on a listing and it will show up here once you have asked the seller."
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
