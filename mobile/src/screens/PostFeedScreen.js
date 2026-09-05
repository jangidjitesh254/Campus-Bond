import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Share, Alert, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';
import ThreadPost from '../components/ThreadPost';
import CelebrationOverlay from '../components/CelebrationOverlay';
import ActionSheet from '../components/ActionSheet';
import { EventsApi } from '../api/events';
import { LostApi, imageUrl } from '../api/lostfound';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getActivitySeenAt } from '../utils/activitySeen';
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
  const [menuFor, setMenuFor] = useState(null); // post whose long-press menu is open
  const [pending, setPending] = useState(0); // requests waiting on my posts

  const load = useCallback(async () => {
    try {
      const [ev, lf, mine] = await Promise.all([
        EventsApi.list({ limit: 40 }),
        LostApi.list({}),
        EventsApi.myCreated().catch(() => []),
      ]);
      setEvents((ev.events || []).map((e) => ({ ...e, __kind: 'event' })));
      setLost((lf.items || []).map((i) => ({ ...i, __kind: 'lost' })));
      // Drives the bell badge: requests that arrived since the activity screen
      // was last opened, so viewing it clears the dot.
      const seenAt = await getActivitySeenAt();
      setPending(
        (mine || []).reduce(
          (n, e) =>
            n +
            (e.applicants || []).filter(
              (a) => a.status === 'pending' && new Date(a.createdAt).getTime() > seenAt
            ).length,
          0
        )
      );
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

  /**
   * Interest is a toggle on both kinds of post: tapping again withdraws it.
   * Nothing is messaged — the poster gets a request to review.
   */
  async function onInterested(post) {
    try {
      if (post.__kind === 'lost') {
        const res = await LostApi.interest(post._id);
        setLost((items) =>
          items.map((i) =>
            i._id === post._id ? { ...i, isInterested: res.isInterested, interestCount: res.interestCount } : i
          )
        );
        return;
      }
      const res = await EventsApi.interest(post._id);
      if (res.interested) setCelebrating(true);
      load();
    } catch (e) {
      Alert.alert('Oops', e.message);
    }
  }

  const isMine = (p) => String(p?.createdBy?._id || p?.createdBy) === String(user?._id);

  /** Long-press opens the owner menu; other people's posts stay untouched. */
  function openMenu(post) {
    if (isMine(post)) setMenuFor(post);
  }

  function menuOptions(p) {
    if (!p) return [];
    if (p.__kind === 'lost') {
      return [
        { key: 'edit', label: 'Edit item', icon: 'edit', hint: 'Photo, details, location' },
        { key: 'resolve', label: p.status === 'resolved' ? 'Reopen item' : 'Mark as resolved', icon: 'check' },
        { key: 'delete', label: 'Delete item', icon: 'trash', tone: 'danger' },
      ];
    }
    const responses = p.applicants?.length || 0;
    return [
      { key: 'edit', label: 'Edit post', icon: 'edit', hint: 'Title, details, deadline' },
      {
        key: 'responses',
        label: 'Show responses',
        icon: 'users',
        hint: responses ? `${responses} interested` : 'No one yet',
      },
      { key: 'close', label: p.status === 'closed' ? 'Reopen post' : 'Close post', icon: 'check' },
      { key: 'delete', label: 'Delete post', icon: 'trash', tone: 'danger' },
    ];
  }

  async function onMenuSelect(key) {
    const p = menuFor;
    setMenuFor(null);
    if (!p) return;
    const lost = p.__kind === 'lost';

    try {
      if (key === 'edit') {
        navigation.navigate(lost ? 'CreateLost' : 'CreateEvent', { id: p._id });
      } else if (key === 'responses') {
        navigation.navigate('Thread', { id: p._id });
      } else if (key === 'close') {
        await EventsApi.setStatus(p._id, p.status === 'closed' ? 'open' : 'closed');
        load();
      } else if (key === 'resolve') {
        await LostApi.setStatus(p._id, p.status === 'resolved' ? 'open' : 'resolved');
        load();
      } else if (key === 'delete') {
        Alert.alert(lost ? 'Delete item' : 'Delete post', 'This cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                if (lost) await LostApi.remove(p._id);
                else await EventsApi.remove(p._id);
                load();
              } catch (e) {
                Alert.alert('Oops', e.message);
              }
            },
          },
        ]);
      }
    } catch (e) {
      Alert.alert('Oops', e.message);
    }
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

            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Activity')}
            >
              <Icon name="bell" size={16} color={t.primary} strokeWidth={1.7} />
              {pending > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pending > 9 ? '9+' : pending}</Text>
                </View>
              ) : null}
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
              placeholder="Filter this feed — press search for all of campus"
              placeholderTextColor={t.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
              // Typing filters the feed; submitting searches people, papers,
              // clubs and listings too.
              onSubmitEditing={() => query.trim() && navigation.navigate('Search', { q: query.trim() })}
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
                onLongPress={() => openMenu(item)}
                onComment={() => (lostItem ? open() : navigation.navigate('Thread', { id: item._id, focusComment: true }))}
                onInterested={() => onInterested(item)}
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

      <CelebrationOverlay
        visible={celebrating}
        onDone={() => setCelebrating(false)}
        message="Request sent! 🎉"
        subtitle="The poster will review it"
      />

      <ActionSheet
        visible={!!menuFor}
        title={menuFor?.title}
        subtitle="Your post"
        options={menuOptions(menuFor)}
        onSelect={onMenuSelect}
        onClose={() => setMenuFor(null)}
      />
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
    badge: {
      position: 'absolute',
      top: -3,
      right: -3,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 4,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: t.page,
    },
    badgeText: { fontSize: 8.5, fontWeight: '800', color: '#fff' },
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
