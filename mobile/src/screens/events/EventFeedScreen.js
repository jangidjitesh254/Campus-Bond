import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import EventCard from '../../components/EventCard';
import { Loading, EmptyState, Chip } from '../../components/ui';
import { EventsApi, CATEGORIES } from '../../api/events';
import { colors, spacing, font, radius, shadow, layout } from '../../theme';

export default function EventFeedScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(
    async (opts = {}) => {
      try {
        setError('');
        const params = {};
        if (category) params.category = category;
        const data = await EventsApi.list(params);
        setEvents(data.events);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={font.h1}>Find your team</Text>
          <Text style={font.bodyMuted}>Hackathons, events & competitions</Text>
        </View>
        <TouchableOpacity style={styles.inbox} onPress={() => navigation.navigate('MyPosts')}>
          <Ionicons name="albums-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Category filter chips */}
      <View style={styles.filters}>
        <FilterChip label="All" active={!category} onPress={() => setCategory(null)} />
        {CATEGORIES.map((c) => (
          <FilterChip
            key={c.key}
            label={c.label}
            active={category === c.key}
            onPress={() => setCategory(category === c.key ? null : c.key)}
          />
        ))}
      </View>

      {loading ? (
        <Loading label="Loading posts…" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => navigation.navigate('EventDetail', { id: item._id })}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            error ? (
              <EmptyState title="Couldn't load posts" subtitle={error} />
            ) : (
              <EmptyState
                title="No posts yet"
                subtitle="Be the first to post a team request. Tap the + button."
              />
            )
          }
        />
      )}

      {/* Floating create button */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateEvent')}>
        <Ionicons name="add" size={30} color={colors.onPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.filterChip, active && styles.filterChipActive]}>
        <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inbox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  filterTextActive: { color: colors.onPrimary },
  list: { paddingHorizontal: spacing.xl, paddingBottom: layout.tabBarSpace + 60, paddingTop: spacing.sm },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: layout.tabBarSpace,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
    shadowOpacity: 0.25,
  },
});
