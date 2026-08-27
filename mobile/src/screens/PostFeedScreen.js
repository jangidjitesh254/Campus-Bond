import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Share, Alert, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';
import ThreadPost from '../components/ThreadPost';
import CelebrationOverlay from '../components/CelebrationOverlay';
import { EventsApi } from '../api/events';
import { LostApi, imageUrl } from '../api/lostfound';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { layout, monoFamily } from '../theme';

// The design has four chips. "Notice" covers everything announced to campus,
// which is where our cultural / competition categories live.
const GROUPS = {
  Teams: ['hackathon', 'project'],
  Notice: ['cultural', 'competition', 'other'],
};
const CHIPS = ['All', 'Teams', 'Lost Found', 'Notice'];

export default function PostFeedScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const [events, setEvents] = useState([]);
  const [lost, setLost] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('foryou');
  const [sub, setSub] = useState(route.params?.filter || 'All');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ev, lf] = await Promise.all([EventsApi.list({ limit: 40 }), LostApi.list({})]);
      setEvents((ev.events || []).map((e) => ({ ...e, __kind: 'event' })));
      setLost((lf.items || []).map((i) => ({ ...i, __kind: 'lost' })));
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Publish the active filter into route params so the tab bar's "+" button
  // knows whether to open CreateEvent or CreateLost.
  useEffect(() => { navigation.setParams({ filter: sub }); }, [sub]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onInterested(event) {
    try {
      const { conversation, alreadyInterested } = await EventsApi.interest(event._id);
      if (alreadyInterested) {
        navigation.navigate('Chat', { conversationId: conversation._id, title: event.createdBy?.name || 'Chat' });
      } else {
        setCelebrating(true);
        load();
      }
    } catch (e) { Alert.alert('Oops', e.message); }
  }

  async function onShare(event) {
    try { await Share.share({ message: `${event.title}\n\n${event.description || ''}\n\n— shared from Campus Bond` }); } catch {}
  }

  // Everything (teams, notices, lost & found) lives in this one feed.
  let data;
  if (sub === 'Lost Found') data = lost;
  else if (sub === 'All') data = [...events, ...lost].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else data = events.filter((e) => (GROUPS[sub] || []).includes(e.category));

  const q = query.trim().toLowerCase();
  if (q) {
    data = data.filter((i) =>
      [i.title, i.description, i.location, i.createdBy?.name, i.createdBy?.branch]
        .some((f) => (f || '').toLowerCase().includes(q))
    );
  }

  const reportMode = sub === 'Lost Found';
  const avatarUri = imageUrl(user?.avatar);
  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* For you / Campus sit in the top row, beside the actions */}
      <View style={styles.head}>
        <View style={styles.topRow}>
          <View style={styles.tabs}>
            {[['foryou', 'For you'], ['campus', 'Campus']].map(([key, label]) => {
              const active = tab === key;
              return (
                <TouchableOpacity key={key} onPress={() => setTab(key)} activeOpacity={0.8}>
                  <Text style={[styles.tab, active && styles.tabOn]}>{label}</Text>
                  <View style={[styles.tabRule, active && styles.tabRuleOn]} />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.brandActions}>
            <TouchableOpacity
              style={[styles.iconBtn, searching && styles.iconBtnOn]}
              activeOpacity={0.8}
              onPress={() => { setSearching((v) => !v); if (searching) setQuery(''); }}
            >
              <Icon name="search" size={16} color={searching ? t.onPrimary : t.primary} strokeWidth={1.7} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => navigation.navigate('ChatList')}>
              <Icon name="chat" size={16} color={t.primary} strokeWidth={1.7} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatar}
              activeOpacity={0.85}
              onPress={() => navigation.getParent()?.navigate('More', { screen: 'Profile' })}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search field, revealed by the header search button */}
        {searching ? (
          <View style={styles.field}>
            <Icon name="search" size={15} color={t.textMuted} strokeWidth={1.9} />
            <TextInput
              style={styles.fieldInput}
              placeholder="Search people, posts, notices..."
              placeholderTextColor={t.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
          </View>
        ) : null}

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsInner}>
          {CHIPS.map((c) => {
            const active = sub === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setSub(c)}
                activeOpacity={0.85}
                hitSlop={{ top: 8, bottom: 8 }}
              >
                <View style={[styles.chip, active && styles.chipOn]}>
                  <Text style={[styles.chipText, active && styles.chipTextOn]}>{c}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => `${i.__kind}-${i._id}`}
          style={styles.feed}
          contentContainerStyle={{ paddingBottom: layout.tabBarSpace + 30 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.daybar}>
              <Text style={styles.dayLabel}>TODAY</Text>
              <View style={styles.dayRule} />
              <Text style={styles.dayCount}>
                {data.length} {data.length === 1 ? 'post' : 'posts'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const lostItem = item.__kind === 'lost';
            const open = () => navigation.navigate(lostItem ? 'LostDetail' : 'Thread', { id: item._id });
            return (
              <ThreadPost
                post={item}
                onOpen={open}
                onComment={() => (lostItem ? open() : navigation.navigate('Thread', { id: item._id, focusComment: true }))}
                onInterested={() => (lostItem ? open() : onInterested(item))}
                onShare={() => onShare(item)}
              />
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={t.primary}
              colors={[t.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {q ? 'No matches' : reportMode ? 'Nothing reported yet' : 'Nothing here yet'}
              </Text>
              <Text style={styles.emptySub}>
                {q
                  ? `Nothing found for “${query.trim()}”.`
                  : reportMode
                  ? 'Tap + to report a lost or found item.'
                  : 'Tap + to share the first thing.'}
              </Text>
            </View>
          }
        />
      )}

      <CelebrationOverlay visible={celebrating} onDone={() => setCelebrating(false)} />
    </View>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.page },

    head: { paddingHorizontal: 18, paddingTop: 2 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
    brandActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnOn: { backgroundColor: t.primary, borderColor: t.primary },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: t.primary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImg: { width: '100%', height: '100%' },
    avatarText: { fontFamily: monoFamily, fontSize: 11, fontWeight: '700', color: t.onPrimary },

    tabs: { flexDirection: 'row', gap: 22, alignItems: 'flex-end' },
    tab: { fontSize: 15, fontWeight: '500', letterSpacing: -0.3, color: t.textMuted, paddingBottom: 6 },
    tabOn: { fontWeight: '600', color: t.text },
    tabRule: { height: 2, backgroundColor: 'transparent' },
    tabRuleOn: { backgroundColor: t.primary },

    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      height: 40,
      marginTop: 10,
      paddingHorizontal: 13,
      borderRadius: 999,
      backgroundColor: t.field,
    },
    fieldInput: { flex: 1, fontSize: 13.5, color: t.text, padding: 0 },

    chips: { paddingTop: 12, paddingBottom: 6 },
    chipsInner: { gap: 8, paddingRight: 18 },
    chip: {
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 13,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderSoft,
    },
    chipOn: { backgroundColor: t.primary, borderColor: t.primary },
    chipText: { fontSize: 12.5, fontWeight: '600', letterSpacing: -0.2, color: t.textMuted },
    chipTextOn: { color: t.onPrimary },

    feed: { flex: 1, paddingHorizontal: 18, paddingTop: 6 },
    daybar: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 4, paddingBottom: 10, paddingHorizontal: 2 },
    dayLabel: { fontFamily: monoFamily, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: t.accent },
    dayRule: { flex: 1, height: 1, backgroundColor: t.hairline },
    dayCount: { fontFamily: monoFamily, fontSize: 10, fontWeight: '500', color: t.textDim },

    empty: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 30 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: t.text, textAlign: 'center' },
    emptySub: { fontSize: 13, color: t.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 19 },
    });
  }
