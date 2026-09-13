import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Share, Alert, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Avatar from '../components/Avatar';
import PullToRefresh from '../components/PullToRefresh';
import { Ghost } from '../components/Mascot';
import { handleOf, timeAgo } from '../components/ThreadPost';
import { useAuth } from '../context/AuthContext';
import { EventsApi } from '../api/events';
import { LostApi, imageUrl } from '../api/lostfound';
import { MarketApi } from '../api/market';
import { ClubApi } from '../api/clubs';
import { colors, layout } from '../theme';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: 'all', label: 'For you' },
  { key: 'event', label: 'Teams' },
  { key: 'lost', label: 'Lost & Found' },
  { key: 'market', label: 'Market' },
  { key: 'club', label: 'Clubs' },
];

const EVENT_KIND = { hackathon: 'Hackathon', project: 'Project', cultural: 'Event', competition: 'Competition', other: 'Notice' };
const CLUB_CAT = { tech: 'Tech', cultural: 'Cultural', sports: 'Sports', academic: 'Academic', arts: 'Arts', social: 'Social', other: 'Club' };
const CONDITION = { new: 'New', 'like-new': 'Like new', good: 'Good', fair: 'Fair' };

const buzz = (fn) => fn().catch(() => {});

/** Normalise the four content types into one post shape. */
function toPost(kind, d) {
  const owner = d.createdBy || d.seller || {};
  const base = { kind, id: d._id, at: d.createdAt, owner, image: d.image, raw: d };
  switch (kind) {
    case 'event':
      return { ...base, text: d.title, body: d.description, label: EVENT_KIND[d.category] || 'Post', likes: (d.applicants || []).length, comments: (d.comments || []).length };
    case 'lost':
      return { ...base, text: d.title, body: d.description, label: d.type === 'lost' ? 'Lost' : 'Found', meta: d.location };
    case 'market':
      return { ...base, text: d.title, body: d.description, label: 'For sale', meta: `₹${d.price} · ${CONDITION[d.condition] || 'Good'}`, sold: d.status === 'sold' };
    case 'club':
      return { ...base, text: d.name, body: d.description, label: CLUB_CAT[d.category] || 'Club', meta: `${d.memberCount || 0} members`, joined: !!d.isMember };
    default:
      return base;
  }
}

/* ------------------------------------------------------------------ */
/*  Post row                                                           */
/* ------------------------------------------------------------------ */

