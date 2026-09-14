import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Share, Alert, Image, Animated, Dimensions, Platform, FlatList as RNFlatList } from 'react-native';
import { Text } from '../components/Text';
import { FlatList as GHFlatList } from 'react-native-gesture-handler';

// Gesture-handler's list lets the pull-to-refresh pan run alongside native scroll (native only).
const FlatList = Platform.OS === 'web' ? RNFlatList : GHFlatList;
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Avatar from '../components/Avatar';
import PullToRefresh from '../components/PullToRefresh';
import DotsMenu from '../components/DotsMenu';
import Confirm from '../components/Confirm';
import SideMenu from '../components/SideMenu';
import { Ghost, GhostMark } from '../components/Mascot';
import { handleOf, timeAgo } from '../components/ThreadPost';
import { useAuth } from '../context/AuthContext';
import { EventsApi } from '../api/events';
import { LostApi, imageUrl } from '../api/lostfound';
import { MarketApi } from '../api/market';
import { ClubApi } from '../api/clubs';
import { colors, layout, shadow } from '../theme';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

/** Per-type identity: section name, icon and accent — so every row reads at a glance. */
const KIND = {
  event: { name: 'Team', icon: 'people', fg: colors.badgeTeamFg, bg: colors.badgeTeamBg },
  lost: { name: 'Lost & Found', icon: 'search', fg: colors.amber, bg: colors.amberSoft },
  market: { name: 'Market', icon: 'pricetag', fg: colors.badgeEventFg, bg: colors.badgeEventBg },
  club: { name: 'Club', icon: 'flag', fg: colors.badgeClubFg, bg: colors.badgeClubBg },
};

const TABS = [
  { key: 'all', label: 'For you', icon: 'sparkles' },
  { key: 'event', label: 'Teams', icon: KIND.event.icon },
  { key: 'lost', label: 'Lost & Found', icon: KIND.lost.icon },
  { key: 'market', label: 'Market', icon: KIND.market.icon },
  { key: 'club', label: 'Clubs', icon: KIND.club.icon },
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
      return { ...base, text: d.name, body: d.description, label: CLUB_CAT[d.category] || 'Club', meta: `${d.memberCount ?? (d.members || []).length} members`, joined: !!d.isMember, requested: d.myRequest === 'pending' };
    default:
      return base;
  }
}

/* ------------------------------------------------------------------ */
/*  Post row                                                           */
/* ------------------------------------------------------------------ */

