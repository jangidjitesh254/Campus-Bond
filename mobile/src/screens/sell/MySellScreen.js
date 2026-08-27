import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MarketCard from '../../components/MarketCard';
import { Loading, EmptyState } from '../../components/ui';
import { MarketApi } from '../../api/market';
import { useTheme } from '../../context/ThemeContext';
import { spacing, layout } from '../../theme';

export default function MySellScreen({ navigation }) {
  const { t, kinds, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setItems(await MarketApi.myListings()); } catch {} finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: layout.tabBarSpace }}
        renderItem={({ item }) => <MarketCard wide item={item} onPress={() => navigation.navigate('SellDetail', { id: item._id })} />}
        ListEmptyComponent={<EmptyState title="No listings yet" subtitle="Items you list appear here." />}
      />
    </SafeAreaView>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({ safe: { flex: 1, backgroundColor: t.bg }   });
}
