import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import EventCard from '../../components/EventCard';
import CelebrationOverlay from '../../components/CelebrationOverlay';
import { Loading, EmptyState, Chip } from '../../components/ui';
import { EventsApi, CATEGORIES } from '../../api/events';
import { useTheme } from '../../context/ThemeContext';
import { spacing, font, radius, shadow, layout } from '../../theme';

export default function EventFeedScreen({ navigation }) {
  const { t, kinds, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState(null);
  const [error, setError] = useState('');
  const [celebrating, setCelebrating] = useState(false);

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

  async function onInterested(event) {
    try {
      const { conversation, alreadyInterested } = await EventsApi.interest(event._id);
      if (alreadyInterested) {
        // Already interested → jump straight into the chat.
        navigation.navigate('More', {
          screen: 'Chat',
          params: { conversationId: conversation._id, title: event.createdBy?.name || 'Chat' },
        });
      } else {
        setCelebrating(true); // celebrate, then refresh so the card updates
        load();
      }
    } catch (e) {
      Alert.alert('Oops', e.message);
    }
  }

  function onComment(event) {
    // Open the post with the comment box focused.
    navigation.navigate('EventDetail', { id: event._id, focusComment: true });
  }

  async function onShare(event) {
    try {
      await Share.share({ message: `${event.title}\n\n${event.description}\n\n— shared from Campus Bond` });
    } catch {
      /* dismissed */
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[font.h1, { color: t.text }, { color: t.text }]}>Find your team</Text>
          <Text style={[font.bodyMuted, { color: t.textMuted }, { color: t.textMuted }]}>Hackathons, events & competitions</Text>
        </View>
        <TouchableOpacity style={styles.inbox} onPress={() => navigation.navigate('MyPosts')}>
          <Ionicons name="albums-outline" size={22} color={t.primary} />
        </TouchableOpacity>
      </View>

      {/* Category filter chips */}
      <View style={styles.filters}>
        <FilterChip styles={styles} label="All" active={!category} onPress={() => setCategory(null)} />
        {CATEGORIES.map((c) => (
          <FilterChip styles={styles}             key={c.key}
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
              onInterested={() => onInterested(item)}
              onComment={() => onComment(item)}
              onShare={() => onShare(item)}
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
        <Ionicons name="add" size={30} color={t.onPrimary} />
      </TouchableOpacity>

      <CelebrationOverlay visible={celebrating} onDone={() => setCelebrating(false)} />
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress, styles}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.filterChip, active && styles.filterChipActive]}>
        <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
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
      backgroundColor: t.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: t.border,
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
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
    },
    filterChipActive: { backgroundColor: t.primary, borderColor: t.primary },
    filterText: { fontSize: 13, fontWeight: '600', color: t.textMuted },
    filterTextActive: { color: t.onPrimary },
    list: { paddingHorizontal: spacing.xl, paddingBottom: layout.tabBarSpace + 60, paddingTop: spacing.sm },
    fab: {
      position: 'absolute',
      right: spacing.xl,
      bottom: layout.tabBarSpace,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: t.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.card,
      shadowOpacity: 0.25,
    },
    });
  }