/** Square club tile — logo on top, name + members, Join button. Used in the rail and the Clubs grid. */
function ClubTile({ post, onOpen, onJoin, busy, width }) {
  const k = KIND.club;
  const uri = imageUrl(post.image);
  return (
    <TouchableOpacity style={[styles.tile, { width }]} activeOpacity={0.9} onPress={onOpen}>
      <View style={[styles.tileMedia, { height: width, backgroundColor: k.bg }]}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <Avatar name={post.text} size={Math.round(width * 0.42)} bg={colors.surface} textColor={k.fg} />}
        <View style={[styles.tileTag, { backgroundColor: k.fg }]}>
          <Text style={styles.tileTagText}>{post.label}</Text>
        </View>
      </View>
      <Text style={styles.tileName} numberOfLines={1}>{post.text}</Text>
      <Text style={styles.tileMeta} numberOfLines={1}>{post.meta}</Text>
      <TouchableOpacity
        style={[styles.joinBtn, post.joined || post.requested ? styles.joinBtnDone : styles.joinBtnGo]}
        onPress={onJoin}
        disabled={busy}
        activeOpacity={0.85}
      >
        <Text style={[styles.joinText, { color: post.joined || post.requested ? colors.text : colors.onPrimary }]}>{post.joined ? 'Joined' : post.requested ? 'Requested' : 'Join'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const TILE = 148;
const GRID_GAP = 12;
const gridTile = Math.floor((Dimensions.get('window').width - 16 * 2 - GRID_GAP) / 2);

/** Horizontal rail with a titled header — used for clubs and market picks. */
function Rail({ icon, tint, title, onSeeAll, children }) {
  return (
    <View style={styles.rail}>
      <View style={styles.railHead}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={icon} size={15} color={tint} />
          <Text style={styles.railTitle}>{title}</Text>
        </View>
        <TouchableOpacity onPress={onSeeAll} hitSlop={8}>
          <Text style={styles.railLink}>See all</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railScroll}>
        {children}
      </ScrollView>
    </View>
  );
}

/** E-commerce product card: square photo, price, title, condition, seller, Ask button. */
function ProductCard({ post, width, onOpen, onShare }) {
  const k = KIND.market;
  const r = post.raw;
  const uri = imageUrl(post.image);
  return (
    <TouchableOpacity style={[styles.product, { width }]} activeOpacity={0.9} onPress={onOpen}>
      <View style={[styles.productMedia, { height: width }, post.sold && { opacity: 0.5 }]}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <GhostMark width={Math.round(width * 0.3)} color={colors.surfaceHi} bg={colors.surfaceMuted} variant="cool" />}
        <TouchableOpacity style={styles.productShare} onPress={onShare} hitSlop={8}>
          <Ionicons name="paper-plane-outline" size={15} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.productPriceRow}>
        <Text style={[styles.productPrice, { color: k.fg }]}>₹{r.price}</Text>
        <Text style={styles.productCond}>{CONDITION[r.condition] || 'Good'}</Text>
      </View>
      <Text style={styles.productTitle} numberOfLines={2}>{post.text}</Text>
      <Text style={styles.productSeller} numberOfLines={1}>by {handleOf(post.owner.name)} · {timeAgo(post.at)}</Text>
      {post.sold ? (
        <View style={[styles.askBtn, { borderColor: colors.border }]}>
          <Text style={[styles.askText, { color: colors.textMuted }]}>Sold out</Text>
        </View>
      ) : (
        <TouchableOpacity style={[styles.askBtn, { borderColor: k.fg }]} onPress={onOpen} activeOpacity={0.8}>
          <Ionicons name="chatbubble-outline" size={14} color={k.fg} />
          <Text style={[styles.askText, { color: k.fg }]}>Ask seller</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const LOST_CAT = { electronics: 'Electronics', books: 'Books', 'id-card': 'ID card', keys: 'Keys', accessories: 'Accessories', clothing: 'Clothing', other: 'Other' };

function daysLeft(d) {
  if (!d) return null;
  const n = Math.ceil((new Date(d) - Date.now()) / 86400000);
  if (n < 0) return 'Closed';
  if (n === 0) return 'Last day';
  return `${n}d left`;
}

/**
 * Team post body. Collapsed it is just the title and the seats strip; tapping
 * the card reveals the description and the skills wanted.
 */
function TeamBody({ post, expanded }) {
  const r = post.raw;
  const skills = (r.skillsNeeded || []).filter(Boolean).slice(0, 6);
  const approved = (r.applicants || []).filter((a) => a.status === 'approved');
  const filled = approved.length;
  const size = r.teamSize || 1;
  const left = daysLeft(r.deadline);
  const closed = r.status === 'closed' || left === 'Closed';
  const hasMore = !!post.body || skills.length > 0;
  return (
    <>
      <Text style={styles.text}>{post.text}</Text>

      {expanded ? (
        <>
          {post.body ? <Text style={styles.body}>{post.body}</Text> : null}
          {skills.length ? (
            <View style={styles.chips}>
              <Text style={styles.chipsLabel}>Looking for</Text>
              {skills.map((sk) => (
                <View key={sk} style={styles.chip}>
                  <Text style={styles.chipText}>{sk}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      {/* Roster: owner + approved members, then a dashed "+" for every open seat */}
      <View style={styles.roster}>
        <View style={styles.seats}>
          {[{ user: r.createdBy }, ...approved].slice(0, 5).map((a, i) => (
            <View key={a.user?._id || i} style={[styles.seat, i > 0 && { marginLeft: -8 }]}>
              {a.user?.name ? <Avatar name={a.user.name} size={28} neutral /> : <View style={styles.seatFilled}><Ionicons name="person" size={13} color={colors.textMuted} /></View>}
            </View>
          ))}
          {Array.from({ length: Math.min(Math.max(size - filled, 0), 4) }).map((_, i) => (
            <View key={`open-${i}`} style={[styles.seat, styles.seatOpen, { marginLeft: -8 }]}>
              <Ionicons name="add" size={14} color={colors.textMuted} />
            </View>
          ))}
        </View>
        <Text style={styles.rosterText} numberOfLines={1}>
          {closed ? 'Team closed' : filled >= size ? 'Team full' : `${size - filled} ${size - filled === 1 ? 'seat' : 'seats'} open`}
          {left && !closed ? <Text style={{ color: colors.amber, fontWeight: '600' }}> · {left}</Text> : null}
        </Text>
        {hasMore ? <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textFaint} /> : null}
      </View>
    </>
  );
}


/** Post header shared by the card layouts — same 40px avatar as the Team row. */
function PostHead({ post, menu, right }) {
  const o = post.owner;
  return (
    <View style={styles.plainHead}>
      <Avatar name={o.name} size={40} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name} numberOfLines={1}>{handleOf(o.name)}</Text>
        <Text style={styles.label} numberOfLines={1}>{o.branch ? `${o.branch} · ` : ''}{timeAgo(post.at)}</Text>
      </View>
      {right}
      <DotsMenu items={menu} />
    </View>
  );
}

/** Lost & Found — photo first (or a faint mascot placeholder), then who / what / where. */
function LostPost({ post, uri, menu, onOpen, onShare }) {
  const r = post.raw;
  const lost = r.type === 'lost';
  const tone = lost ? colors.badgeNoticeFg : colors.success;
  const resolved = r.status === 'resolved';
  const where = r.location ? `${lost ? 'near' : 'at'} ${r.location}` : 'on campus';
  return (
    <TouchableOpacity style={[styles.plain, resolved && { opacity: 0.55 }]} activeOpacity={0.9} onPress={onOpen}>
      {/* Instagram order: who → photo → caption */}
      <PostHead post={post} menu={menu} right={resolved ? <Text style={styles.resolved}>Resolved</Text> : null} />

      {uri ? (
        <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={styles.photoEmpty}>
          <GhostMark width={52} color={colors.surfaceHi} bg={colors.surfaceMuted} variant={lost ? 'surprised' : 'happy'} />
        </View>
      )}

      <Text style={styles.plainTitle}>{post.text}</Text>
      <View style={styles.statusLine}>
        <Ionicons name={lost ? 'alert-circle' : 'checkmark-circle'} size={15} color={tone} />
        <Text style={styles.statusText}>
          <Text style={{ color: tone, fontWeight: '700' }}>{lost ? 'Lost' : 'Found'}</Text> {where}
          <Text style={{ color: colors.textMuted }}> · {LOST_CAT[r.category] || 'Other'}</Text>
        </Text>
      </View>
      {post.body ? <Text style={styles.body} numberOfLines={3}>{post.body}</Text> : null}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={onOpen} hitSlop={8}>
          <Ionicons name="chatbubble-outline" size={21} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={onShare} hitSlop={8}>
          <Ionicons name="paper-plane-outline" size={21} color={colors.text} />
        </TouchableOpacity>
        {!resolved ? (
          <TouchableOpacity style={styles.ctaLink} onPress={onOpen} hitSlop={8}>
            <Text style={[styles.ctaLinkText, { color: tone }]}>{lost ? 'I found it' : "That's mine"}</Text>
            <Ionicons name="arrow-forward" size={15} color={tone} />
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

/** Team — Threads-style row: avatar gutter, handle, title; tap to unfold the details. */
function TeamPost({ post, me, menu, onOpen, onLike, onComment, onShare }) {
  const [expanded, setExpanded] = useState(false);
  const isMine = String(post.owner._id || post.owner) === String(me?._id);
  const liked = (post.raw.applicants || []).some((a) => String(a.user?._id || a.user) === String(me?._id));
  const who = post.owner.branch ? `${post.owner.branch}${post.owner.semester ? ` · Sem ${post.owner.semester}` : ''}` : '';

  return (
    <TouchableOpacity style={styles.post} activeOpacity={0.9} onPress={() => setExpanded((v) => !v)}>
      <View style={styles.gutter}>
        <Avatar name={post.owner.name} size={40} neutral />
        <View style={styles.thread} />
      </View>

      <View style={styles.content}>
        <View style={styles.head}>
          <Text style={styles.name} numberOfLines={1}>{handleOf(post.owner.name)}</Text>
          <Text style={styles.time}>{timeAgo(post.at)}</Text>
          <DotsMenu items={menu} />
        </View>
        <View style={styles.labelRow}>
          <View style={styles.pill}>
            <Ionicons name="people-outline" size={11} color={colors.textMuted} />
            <Text style={styles.pillText}>{post.label}</Text>
          </View>
          {who ? <Text style={styles.label} numberOfLines={1}>{who}</Text> : null}
        </View>

        <TeamBody post={post} expanded={expanded} />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={isMine ? undefined : onLike} hitSlop={8} disabled={isMine}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={23} color={liked ? colors.like : colors.text} />
            {post.likes ? <Text style={styles.count}>{post.likes}</Text> : null}
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={onComment} hitSlop={8}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
            {post.comments ? <Text style={styles.count}>{post.comments}</Text> : null}
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={onShare} hitSlop={8}>
            <Ionicons name="paper-plane-outline" size={21} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctaLink} onPress={onOpen} hitSlop={8}>
            <Text style={styles.openText}>Open</Text>
            <Ionicons name="arrow-forward" size={15} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/** Each kind gets its own layout so the feed doesn't read as one long list of the same row. */
// Memoised on the post object itself: the feed only hands out new objects
// when the server data actually changed, so untouched rows never re-render.
const Post = React.memo(
  function Post(props) {
    const uri = imageUrl(props.post.image);
    if (props.post.kind === 'lost') return <LostPost {...props} uri={uri} />;
    return <TeamPost {...props} />;
  },
  (a, b) => a.post === b.post && a.me === b.me
);

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
  const feedSig = useRef('');

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
    // Only touch state when something actually changed, so a refetch that
    // returns the same feed doesn't re-render thirty rows for nothing.
    const sig = items.map((p) => `${p.kind}:${p.id}:${p.raw.updatedAt || p.at}:${p.raw.status || ''}:${p.raw.isMember ?? ''}:${p.raw.myRequest ?? ''}`).join('|');
    if (sig !== feedSig.current) {
      feedSig.current = sig;
      setFeed(items);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const goTab = (t, params) => navigation.getParent()?.navigate(t, params);

  function open(post) {
    const screens = { event: ['Post', 'Thread'], lost: ['Search', 'LostDetail'], market: ['Sell', 'SellDetail'], club: ['Club', 'ClubDetail'] };
    const [t, screen] = screens[post.kind];
    goTab(t, { screen, params: { id: post.id } });
  }

  // Interest sends the poster a request; the chat opens only once they accept.
  // Tapping again withdraws it.
  async function like(post) {
    buzz(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    try {
      await EventsApi.interest(post.id);
      load();
    } catch (e) {
      Alert.alert('Oops', e.message);
    }
  }

  async function share(post) {
    try {
      await Share.share({ message: `${post.text}${post.body ? `\n\n${post.body}` : ''}\n\n— shared from Campus Bond` });
    } catch {}
  }

  // Joining is an application the club president reviews; leaving is immediate.
  async function join(post) {
    buzz(() => Haptics.selectionAsync());
    if (!post.joined) {
      if (post.requested) return open(post);
      return goTab('Club', { screen: 'JoinClub', params: { id: post.id, name: post.text, category: post.raw.category } });
    }
    setBusy(post.id);
    try {
      await ClubApi.leave(post.id);
      await load();
    } catch (e) {
      Alert.alert('Oops', e.message);
    } finally {
      setBusy(null);
    }
  }

  const DONE = { event: ['closed', 'Close post'], lost: ['resolved', 'Mark as resolved'], market: ['sold', 'Mark as sold'] };
  const API = { event: EventsApi, lost: LostApi, market: MarketApi };

  async function setDone(post) {
    try {
      await API[post.kind].setStatus(post.id, DONE[post.kind][0]);
      load();
    } catch (e) {
      Alert.alert('Oops', e.message);
    }
  }

  const [toDelete, setToDelete] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const remove = (post) => setToDelete(post);

  async function confirmDelete() {
    const post = toDelete;
    setToDelete(null);
    try {
      await API[post.kind].remove(post.id);
      load();
    } catch (e) {
      Alert.alert('Oops', e.message);
    }
  }

  /** Context-menu entries for a post: owners can close/delete, everyone else can report. */
  function menuFor(post) {
    const mine = String(post.owner._id || post.owner) === String(user?._id);
    const done = post.raw.status === DONE[post.kind][0];
    return [
      { label: 'Open', icon: 'open-outline', onPress: () => open(post) },
      { label: 'Share', icon: 'paper-plane-outline', onPress: () => share(post) },
      !mine && { label: 'Message', icon: 'chatbubble-ellipses-outline', onPress: () => open(post) },
      mine && !done && { label: DONE[post.kind][1], icon: 'checkmark-circle-outline', onPress: () => setDone(post) },
      mine && { label: 'Delete', icon: 'trash-outline', destructive: true, onPress: () => remove(post) },
      !mine && { label: 'Report', icon: 'flag-outline', destructive: true, onPress: () => Alert.alert('Reported', 'Thanks — we will take a look.') },
    ];
  }

  function pickTab(key) {
    if (key === tab) return;
    buzz(() => Haptics.selectionAsync());
    setTab(key);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }

  const clubs = useMemo(() => feed.filter((p) => p.kind === 'club'), [feed]);
  const market = useMemo(() => feed.filter((p) => p.kind === 'market'), [feed]);
  const posts = useMemo(() => feed.filter((p) => p.kind === 'event' || p.kind === 'lost'), [feed]);

  const gridOf = (items) => {
    const rows = [];
    for (let i = 0; i < items.length; i += 2) rows.push({ kind: 'grid', id: items[i].id, items: items.slice(i, i + 2) });
    return rows;
  };

  // For you: posts with the market rail after the 2nd post and the club rail after the 4th.
  // Clubs / Market tabs: a 2-column grid. Other tabs: just that kind.
  const visible = useMemo(() => {
    if (tab === 'club') return gridOf(clubs);
    if (tab === 'market') return gridOf(market);
    if (tab !== 'all') return posts.filter((p) => p.kind === tab);
    const out = [...posts];
    if (clubs.length) out.splice(Math.min(4, out.length), 0, { kind: 'rail', id: 'clubs' });
    if (market.length) out.splice(Math.min(2, out.length), 0, { kind: 'rail', id: 'market' });
    return out;
  }, [posts, clubs, market, tab]);

  const renderItem = ({ item }) => {
    if (item.kind === 'rail' && item.id === 'clubs') {
      return (
        <Rail icon={KIND.club.icon} tint={KIND.club.fg} title="Clubs for you" onSeeAll={() => pickTab('club')}>
          {clubs.map((c) => (
            <ClubTile key={c.id} post={c} width={TILE} busy={busy === c.id} onOpen={() => open(c)} onJoin={() => join(c)} />
          ))}
        </Rail>
      );
    }
    if (item.kind === 'rail') {
      return (
        <Rail icon={KIND.market.icon} tint={KIND.market.fg} title="Fresh on Market" onSeeAll={() => pickTab('market')}>
          {market.map((m) => (
            <ProductCard key={m.id} post={m} width={TILE} onOpen={() => open(m)} onShare={() => share(m)} />
          ))}
        </Rail>
      );
    }
    if (item.kind === 'grid') {
      return (
        <View style={styles.gridRow}>
          {item.items.map((c) =>
            c.kind === 'market' ? (
              <ProductCard key={c.id} post={c} width={gridTile} onOpen={() => open(c)} onShare={() => share(c)} />
            ) : (
              <ClubTile key={c.id} post={c} width={gridTile} busy={busy === c.id} onOpen={() => open(c)} onJoin={() => join(c)} />
            )
          )}
        </View>
      );
    }
    return (
      <Post
        post={item}
        me={user}
        menu={menuFor(item)}
        onOpen={() => open(item)}
        onLike={() => like(item)}
        onComment={() => goTab('Post', { screen: 'Thread', params: { id: item.id, focusComment: true } })}
        onShare={() => share(item)}
      />
    );
  };

  const Compose = (
    <TouchableOpacity style={styles.compose} activeOpacity={0.8} onPress={() => navigation.getParent()?.getParent()?.navigate('Compose')}>
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

  // Header stays put: the mascot (drawn by PullToRefresh) sits in the middle, messages on the right
  const Header = (
    <View style={styles.header}>
      <TouchableOpacity style={[styles.headerSide, { alignItems: 'flex-start' }]} onPress={() => setMenuOpen(true)} hitSlop={8}>
        <Ionicons name="menu-outline" size={28} color={colors.text} />
      </TouchableOpacity>
      <View style={{ width: 30, height: 36 }} />
      <TouchableOpacity style={styles.headerSide} onPress={() => goTab('Post', { screen: 'ChatList' })} hitSlop={8}>
        <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  // Tabs move down with the list when you pull
  const Tabs = (
    <View style={{ backgroundColor: colors.surface }}>
      {/* Thin underline tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.tabsWrap}>
        {TABS.map((t) => {
          const active = tab === t.key;
          const tint = KIND[t.key]?.fg || colors.text;
          return (
            <TouchableOpacity key={t.key} style={styles.tab} onPress={() => pickTab(t.key)} activeOpacity={0.7}>
              <View style={styles.tabInner}>
                <Ionicons name={active ? t.icon : `${t.icon}-outline`} size={15} color={active ? tint : colors.textMuted} />
                <Text style={[styles.tabText, active && { color: tint, fontWeight: '700' }]}>{t.label}</Text>
              </View>
              <View style={[styles.tabLine, active && { backgroundColor: tint }]} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PullToRefresh header={Header} top={Tabs} atTop={atTop} onRefresh={load} ghostSize={30} ghostTop={6}>
      {loading ? (
        <Skeleton />
      ) : (
        <FlatList
          ref={listRef}
          data={visible}
          keyExtractor={(p) => `${p.kind}:${p.id}`}
          renderItem={renderItem}
          ItemSeparatorComponent={() => (tab === 'club' || tab === 'market' ? null : <View style={styles.hairline} />)}
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
          scrollEventThrottle={32}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
      </PullToRefresh>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={goTab} />

      <Confirm
        visible={!!toDelete}
        title="Delete post?"
        message="This can't be undone."
        confirmText="Delete"
        destructive
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
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
    <View collapsable={false}>
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
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingBottom: 10 },
  tabText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  tabLine: { height: 2, borderRadius: 1, backgroundColor: 'transparent' },

  list: { paddingBottom: layout.tabBarSpace + 16 },
  hairline: { height: HAIRLINE, backgroundColor: colors.border },

  compose: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  composeText: { flex: 1, fontSize: 15, color: colors.textMuted },
  composeBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  composeBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.text },

  post: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  gutter: { width: 40, alignItems: 'center', marginRight: 12 },
  rail: { paddingVertical: 14 },
  railHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  railTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  railLink: { fontSize: 13.5, fontWeight: '600', color: colors.link },
  railScroll: { paddingHorizontal: 16, gap: GRID_GAP },
  gridRow: { flexDirection: 'row', gap: GRID_GAP, paddingHorizontal: 16, paddingTop: GRID_GAP },

  // Product card (e-commerce)
  product: { gap: 3 },
  productMedia: { width: '100%', borderRadius: 14, overflow: 'hidden', backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  productShare: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  productPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  productPrice: { fontSize: 17, fontWeight: '800' },
  productCond: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  productTitle: { fontSize: 13.5, fontWeight: '600', color: colors.text, lineHeight: 18, height: 36 },
  productSeller: { fontSize: 12, color: colors.textMuted },
  askBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.2, borderRadius: 999, paddingVertical: 7, marginTop: 6 },
  askText: { fontSize: 13, fontWeight: '700' },

  tile: { gap: 4 },
  tileMedia: { width: '100%', borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  tileTag: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  tileTagText: { fontSize: 10.5, fontWeight: '700', color: colors.onPrimary, letterSpacing: 0.3 },
  tileName: { fontSize: 14, fontWeight: '700', color: colors.text },
  tileMeta: { fontSize: 12.5, color: colors.textMuted, marginBottom: 4 },
  joinBtn: { alignItems: 'center', borderRadius: 999, paddingVertical: 7 },
  joinBtnGo: { backgroundColor: colors.primary },
  joinBtnDone: { backgroundColor: colors.surfaceMuted, borderWidth: HAIRLINE, borderColor: colors.border },
  joinText: { fontSize: 13.5, fontWeight: '700' },
  kindDot: { position: 'absolute', right: -3, bottom: -3, width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  thread: { flex: 1, width: 2, borderRadius: 1, backgroundColor: colors.border, marginTop: 8, marginBottom: -4 },
  content: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1, flex: 1 },
  time: { fontSize: 13, color: colors.textMuted },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  pillText: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.2, color: colors.textMuted },
  label: { fontSize: 13, color: colors.textMuted, flexShrink: 1 },
  text: { fontSize: 16, lineHeight: 22, fontWeight: '700', color: colors.text, marginTop: 6 },
  body: { fontSize: 14.5, lineHeight: 20, color: colors.textMuted, marginTop: 3 },
  // Team
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 10 },
  chipsLabel: { fontSize: 12.5, color: colors.textMuted, marginRight: 2 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.surfaceMuted, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.text },
  roster: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  seats: { flexDirection: 'row', alignItems: 'center' },
  seat: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.surface, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  seatFilled: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  seatOpen: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.mediaStroke },
  rosterText: { flex: 1, fontSize: 13, color: colors.textMuted },
  stripItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stripText: { fontSize: 12.5, color: colors.textMuted },
  stripStrong: { fontWeight: '700', color: colors.text },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Lost & Found (plain post, photo detached from the text)
  plain: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  plainHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  plainTitle: { fontSize: 16.5, fontWeight: '700', color: colors.text, lineHeight: 22 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  statusText: { fontSize: 14, color: colors.text },
  resolved: { fontSize: 12, fontWeight: '700', color: colors.success },
  photo: { width: '100%', height: 220, borderRadius: 14, marginBottom: 12, backgroundColor: colors.surfaceMuted },
  photoEmpty: { width: '100%', height: 100, borderRadius: 14, marginBottom: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },


  actions: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 12 },
  ctaLink: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 3 },
  ctaLinkText: { fontSize: 14, fontWeight: '700' },
  openText: { fontSize: 13.5, fontWeight: '600', color: colors.textMuted },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  count: { fontSize: 13.5, color: colors.textMuted, fontWeight: '500' },

  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 12 },
  emptyText: { fontSize: 14, color: colors.textMuted, marginTop: 4, textAlign: 'center' },

  skAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceMuted, marginRight: 12 },
  skLine: { height: 12, borderRadius: 6, backgroundColor: colors.surfaceMuted },
});
