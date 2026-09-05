import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LostCard from '../../components/LostCard';
import { Loading, EmptyState } from '../../components/ui';
import { LostApi } from '../../api/lostfound';
import { useTheme } from '../../context/ThemeContext';
import { spacing, layout } from '../../theme';

export default function MyLostPostsScreen({ navigation }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setItems(await LostApi.myPosts());
    } catch {
      // shown as empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <LostCard item={item} onPress={() => navigation.navigate('LostDetail', { id: item._id })} />
        )}
        ListEmptyComponent={
          <EmptyState title="No posts yet" subtitle="Items you report will appear here." />
        }
      />
    </SafeAreaView>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    list: { padding: spacing.xl, paddingBottom: layout.tabBarSpace },
    });
  }
