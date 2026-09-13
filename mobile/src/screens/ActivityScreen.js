import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import { handleOf, timeAgo } from '../components/ThreadPost';
import { Loading, EmptyState } from '../components/ui';
import { EventsApi } from '../api/events';
import { useTheme } from '../context/ThemeContext';
import { markActivitySeen } from '../utils/activitySeen';
import { layout } from '../theme';
import AmbientGlow from '../components/AmbientGlow';

const FILTERS = ['All', 'Requests', 'Comments'];

export default function ActivityScreen({ navigation }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const load = useCallback(async () => {
    try {
      const [created, applied] = await Promise.all([EventsApi.myCreated(), EventsApi.myApplications()]);
      const notes = [];
      // People interested in my posts
      created.forEach((ev) => {
        (ev.applicants || []).forEach((a) => {
          notes.push({
            id: `${ev._id}-${a._id}`,
            kind: 'request',
            name: a.user?.name,
            time: a.createdAt || ev.updatedAt,
            text: `is interested in your post "${ev.title}"`,
            cta: 'Review',
            eventId: ev._id,
          });
        });
      });
      // My accepted applications
      applied.forEach((ap) => {
        if (ap.myStatus === 'approved') {
          notes.push({
            id: `acc-${ap._id}`,
            kind: 'accepted',
            name: ap.createdBy?.name,
            time: ap.appliedAt,
            text: `accepted you for "${ap.title}". Say hello!`,
            cta: '',
            eventId: ap._id,
          });
        }
      });
      notes.sort((a, b) => new Date(b.time) - new Date(a.time));
      setItems(notes);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  // Opening this screen is what clears the bell badge.
  useFocusEffect(
    useCallback(() => {
      load();
      markActivitySeen();
    }, [load])
  );

  const data = filter === 'Requests' ? items.filter((i) => i.kind === 'request') : items;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AmbientGlow />
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <Icon name="dotsV" size={20} color={t.text} />
      </View>

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 14 }}>
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <TouchableOpacity key={f} onPress={() => setFilter(f)} activeOpacity={0.8}>
                <View style={[styles.pill, active ? styles.active : styles.inactive]}>
                  <Text style={[styles.pillText, { color: active ? t.primary : t.textMuted }]}>{f}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: layout.tabBarSpace }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => navigation.navigate('Thread', { id: item.eventId })}>
              <Avatar name={item.name} size={42} badge="hand" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.line}>
                  <Text style={styles.name}>{handleOf(item.name)}</Text>
                  <Text style={styles.time}>{timeAgo(item.time)}</Text>
                </View>
                <Text style={styles.text}>{item.text}</Text>
              </View>
              {item.cta ? (
                <View style={styles.cta}>
                  <Text style={styles.ctaText}>{item.cta}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<EmptyState title="No activity yet" subtitle="Interest and replies on your posts show up here." />}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10 },
    title: { fontSize: 22, fontWeight: '700', color: t.text },
    filters: { paddingBottom: 12 },
    pill: { borderRadius: 999, paddingHorizontal: 15, paddingVertical: 7 },
    active: { backgroundColor: t.primarySoft },
    inactive: { borderWidth: 1, borderColor: t.border },
    pillText: { fontSize: 14, fontWeight: '500' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.border },
    line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { fontSize: 15, fontWeight: '600', color: t.text },
    time: { fontSize: 12.5, color: t.textMuted },
    text: { fontSize: 14, color: t.textMuted, marginTop: 3, lineHeight: 19 },
    cta: { borderRadius: 999, backgroundColor: t.primary, paddingHorizontal: 16, paddingVertical: 8 },
    ctaText: { fontSize: 13, fontWeight: '700', color: t.onPrimary },
    });
  }
