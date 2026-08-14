import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../../components/Icon';
import LostCard from '../../components/LostCard';
import { Loading, EmptyState } from '../../components/ui';
import { LostApi } from '../../api/lostfound';
import { colors, layout } from '../../theme';

export default function LostFeedScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [type, setType] = useState(null);

  const load = useCallback(async () => {
    try { const data = await LostApi.list({}); setItems(data.items); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const lost = items.filter((i) => i.type === 'lost').length;
  const found = items.filter((i) => i.type === 'found').length;
  const data = type ? items.filter((i) => i.type === type) : items;

  const FILTERS = [
    { key: null, label: `All · ${items.length}` },
    { key: 'lost', label: `Lost · ${lost}` },
    { key: 'found', label: `Found · ${found}` },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Lost &amp; Found</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateLost')}>
          <Text style={styles.report}>Report</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = type === f.key;
          return (
            <TouchableOpacity key={f.label} onPress={() => setType(f.key)} activeOpacity={0.8}>
              <View style={[styles.pill, active ? styles.active : styles.inactive]}>
                <Text style={[styles.pillText, { color: active ? colors.onPrimary : colors.textMuted }]}>{f.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => i._id}
          contentContainerStyle={{ paddingTop: 6, paddingBottom: layout.tabBarSpace + 20 }}
          renderItem={({ item }) => <LostCard item={item} onPress={() => navigation.navigate('LostDetail', { id: item._id })} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState title="Nothing here yet" subtitle="Tap Report to add a lost or found item." />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  report: { fontSize: 15, fontWeight: '600', color: colors.primary },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 10 },
  pill: { borderRadius: 999, paddingHorizontal: 15, paddingVertical: 8 },
  active: { backgroundColor: colors.primary },
  inactive: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  pillText: { fontSize: 13, fontWeight: '600' },
});
