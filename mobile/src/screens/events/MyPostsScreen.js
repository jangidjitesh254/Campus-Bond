import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Chip, Loading, EmptyState } from '../../components/ui';
import { EventsApi, categoryTone } from '../../api/events';
import { useTheme } from '../../context/ThemeContext';
import { spacing, font, layout } from '../../theme';

export default function MyPostsScreen({ navigation }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const [tab, setTab] = useState('created'); // 'created' | 'applied'
  const [created, setCreated] = useState([]);
  const [applied, setApplied] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [c, a] = await Promise.all([EventsApi.myCreated(), EventsApi.myApplications()]);
      setCreated(c);
      setApplied(a);
    } catch {
      // errors surface as empty states
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const data = tab === 'created' ? created : applied;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.tabs}>
        <Tab styles={styles} label={`My Posts (${created.length})`} active={tab === 'created'} onPress={() => setTab('created')} />
        <Tab styles={styles} label={`Applied (${applied.length})`} active={tab === 'applied'} onPress={() => setTab('applied')} />
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) =>
            tab === 'created' ? (
              <CreatedCard styles={styles} t={t} event={item} onPress={() => navigation.navigate('EventDetail', { id: item._id })} />
            ) : (
              <AppliedCard styles={styles} t={t} app={item} onPress={() => navigation.navigate('EventDetail', { id: item._id })} />
            )
          }
          ListEmptyComponent={
            <EmptyState
              title={tab === 'created' ? 'No posts yet' : 'No applications yet'}
              subtitle={
                tab === 'created'
                  ? 'Create a team request from the feed.'
                  : 'Apply to a post and track its status here.'
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function Tab({ label, active, onPress, styles}) {
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function CreatedCard({ event, onPress, styles, t}) {
  const pending = event.applicants?.filter((a) => a.status === 'pending').length || 0;
  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.rowBetween}>
        <Chip label={event.category} tone={categoryTone[event.category] || 'default'} />
        <Chip label={event.status === 'open' ? 'Open' : 'Closed'} tone={event.status === 'open' ? 'success' : 'muted'} />
      </View>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={[font.small, { color: t.textMuted }, { color: t.textMuted }]}>
        {event.applicants?.length || 0} responses
        {pending ? ` · ${pending} pending review` : ''}
      </Text>
      {pending > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pending} to review</Text>
        </View>
      )}
    </Card>
  );
}

function AppliedCard({ app, onPress, styles, t}) {
  const tone =
    app.myStatus === 'approved' ? 'success' : app.myStatus === 'rejected' ? 'danger' : 'accent';
  const label =
    app.myStatus === 'approved' ? 'Approved' : app.myStatus === 'rejected' ? 'Not selected' : 'Pending';
  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.rowBetween}>
        <Chip label={app.category} tone={categoryTone[app.category] || 'default'} />
        <Chip label={label} tone={tone} />
      </View>
      <Text style={styles.title}>{app.title}</Text>
      <Text style={[font.small, { color: t.textMuted }, { color: t.textMuted }]}>Posted by {app.createdBy?.name || 'Student'}</Text>
    </Card>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    tabs: { flexDirection: 'row', padding: spacing.lg, gap: spacing.md },
    tab: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: 12,
      backgroundColor: t.surface,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: t.border,
    },
    tabActive: { backgroundColor: t.primary, borderColor: t.primary },
    tabText: { fontWeight: '700', color: t.textMuted, fontSize: 13 },
    tabTextActive: { color: t.onPrimary },
    list: { padding: spacing.lg, paddingBottom: layout.tabBarSpace },
    card: { marginBottom: spacing.md },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    title: { ...font.h3, color: t.text, marginBottom: 4 },
    badge: {
      marginTop: spacing.md,
      alignSelf: 'flex-start',
      backgroundColor: t.accentSoft,
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: 999,
    },
    badgeText: { color: t.accent, fontWeight: '700', fontSize: 12 },
    });
  }