function Post({ post, me, onOpen, onLike, onComment, onShare, onJoin, busy }) {
  const isMine = String(post.owner._id || post.owner) === String(me?._id);
  const liked = post.kind === 'event' && (post.raw.applicants || []).some((a) => String(a.user?._id || a.user) === String(me?._id));
  const uri = imageUrl(post.image);
  const name = post.kind === 'club' ? post.text : post.owner.name;

  return (
    <TouchableOpacity style={styles.post} activeOpacity={0.9} onPress={onOpen}>
      <View style={styles.gutter}>
        {post.kind === 'club' && uri ? <Image source={{ uri }} style={styles.avatarImg} /> : <Avatar name={name} size={40} />}
        <View style={styles.thread} />
      </View>

      <View style={styles.content}>
        <View style={styles.head}>
          <Text style={styles.name} numberOfLines={1}>
            {post.kind === 'club' ? post.text : handleOf(post.owner.name)}
          </Text>
          <Text style={styles.time}>{timeAgo(post.at)}</Text>
        </View>
        <Text style={styles.label}>
          {post.label}
          {post.meta ? ` · ${post.meta}` : post.owner.branch ? ` · ${post.owner.branch}${post.owner.semester ? ` · Sem ${post.owner.semester}` : ''}` : ''}
        </Text>

        {post.kind !== 'club' ? <Text style={styles.text}>{post.text}</Text> : null}
        {post.body ? (
          <Text style={[styles.body, post.kind === 'club' && styles.text]} numberOfLines={3}>
            {post.body}
          </Text>
        ) : null}

        {uri && post.kind !== 'club' ? <Image source={{ uri }} style={styles.image} resizeMode="cover" /> : null}

        <View style={styles.actions}>
          {post.kind === 'event' ? (
            <>
              <TouchableOpacity style={styles.action} onPress={isMine ? undefined : onLike} hitSlop={8} disabled={isMine}>
                <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? colors.like : colors.text} />
                {post.likes ? <Text style={styles.count}>{post.likes}</Text> : null}
              </TouchableOpacity>
              <TouchableOpacity style={styles.action} onPress={onComment} hitSlop={8}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
                {post.comments ? <Text style={styles.count}>{post.comments}</Text> : null}
              </TouchableOpacity>
            </>
          ) : post.kind === 'club' ? (
            <TouchableOpacity style={styles.action} onPress={onJoin} hitSlop={8} disabled={busy}>
              <Ionicons name={post.joined ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={post.joined ? colors.primary : colors.text} />
              <Text style={[styles.count, post.joined && { color: colors.primary }]}>{post.joined ? 'Joined' : 'Join'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.action} onPress={onOpen} hitSlop={8}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
              <Text style={styles.count}>{post.kind === 'lost' ? 'Message' : post.sold ? 'Sold' : 'Ask'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.action} onPress={onShare} hitSlop={8}>
            <Ionicons name="paper-plane-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const [tab, setTab] = useState('all');
  const [busy, setBusy] = useState(null);
  const listRef = useRef(null);

  const load = useCallback(async () => {
    const [ev, lost, market, clubs] = await Promise.allSettled([
      EventsApi.list({ limit: 30 }),
      LostApi.list({ limit: 20 }),
      MarketApi.list({ limit: 20 }),
      ClubApi.list(),
    ]);
    const items = [];
    if (ev.status === 'fulfilled') items.push(...(ev.value.events || []).map((d) => toPost('event', d)));
    if (lost.status === 'fulfilled') items.push(...(lost.value.items || []).map((d) => toPost('lost', d)));
    if (market.status === 'fulfilled') items.push(...(market.value.items || []).map((d) => toPost('market', d)));
    if (clubs.status === 'fulfilled') items.push(...(clubs.value || []).map((d) => toPost('club', d)));
    items.sort((a, b) => new Date(b.at) - new Date(a.at));
    setFeed(items);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const goTab = (t, params) => navigation.getParent()?.navigate(t, params);

  function open(post) {
    const screens = { event: ['Post', 'Thread'], lost: ['Lost', 'LostDetail'], market: ['Sell', 'SellDetail'], club: ['Club', 'ClubDetail'] };
    const [t, screen] = screens[post.kind];
    goTab(t, { screen, params: { id: post.id } });
  }

  async function like(post) {
    buzz(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    try {
      const { conversation, alreadyInterested } = await EventsApi.interest(post.id);
      if (alreadyInterested) goTab('Post', { screen: 'Chat', params: { conversationId: conversation._id, title: post.owner.name || 'Chat' } });
      else load();
    } catch (e) {
      Alert.alert('Oops', e.message);
    }
  }

  async function share(post) {
    try {
      await Share.share({ message: `${post.text}${post.body ? `\n\n${post.body}` : ''}\n\n— shared from Campus Bond` });
    } catch {}
  }

  async function join(post) {
    buzz(() => Haptics.selectionAsync());
    setBusy(post.id);
    try {
      await (post.joined ? ClubApi.leave(post.id) : ClubApi.join(post.id));
      await load();
    } catch (e) {
      Alert.alert('Oops', e.message);
    } finally {
      setBusy(null);
    }
  }

  function pickTab(key) {
    if (key === tab) return;
    buzz(() => Haptics.selectionAsync());
    setTab(key);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }

  const visible = useMemo(() => (tab === 'all' ? feed : feed.filter((p) => p.kind === tab)), [feed, tab]);

  const Compose = (
    <TouchableOpacity style={styles.compose} activeOpacity={0.8} onPress={() => goTab('Post', { screen: 'CreateEvent' })}>
      <Avatar name={user?.name} size={40} />
      <Text style={styles.composeText}>What's happening on campus?</Text>
      <View style={styles.composeBtn}>
        <Text style={styles.composeBtnText}>Post</Text>
      </View>
    </TouchableOpacity>
  );

  const Empty = (
    <View style={styles.empty}>
      <Ghost width={64} variant="surprised" />
      <Text style={styles.emptyTitle}>Quiet on campus</Text>
      <Text style={styles.emptyText}>Nothing here yet — be the first to post.</Text>
    </View>
  );

  const Top = (
    <View>
      {/* Header: the mascot (drawn by PullToRefresh) sits in the middle, messages on the right */}
      <View style={styles.header}>
        <View style={styles.headerSide} />
        <View style={{ width: 30, height: 36 }} />
        <TouchableOpacity style={styles.headerSide} onPress={() => goTab('Post', { screen: 'ChatList' })} hitSlop={8}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Thin underline tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.tabsWrap}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity key={t.key} style={styles.tab} onPress={() => pickTab(t.key)} activeOpacity={0.7}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
              <View style={[styles.tabLine, active && styles.tabLineActive]} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PullToRefresh top={Top} atTop={atTop} onRefresh={load} ghostSize={30} ghostTop={6}>
      {loading ? (
        <Skeleton />
      ) : (
        <FlatList
          ref={listRef}
          data={visible}
          keyExtractor={(p) => `${p.kind}:${p.id}`}
          renderItem={({ item }) => (
            <Post
              post={item}
              me={user}
              busy={busy === item.id}
              onOpen={() => open(item)}
              onLike={() => like(item)}
              onComment={() => goTab('Post', { screen: 'Thread', params: { id: item.id, focusComment: true } })}
              onShare={() => share(item)}
              onJoin={() => join(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.hairline} />}
          ListHeaderComponent={
            <View>
              {Compose}
              <View style={styles.hairline} />
            </View>
          }
          ListEmptyComponent={Empty}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          onScroll={(e) => setAtTop(e.nativeEvent.contentOffset.y <= 0)}
          scrollEventThrottle={16}
        />
      )}
      </PullToRefresh>
    </SafeAreaView>
  );
}

/** Quiet placeholder rows while loading. */
function Skeleton() {
  const pulse = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View>
      {[0, 1, 2, 3].map((i) => (
        <Animated.View key={i} style={[styles.post, { opacity: pulse }]}>
          <View style={[styles.skAvatar]} />
          <View style={{ flex: 1, gap: 9, paddingTop: 4 }}>
            <View style={[styles.skLine, { width: '38%' }]} />
            <View style={[styles.skLine, { width: '90%' }]} />
            <View style={[styles.skLine, { width: '64%' }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles — flat, edge-to-edge, hairlines                             */
/* ------------------------------------------------------------------ */

const HAIRLINE = StyleSheet.hairlineWidth;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerSide: { width: 32, alignItems: 'flex-end' },

  tabsWrap: { flexGrow: 0, borderBottomWidth: HAIRLINE, borderBottomColor: colors.border },
  tabs: { paddingHorizontal: 8 },
  tab: { paddingHorizontal: 12, paddingTop: 10 },
  tabText: { fontSize: 15, fontWeight: '600', color: colors.textMuted, paddingBottom: 10 },
  tabTextActive: { color: colors.text, fontWeight: '700' },
  tabLine: { height: 2, borderRadius: 1, backgroundColor: 'transparent' },
  tabLineActive: { backgroundColor: colors.text },

  list: { paddingBottom: layout.tabBarSpace + 16 },
  hairline: { height: HAIRLINE, backgroundColor: colors.border },

  compose: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  composeText: { flex: 1, fontSize: 15, color: colors.textMuted },
  composeBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  composeBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.text },

  post: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  gutter: { width: 40, alignItems: 'center', marginRight: 12 },
  avatarImg: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceMuted },
  thread: { flex: 1, width: 2, borderRadius: 1, backgroundColor: colors.border, marginTop: 8, marginBottom: -4 },
  content: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1 },
  time: { fontSize: 13, color: colors.textMuted },
  label: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
  text: { fontSize: 15.5, lineHeight: 22, color: colors.text, marginTop: 6 },
  body: { fontSize: 14.5, lineHeight: 20, color: colors.textMuted, marginTop: 3 },
  image: { width: '100%', height: 200, borderRadius: 12, marginTop: 10, backgroundColor: colors.surfaceMuted, borderWidth: HAIRLINE, borderColor: colors.border },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 22, marginTop: 12 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  count: { fontSize: 13.5, color: colors.textMuted, fontWeight: '500' },

  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 12 },
  emptyText: { fontSize: 14, color: colors.textMuted, marginTop: 4, textAlign: 'center' },

  skAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceMuted, marginRight: 12 },
  skLine: { height: 12, borderRadius: 6, backgroundColor: colors.surfaceMuted },
});
