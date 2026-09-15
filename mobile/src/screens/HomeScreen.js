import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Pressable, Share, Alert, Image, Animated, Easing, Dimensions, Platform, Linking, LayoutAnimation, FlatList as RNFlatList } from 'react-native';
import { Text } from '../components/Text';
import { FlatList as GHFlatList } from 'react-native-gesture-handler';

// Gesture-handler's list lets the pull-to-refresh pan run alongside native scroll (native only).
// Animated so the scroll offset can drive the header on the native side.
const FlatList = Animated.createAnimatedComponent(Platform.OS === 'web' ? RNFlatList : GHFlatList);
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Avatar from '../components/Avatar';
import PullToRefresh from '../components/PullToRefresh';
import DotsMenu from '../components/DotsMenu';
import Confirm from '../components/Confirm';
import { useMenu } from '../context/MenuContext';
import SearchOverlay from '../components/SearchOverlay';
import { DimLayer, SpotMenu } from '../components/Spotlight';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { Ghost, GhostMark } from '../components/Mascot';
import { handleOf, timeAgo } from '../components/ThreadPost';
import { useAuth } from '../context/AuthContext';
import { EventsApi } from '../api/events';
import { LostApi, imageUrl } from '../api/lostfound';
import { MarketApi } from '../api/market';
import { ClubApi } from '../api/clubs';
import { AnnouncementsApi } from '../api/announcements';
import { layout, shadow } from '../theme';
import { useTheme, useStyles } from '../context/ThemeContext';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

/** Per-type identity: section name, icon and accent — so every row reads at a glance. */
const KIND = {
  event: { name: 'Team', icon: 'people' },
  lost: { name: 'Lost & Found', icon: 'search' },
  market: { name: 'Market', icon: 'pricetag' },
  club: { name: 'Club', icon: 'flag' },
};

/** Accent per kind, from the active palette. */
const kindTint = (colors) => ({
  event: { fg: colors.badgeTeamFg, bg: colors.badgeTeamBg },
  lost: { fg: colors.amber, bg: colors.amberSoft },
  market: { fg: colors.badgeEventFg, bg: colors.badgeEventBg },
  club: { fg: colors.badgeClubFg, bg: colors.badgeClubBg },
});

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

/**
 * Club card — a category-tinted band with the logo hanging off its bottom
 * edge, then name, members and a Join pill. Used in the rail and the Clubs grid.
 */
function ClubTile({ post, onOpen, onJoin, busy, width }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { clubs } = useTheme();
  const tint = clubs[post.raw.category] || clubs.other;
  const uri = imageUrl(post.image);
  const done = post.joined || post.requested;
  return (
    <TouchableOpacity style={[styles.tile, { width }]} activeOpacity={0.9} onPress={onOpen}>
      <View style={[styles.tileBand, { backgroundColor: tint.bg }]}>
        <View style={[styles.tileBlob, { backgroundColor: tint.fg }]} />
        <View style={[styles.tileTag, { backgroundColor: colors.surface }]}>
          <Text style={[styles.tileTagText, { color: tint.fg }]}>{post.label}</Text>
        </View>
      </View>
      <View style={styles.tileLogo}>
        {uri ? <Image source={{ uri }} style={styles.tileLogoImg} resizeMode="cover" /> : <Avatar name={post.text} size={44} bg={tint.bg} textColor={tint.fg} />}
      </View>
      <View style={styles.tileBody}>
        <Text style={styles.tileName} numberOfLines={1}>{post.text}</Text>
        <View style={styles.tileMetaRow}>
          <Ionicons name="people-outline" size={12} color={colors.textMuted} />
          <Text style={styles.tileMeta} numberOfLines={1}>{post.meta}</Text>
        </View>
        <TouchableOpacity style={[styles.joinBtn, done ? styles.joinBtnDone : styles.joinBtnGo]} onPress={onJoin} disabled={busy} activeOpacity={0.85}>
          {post.joined ? <Ionicons name="checkmark" size={13} color={colors.text} /> : null}
          <Text style={[styles.joinText, { color: done ? colors.text : colors.onPrimary }]}>{post.joined ? 'Joined' : post.requested ? 'Requested' : 'Join'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const TILE = 156;
const TABS_H = 46; // category tabs row, collapsed to 0 while scrolling down
const UL_BASE = 100; // the underline's unscaled width; it is scaled to each tab

/**
 * A feed block that slides up into place when it appears — staggered by its
 * position — and fades with the shared `fade` value when its tab is left.
 */
function Enter({ index, leaving, dim, lit, children }) {
  const enter = useRef(new Animated.Value(0)).current; // 0 → 1: rise in
  const exit = useRef(new Animated.Value(0)).current; // 0 → 1: slide out left
  useEffect(() => {
    Animated.spring(enter, { toValue: 1, delay: Math.min(index, 6) * 40, damping: 22, stiffness: 240, mass: 0.8, useNativeDriver: true }).start();
  }, [enter, index]);
  useEffect(() => {
    if (leaving) {
      Animated.timing(exit, { toValue: 1, duration: 220, delay: Math.min(index, 5) * 30, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [leaving, exit, index]);
  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [36, 0] });
  const translateX = exit.interpolate({ inputRange: [0, 1], outputRange: [0, -Dimensions.get('window').width] });
  const opacity = Animated.multiply(enter, exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }));
  // The spotlit block lifts (scales up a touch); the dim sheet covers everything else.
  const lift = lit ? dim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }) : 1;
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { translateX }, { scale: lift }] }}>
      {children}
    </Animated.View>
  );
}

const SHIFT_UP = {
  duration: 320,
  create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  update: { type: LayoutAnimation.Types.spring, springDamping: 0.85 },
  delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity, duration: 120 },
};

/** "3w left" style countdown for the header badge. */
function shortLeft(a) {
  if (!a?.expiresAt) return '';
  const d = Math.ceil((new Date(a.expiresAt) - Date.now()) / 86400000);
  if (d <= 0) return '';
  if (d === 1) return 'last day';
  if (d < 14) return `${d}d`;
  return `${Math.round(d / 7)}w`;
}

/** Short name for the badge: "SIH 2026" for Smart India Hackathon, else the tag. */
function shortName(a) {
  if (!a) return '';
  const m = /smart india hackathon\s*(\d{4})?/i.exec(a.title || '');
  if (m) return `SIH${m[1] ? ` ${m[1]}` : ''}`;
  return a.tag || 'Notice';
}

/**
 * Campaign badge in the header: slides out from behind the mascot (clipped
 * at the mascot's centre, so it really looks like it emerges), stays a
 * while, tucks back in, and peeks out again. Tap opens the announcement.
 */
const BADGE_SHIFT = 58; // how far the mascot steps left while the badge is out, so the pair stays centred

/** Drives the badge in and out; the mascot borrows the same value to step aside. */
function useBadgeProgress(active) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.spring(progress, { toValue: 1, damping: 18, stiffness: 150, mass: 0.9, useNativeDriver: true }),
        Animated.delay(5000),
        Animated.timing(progress, { toValue: 0, duration: 380, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.delay(6000),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
      progress.setValue(0);
    };
  }, [active, progress]);
  return progress;
}

const RIBBON_H = 30;
const RIBBON_W = 168;
const CONFETTI = ['#F2B84B', '#EF5B54', '#2F6FE0', '#6A4BC4', '#1E7A43', '#FF8FAB'];

/** One confetti piece: flies out along its own angle, tumbles, falls a little and fades. */
function Piece({ i, burst }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!burst) return;
    t.setValue(0);
    Animated.timing(t, { toValue: 1, duration: 720 + (i % 3) * 90, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [burst, t, i]);
  // Fan from -80° to +40° (up and to the right), 46–84px out.
  const a = ((-80 + (i * 120) / 9) * Math.PI) / 180;
  const d = 46 + (i % 4) * 12;
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * d] });
  const translateY = t.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, Math.sin(a) * d, Math.sin(a) * d + 22] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(i % 2 ? 1 : -1) * (180 + i * 40)}deg`] });
  const opacity = t.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] });
  const scale = t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.2, 1, 0.8] });
  const round = i % 3 === 0;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: round ? 6 : 8,
        height: round ? 6 : 4,
        borderRadius: round ? 3 : 1.5,
        backgroundColor: CONFETTI[i % CONFETTI.length],
        opacity,
        transform: [{ translateX }, { translateY }, { rotate }, { scale }],
      }}
    />
  );
}

/** The party popper: ten pieces from one point, replayed on every `burst` change. */
function Confetti({ burst, style }) {
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: 0, height: 0 }, style]}>
      {Array.from({ length: 10 }).map((_, i) => (
        <Piece key={i} i={i} burst={burst} />
      ))}
    </View>
  );
}

/**
 * The campaign ribbon: a warm gold–orange banner with a swallowtail end
 * that slides out from behind the mascot (clipped at the mascot's centre),
 * with a burst of confetti as it appears. Tap opens the announcement.
 */
const STRIPS = 14; // the ribbon is cut into this many vertical slices that ripple

/**
 * Cloth wave: a linear 0→1 phase loops forever; each slice maps it onto a
 * sine, shifted by the slice's position along the ribbon, so a wave travels
 * from the mascot's end to the tail. The amplitude grows towards the free
 * end — the end tied to the mascot barely moves.
 */
function useWave() {
  const phase = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(phase, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [phase]);
  return phase;
}

function sliceOffset(phase, i) {
  const amp = 4 * ((i + 1) / STRIPS);
  const shift = (i / STRIPS) * 1.2; // ~1.2 wavelengths across the ribbon
  const steps = 16;
  const inputRange = Array.from({ length: steps + 1 }, (_, k) => k / steps);
  const outputRange = inputRange.map((t) => Math.sin(2 * Math.PI * (t - shift)) * amp);
  return phase.interpolate({ inputRange, outputRange });
}

function HeaderBadge({ item, onPress, styles, progress, bob }) {
  const [burst, setBurst] = useState(0);
  const wave = useWave();
  // Fire the popper each time the ribbon starts coming out.
  useEffect(() => {
    let armed = true;
    const id = progress.addListener(({ value }) => {
      if (value > 0.12 && armed) {
        armed = false;
        setBurst((b) => b + 1);
      } else if (value < 0.05) {
        armed = true;
      }
    });
    return () => progress.removeListener(id);
  }, [progress]);

  // The clip (the mascot's centre) moves left with the mascot; the ribbon slides out inside it.
  const clipX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -BADGE_SHIFT] });
  const x = progress.interpolate({ inputRange: [0, 1], outputRange: [-RIBBON_W - 40, 18] });
  // Tied to the mascot: the whole ribbon rides his bob…
  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [-2.5, 2.5] });
  const left = shortLeft(item);
  const notch = 16;
  const stripW = RIBBON_W / STRIPS;

  // …and every slice shows the same artwork, offset so the slices tile into one ribbon.
  const art = (
    <>
      <Svg width={RIBBON_W} height={RIBBON_H} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="ribbon" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F7C557" />
            <Stop offset="1" stopColor="#E8862E" />
          </SvgGradient>
        </Defs>
        {/* Banner with rounded left corners and a swallowtail on the right */}
        <Path
          d={`M6 0 H${RIBBON_W} L${RIBBON_W - notch} ${RIBBON_H / 2} L${RIBBON_W} ${RIBBON_H} H6 A6 6 0 0 1 0 ${RIBBON_H - 6} V6 A6 6 0 0 1 6 0 Z`}
          fill="url(#ribbon)"
        />
      </Svg>
      <View style={styles.ribbonRow}>
        <Ionicons name="trophy" size={14} color="#5A2E0A" />
        <Text style={styles.badgeText} numberOfLines={1}>{shortName(item)}</Text>
        {left ? <Text style={styles.badgeSub} numberOfLines={1}>· {left}</Text> : null}
      </View>
    </>
  );

  return (
    <>
      <Animated.View style={[styles.badgeClip, { transform: [{ translateX: clipX }] }]} pointerEvents="box-none">
        <Animated.View style={{ alignSelf: 'flex-start', transform: [{ translateX: x }, { translateY: bobY }] }}>
          <Pressable style={styles.ribbon} onPress={onPress}>
            {Array.from({ length: STRIPS }).map((_, i) => (
              <Animated.View key={i} style={[styles.strip, { width: stripW, transform: [{ translateY: sliceOffset(wave, i) }] }]}>
                <View style={{ width: RIBBON_W, height: RIBBON_H, marginLeft: -i * stripW, justifyContent: 'center' }}>{art}</View>
              </Animated.View>
            ))}
          </Pressable>
        </Animated.View>
      </Animated.View>
      {/* Popper origin: just right of the mascot, moving with it */}
      <Animated.View pointerEvents="none" style={[styles.popper, { transform: [{ translateX: clipX }] }]}>
        <Confetti burst={burst} />
      </Animated.View>
    </>
  );
}

/** A card that presses down (scale 0.97) while held and opens on release. */
function PressCard({ style, onPress, onLongPress, children }) {
  const press = useRef(new Animated.Value(0)).current;
  const box = useRef(null);
  const set = (to) => Animated.spring(press, { toValue: to, damping: 20, stiffness: 380, mass: 0.6, useNativeDriver: true }).start();
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });
  // Long-press hands over the card's frame (window coords) so it can be spotlit
  // in place. The frame is taken on press-in, before the squash starts.
  const frame = useRef(null);
  function pressIn() {
    box.current?.measureInWindow((x, y, width, height) => { frame.current = { x, y, width, height }; });
    set(1);
  }
  function longPress() {
    set(0);
    if (frame.current) onLongPress?.(frame.current);
  }
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress ? longPress : undefined} delayLongPress={240} onPressIn={pressIn} onPressOut={() => set(0)}>
      <Animated.View ref={box} collapsable={false} style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** One category tab: squashes a little while pressed, reports its frame for the underline. */
function TabChip({ active, tint, icon, label, onPress, onLayout, styles, colors }) {
  const press = useRef(new Animated.Value(0)).current;
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });
  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, 1.5] });
  const set = (to) => Animated.spring(press, { toValue: to, damping: 18, stiffness: 400, mass: 0.5, useNativeDriver: true }).start();
  return (
    <Pressable style={styles.tab} onPress={onPress} onPressIn={() => set(1)} onPressOut={() => set(0)} onLayout={onLayout} hitSlop={{ top: 6, bottom: 6 }}>
      <Animated.View style={[styles.tabInner, { transform: [{ scale }, { translateY }] }]}>
        <Ionicons name={active ? icon : `${icon}-outline`} size={15} color={active ? tint : colors.textMuted} />
        <Text style={[styles.tabText, active && { color: tint, fontWeight: '700' }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}
const GRID_GAP = 12;
const gridTile = Math.floor((Dimensions.get('window').width - 16 * 2 - GRID_GAP) / 2);

/** Horizontal rail in its own card — tinted icon, title, subtitle and a "See all" pill. */
function Rail({ icon, tint, bg, title, subtitle, onSeeAll, children }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.rail}>
      <View style={styles.railHead}>
        <View style={[styles.railIcon, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={16} color={tint} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.railTitle}>{title}</Text>
          {subtitle ? <Text style={styles.railSub} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        <TouchableOpacity style={styles.railLink} onPress={onSeeAll} hitSlop={8} activeOpacity={0.7}>
          <Text style={styles.railLinkText}>See all</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railScroll}>
        {children}
      </ScrollView>
    </View>
  );
}

/** Product card: photo with a price tag and a heart, then title, condition and seller. */
function ProductCard({ post, width, onOpen, onLike }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const r = post.raw;
  const uri = imageUrl(post.image);
  const liked = !!r.isLiked;
  return (
    <TouchableOpacity style={[styles.product, { width }]} activeOpacity={0.9} onPress={onOpen}>
      <View style={[styles.productMedia, { height: Math.round(width * 0.92) }]}>
        {uri ? (
          <Image source={{ uri }} style={[StyleSheet.absoluteFill, post.sold && { opacity: 0.45 }]} resizeMode="cover" />
        ) : (
          <GhostMark width={Math.round(width * 0.3)} color={colors.surfaceHi} bg={colors.surfaceMuted} variant="cool" />
        )}
        <View style={styles.productPrice}>
          <Text style={styles.productPriceText}>₹{r.price}</Text>
        </View>
        <TouchableOpacity style={styles.productHeart} onPress={onLike} hitSlop={8} activeOpacity={0.8}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? colors.like : colors.text} />
        </TouchableOpacity>
        {post.sold ? (
          <View style={styles.soldTag}>
            <Text style={styles.soldText}>SOLD</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.productBody}>
        <Text style={styles.productTitle} numberOfLines={2}>{post.text}</Text>
        <View style={styles.productMetaRow}>
          <View style={styles.condChip}>
            <Text style={styles.condText}>{CONDITION[r.condition] || 'Good'}</Text>
          </View>
          <Text style={styles.productSeller} numberOfLines={1}>{handleOf(post.owner.name)}</Text>
        </View>
      </View>
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
function TeamBody({ post, expanded, onToggle }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
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

      {/* Roster: owner + approved members, then a dashed "+" for every open seat. Tap to unfold the details. */}
      <Pressable style={styles.roster} onPress={hasMore ? onToggle : undefined} hitSlop={{ top: 6, bottom: 6 }}>
        <View style={styles.seats}>
          {[{ user: r.createdBy }, ...approved].slice(0, 5).map((a, i) => (
            <View key={a.user?._id || i} style={[styles.seat, i > 0 && { marginLeft: -7 }]}>
              {a.user?.name ? <Avatar name={a.user.name} size={22} neutral /> : <View style={styles.seatFilled}><Ionicons name="person" size={11} color={colors.textMuted} /></View>}
            </View>
          ))}
          {Array.from({ length: Math.min(Math.max(size - filled, 0), 4) }).map((_, i) => (
            <View key={`open-${i}`} style={[styles.seat, styles.seatOpen, { marginLeft: -7 }]}>
              <Ionicons name="add" size={12} color={colors.textMuted} />
            </View>
          ))}
        </View>
        <Text style={styles.rosterText} numberOfLines={1}>
          {closed ? 'Team closed' : filled >= size ? 'Team full' : `${size - filled} ${size - filled === 1 ? 'seat' : 'seats'} open`}
          {left && !closed ? <Text style={{ color: colors.amber, fontWeight: '600' }}> · {left}</Text> : null}
        </Text>
        {hasMore ? <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textFaint} /> : null}
      </Pressable>
    </>
  );
}

/** Post header shared by the card layouts — same 40px avatar as the Team row. */
function PostHead({ post, menu, right }) {
  const styles = useStyles(makeStyles);
  const o = post.owner;
  return (
    <View style={styles.plainHead}>
      <Avatar name={o.name} size={40} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name} numberOfLines={1}>{handleOf(o.name)}</Text>
        <Text style={styles.who} numberOfLines={1}>{o.branch ? `${o.branch} · ` : ''}{timeAgo(post.at)}</Text>
      </View>
      {right}
      <DotsMenu items={menu} />
    </View>
  );
}

/** Lost & Found — photo first (or a faint mascot placeholder), then who / what / where. */
function LostPost({ post, uri, menu, onOpen, onShare, onSpotlight }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const r = post.raw;
  const lost = r.type === 'lost';
  const tone = lost ? colors.badgeNoticeFg : colors.success;
  const resolved = r.status === 'resolved';
  const where = r.location ? `${lost ? 'near' : 'at'} ${r.location}` : 'on campus';
  return (
    <PressCard style={[styles.plain, resolved && { opacity: 0.55 }]} onPress={onOpen} onLongPress={onSpotlight}>
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
    </PressCard>
  );
}

/** Team — Threads-style row: avatar gutter, handle, title; tap to unfold the details. */
function TeamPost({ post, me, menu, onOpen, onLike, onComment, onShare, onSpotlight }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [expanded, setExpanded] = useState(false);
  const isMine = String(post.owner._id || post.owner) === String(me?._id);
  const liked = (post.raw.applicants || []).some((a) => String(a.user?._id || a.user) === String(me?._id));
  const who = post.owner.branch ? `${post.owner.branch}${post.owner.semester ? ` · Sem ${post.owner.semester}` : ''}` : '';

  return (
    <PressCard style={styles.post} onPress={onOpen} onLongPress={onSpotlight}>
      <View style={styles.gutter}>
        <Avatar name={post.owner.name} size={40} neutral />
        <View style={styles.thread} />
      </View>

      <View style={styles.content}>
        <View style={styles.head}>
          <Text style={styles.name} numberOfLines={1}>{handleOf(post.owner.name)}</Text>
          {who ? <Text style={styles.who} numberOfLines={1}>{who}</Text> : null}
          <Text style={styles.time}>{timeAgo(post.at)}</Text>
          <DotsMenu items={menu} />
        </View>
        <View style={styles.labelRow}>
          <View style={styles.pill}>
            <Ionicons name="people-outline" size={11} color={colors.textMuted} />
            <Text style={styles.pillText}>{post.label}</Text>
          </View>
        </View>

        <TeamBody post={post} expanded={expanded} onToggle={() => setExpanded((v) => !v)} />

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
    </PressCard>
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

export default function HomeScreen({ navigation, route }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const TINT = kindTint(colors);
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const [tab, setTab] = useState('all');
  const [busy, setBusy] = useState(null);
  const listRef = useRef(null);
  const feedSig = useRef('');

  const loadedAt = useRef(0);
  const load = useCallback(async () => {
    const [ev, lost, market, clubs, ann] = await Promise.allSettled([
      EventsApi.list({ limit: 30 }),
      LostApi.list({ limit: 20 }),
      MarketApi.list({ limit: 20 }),
      ClubApi.list(),
      AnnouncementsApi.list(),
    ]);
    if (ann.status === 'fulfilled') {
      const list = ann.value || [];
      setNews((prev) => (prev.map((a) => a._id + a.updatedAt).join() === list.map((a) => a._id + a.updatedAt).join() ? prev : list));
    }
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
    loadedAt.current = Date.now();
  }, []);

  // Coming back to Home reuses the feed if it is under 30s old, so the
  // screen is ready instantly; pull-to-refresh always reloads.
  useFocusEffect(
    useCallback(() => {
      if (Date.now() - loadedAt.current > 30000) load();
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

  // Heart a listing straight from the rail; the wishlist picks it up.
  async function heart(post) {
    buzz(() => Haptics.selectionAsync());
    try {
      const res = await MarketApi.like(post.id);
      setFeed((prev) => prev.map((p) => (p.id === post.id ? { ...p, raw: { ...p.raw, isLiked: res.isLiked, likeCount: res.likeCount } } : p)));
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
  // Long-pressed card: everything else dims in place, the real card lifts,
  // and its menu opens beneath it. `dimOthers` drives all of it.
  const [spot, setSpot] = useState(null); // { item, frame } — frame in this screen's coordinates
  const dimOthers = useRef(new Animated.Value(0)).current;
  const [contentH, setContentH] = useState(2000);
  const litKey = useRef(null);
  // Cell wrapper: the spotlit row's cell is raised above the dim sheet (a later sibling).
  const LitCell = useCallback(
    ({ children, item, style, ...rest }) => (
      <View {...rest} style={[style, litKey.current && item && rowKey(item) === litKey.current ? { zIndex: 10 } : null]}>
        {children}
      </View>
    ),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );
  function spotlight(item, frame) {
    buzz(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    litKey.current = rowKey(item);
    rootRef.current?.measureInWindow((rx, ry) => {
      setSpot({ item, frame: { ...frame, x: frame.x - rx, y: frame.y - ry } });
      menu.setChrome(true); // tuck the bottom bar away too
      Animated.spring(dimOthers, { toValue: 1, damping: 18, stiffness: 240, mass: 0.7, useNativeDriver: true }).start();
    });
  }
  function unspotlight(after) {
    Animated.spring(dimOthers, { toValue: 0, damping: 22, stiffness: 260, mass: 0.7, overshootClamping: true, useNativeDriver: true }).start(() => {
      litKey.current = null;
      setSpot(null);
      menu.setChrome(false);
      after?.();
    });
  }
  const menu = useMenu(); // the side menu lives under the whole tab UI (see MenuHost)

  // In-place search: the pill measures itself, then the overlay glides it to the top.
  const rootRef = useRef(null);
  const pillRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFrom, setSearchFrom] = useState(null);
  function openSearch() {
    buzz(() => Haptics.selectionAsync());
    rootRef.current?.measureInWindow((rx, ry) => {
      pillRef.current?.measureInWindow((x, y, w) => {
        setSearchFrom({ y: y - ry, width: w });
        setSearchOpen(true);
      });
    });
  }

  // Scroll chrome. `scrollY` shrinks the header a little as the feed moves;
  // `hidden` (0 shown → 1 hidden) tucks the category tabs away on a downward
  // scroll and brings them back on an upward one — the bottom bar follows
  // through MenuHost's `chrome`.
  const scrollY = useRef(new Animated.Value(0)).current;
  const hidden = useRef(new Animated.Value(0)).current;
  const lastY = useRef(0);
  const isHidden = useRef(false);

  function setHidden(next) {
    if (isHidden.current === next) return;
    isHidden.current = next;
    menu.setChrome(next);
    Animated.spring(hidden, { toValue: next ? 1 : 0, damping: 22, stiffness: 220, mass: 0.7, useNativeDriver: true }).start();
  }

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: true,
    listener: (e) => {
      const y = e.nativeEvent.contentOffset.y;
      const dy = y - lastY.current;
      lastY.current = y;
      setAtTop(y <= 0);
      if (y <= 8) setHidden(false);
      else if (dy > 6) setHidden(true);
      else if (dy < -6) setHidden(false);
    },
  });

  // Header: mascot and icons are a touch bigger at the top and settle as you
  // scroll (transforms only, so it all runs on the native side).
  const iconScale = scrollY.interpolate({ inputRange: [0, 80], outputRange: [1, 0.86], extrapolate: 'clamp' });
  const tabsOpacity = hidden.interpolate({ inputRange: [0, 0.6], outputRange: [1, 0], extrapolate: 'clamp' });
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

  // The side menu's "Other feeds" pick a category from outside.
  useEffect(() => {
    const wanted = route.params?.tab;
    if (wanted && TABS.some((t) => t.key === wanted)) pickTab(wanted);
  }, [route.params?.tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // The underline is one view that springs between tabs; each tab reports its frame.
  const tabFrames = useRef({});
  const tabsScroll = useRef(null);
  const ulX = useRef(new Animated.Value(0)).current;
  const ulS = useRef(new Animated.Value(0)).current;
  const ulColor = useRef(colors.text);
  function moveUnderline(key, animated = true) {
    const f = tabFrames.current[key];
    if (!f) return;
    // Scale about the centre, so shift to where the tab's centre is.
    // The row has no padding of its own (spacer views instead), so the frame's x
    // and the underline's `left: 0` share the same origin on every platform.
    const x = f.x + (f.width - UL_BASE) / 2;
    const sx = Math.max(0.01, (f.width - 24) / UL_BASE);
    if (!animated) {
      ulX.setValue(x);
      ulS.setValue(sx);
      return;
    }
    Animated.parallel([
      Animated.spring(ulX, { toValue: x, damping: 26, stiffness: 320, mass: 0.6, useNativeDriver: true }),
      Animated.spring(ulS, { toValue: sx, damping: 26, stiffness: 320, mass: 0.6, useNativeDriver: true }),
    ]).start();
    // Keep the chosen tab in view.
    tabsScroll.current?.scrollTo({ x: Math.max(0, f.x - 60), animated: true });
  }
  function onTabLayout(key, e) {
    tabFrames.current[key] = e.nativeEvent.layout;
    if (key === tab && !ulReady.current) {
      ulReady.current = true;
      moveUnderline(key, false);
    }
  }
  const ulReady = useRef(false);

  // Switching tabs: blocks that don't belong slide out to the left; a beat
  // later they are dropped from the list under a layout spring, so the
  // blocks that stay glide up into the gaps while the new ones rise in.
  const [leaving, setLeaving] = useState(() => new Set());
  const switching = useRef(null);
  function pickTab(key) {
    if (key === tab) return;
    buzz(() => Haptics.selectionAsync());
    moveUnderline(key); // instant feedback on the native side…
    const next = new Set(visibleFor(key).map(rowKey));
    setLeaving(new Set(visible.map(rowKey).filter((k) => !next.has(k))));
    clearTimeout(switching.current);
    switching.current = setTimeout(() => {
      const node = listRef.current?.scrollToOffset ? listRef.current : listRef.current?.getNode?.();
      node?.scrollToOffset({ offset: 0, animated: false });
      LayoutAnimation.configureNext(SHIFT_UP);
      setLeaving(new Set());
      setTab(key);
    }, 150);
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
  const visibleFor = useCallback(
    (t) => {
      if (t === 'club') return gridOf(clubs);
      if (t === 'market') return gridOf(market);
      if (t !== 'all') return posts.filter((p) => p.kind === t);
      const out = [...posts];
      if (clubs.length) out.splice(Math.min(4, out.length), 0, { kind: 'rail', id: 'clubs' });
      if (market.length) out.splice(Math.min(2, out.length), 0, { kind: 'rail', id: 'market' });
      return out;
    },
    [posts, clubs, market] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const visible = useMemo(() => visibleFor(tab), [visibleFor, tab]);
  const rowKey = (p) => `${p.kind}:${p.id}`;

  const renderItem = ({ item, index }) => (
    <Enter index={index} leaving={leaving.has(rowKey(item))} dim={dimOthers} lit={spot ? spot.item.id === item.id : false}>
      {renderBlock(item)}
    </Enter>
  );

  const renderBlock = (item) => {
    if (item.kind === 'rail' && item.id === 'clubs') {
      return (
        <Rail icon={KIND.club.icon} tint={TINT.club.fg} bg={TINT.club.bg} title="Clubs for you" subtitle={`${clubs.length} clubs on campus`} onSeeAll={() => pickTab('club')}>
          {clubs.map((c) => (
            <ClubTile key={c.id} post={c} width={TILE} busy={busy === c.id} onOpen={() => open(c)} onJoin={() => join(c)} />
          ))}
        </Rail>
      );
    }
    if (item.kind === 'rail') {
      return (
        <Rail icon={KIND.market.icon} tint={TINT.market.fg} bg={TINT.market.bg} title="Fresh on Market" subtitle="Second-hand, from students" onSeeAll={() => pickTab('market')}>
          {market.map((m) => (
            <ProductCard key={m.id} post={m} width={TILE} onOpen={() => open(m)} onLike={() => heart(m)} />
          ))}
        </Rail>
      );
    }
    if (item.kind === 'grid') {
      return (
        <View style={styles.gridRow}>
          {item.items.map((c) =>
            c.kind === 'market' ? (
              <ProductCard key={c.id} post={c} width={gridTile} onOpen={() => open(c)} onLike={() => heart(c)} />
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
        onSpotlight={(frame) => spotlight(item, frame)}
      />
    );
  };

  // Banner taps: exams → past papers, hackathon → the Teams tab, else the link.
  function openAnnouncement(a) {
    if (a.tag === 'Exams') return goTab('More', { screen: 'Resources' });
    if (a.tag === 'Hackathon' && !a.link) return pickTab('event');
    if (a.link) return Linking.openURL(a.link).catch(() => {});
    if (a.tag === 'Fest') return goTab('Club');
    return pickTab('all');
  }

  // The header mascot dresses for the campus moment (from the headline announcement).
  const MOOD = { Hackathon: ['trophy', 'happy'], Fest: ['party', 'kiss'], Exams: ['study', 'glasses'], Placements: ['work', 'cool'] };
  const [mood, mascotFace] = MOOD[news[0]?.tag] || [null, undefined];
  const badgeProgress = useBadgeProgress(!!(news[0] && mood));
  const mascotX = badgeProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -BADGE_SHIFT] });

  // The mascot's idle bob. The ribbon is tied to it, so it rides and waves with him.
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);
  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [-2.5, 2.5] });

  // Search pill above the banner — jumps to the Search tab with the keyboard up.
  const Search = (
    <TouchableOpacity ref={pillRef} style={[styles.search, searchOpen && { opacity: 0 }]} activeOpacity={0.8} onPress={openSearch}>
      <Ionicons name="search" size={17} color={colors.textFaint} />
      <Text style={styles.searchText}>Search</Text>
    </TouchableOpacity>
  );

  const Compose = (
    <TouchableOpacity style={[styles.card, styles.compose]} activeOpacity={0.8} onPress={() => navigation.getParent()?.getParent()?.navigate('Compose')}>
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
      <TouchableOpacity style={[styles.headerSide, { alignItems: 'flex-start' }]} onPress={menu.open} hitSlop={8}>
        <Animated.View style={[styles.burger, { transform: [{ scale: iconScale }] }]}>
          <View style={[styles.burgerLine, { width: 24 }]} />
          <View style={[styles.burgerLine, { width: 15 }]} />
        </Animated.View>
      </TouchableOpacity>
      <View style={{ width: 30, height: 36 }} />
      {news[0] && mood ? <HeaderBadge item={news[0]} onPress={() => openAnnouncement(news[0])} styles={styles} progress={badgeProgress} bob={bob} /> : null}
      <TouchableOpacity style={styles.headerSide} onPress={() => goTab('Post', { screen: 'ChatList' })} hitSlop={8}>
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          {/* Soft rounded bubble — thin stroke, round corners, a small tail; nothing inside */}
          <Svg width={26} height={26} viewBox="0 0 24 24">
            <Path
              d="M7.5 4.5h9A4.5 4.5 0 0 1 21 9v4a4.5 4.5 0 0 1-4.5 4.5H11l-4.2 3.1a.6.6 0 0 1-1-.5V17A4.5 4.5 0 0 1 3 13V9a4.5 4.5 0 0 1 4.5-4.5Z"
              stroke={colors.text}
              strokeWidth={1.7}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
      </TouchableOpacity>
      <DimLayer dim={dimOthers} />
    </View>
  );

  // Tabs move down with the list when you pull, and fold away on a downward scroll
  const Tabs = (
    <Animated.View style={{ backgroundColor: colors.surface, height: TABS_H, opacity: tabsOpacity }}>
      {/* Thin underline tabs */}
      <ScrollView ref={tabsScroll} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.tabsWrap}>
        <View style={{ width: 8 }} />
        {TABS.map((t) => (
          <TabChip
            key={t.key}
            active={tab === t.key}
            tint={TINT[t.key]?.fg || colors.text}
            icon={t.icon}
            label={t.label}
            onPress={() => pickTab(t.key)}
            onLayout={(e) => onTabLayout(t.key, e)}
            styles={styles}
            colors={colors}
          />
        ))}
        <View style={{ width: 8 }} />
        {/* The sliding underline */}
        <Animated.View pointerEvents="none" style={[styles.tabLine, { backgroundColor: TINT[tab]?.fg || colors.text, transform: [{ translateX: ulX }, { scaleX: ulS }] }]} />
      </ScrollView>
      <DimLayer dim={dimOthers} />
    </Animated.View>
  );

  return (
    <SafeAreaView ref={rootRef} style={styles.safe} edges={['top']}>
      <PullToRefresh header={Header} top={Tabs} atTop={atTop} onRefresh={load} ghostSize={34} ghostTop={8} ghostScale={iconScale} topHidden={hidden} topHeight={TABS_H} mood={mood} variant={mascotFace} ghostShiftX={mascotX} ghostBobY={bobY}>
      {loading ? (
        <Skeleton />
      ) : (
        <FlatList
          ref={listRef}
          data={visible}
          keyExtractor={rowKey}
          renderItem={renderItem}
          ItemSeparatorComponent={() => (tab === 'club' || tab === 'market' ? null : <View style={styles.gap} />)}
          ListHeaderComponent={
            <View>
              {Search}
              {tab === 'all' ? <AnnouncementBanner items={news} onPress={openAnnouncement} /> : null}
              {Compose}
            </View>
          }
          ListEmptyComponent={Empty}
          ListFooterComponent={
            <Animated.View
              pointerEvents="none"
              style={{ position: 'absolute', left: 0, right: 0, top: -contentH, height: contentH + 600, backgroundColor: '#000', opacity: Animated.multiply(dimOthers, 0.55) }}
            />
          }
          onContentSizeChange={(w, h) => setContentH(h)}
          CellRendererComponent={LitCell}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          onScroll={onScroll}
          scrollEventThrottle={16}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews={false}
        />
      )}
      </PullToRefresh>

      {spot ? <SpotMenu frame={spot.frame} items={menuFor(spot.item)} progress={dimOthers} onClose={unspotlight} /> : null}

      <SearchOverlay open={searchOpen} from={searchFrom} onClose={() => setSearchOpen(false)} goTab={goTab} />

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
  const styles = useStyles(makeStyles);
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

const makeStyles = (colors, isDark) => {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerSide: { width: 32, alignItems: 'flex-end' },
  // Clipped at the mascot's centre so the pill appears from behind it.
  // The clip travels left with the mascot (BADGE_SHIFT), so its right edge is set
  // that much further out — otherwise it would cut off the ribbon's tail.
  badgeClip: { position: 'absolute', left: '50%', right: 40 - BADGE_SHIFT, top: 0, bottom: 0, overflow: 'hidden', justifyContent: 'center' },
  // Swallowtail ribbon: the SVG gives the shape; the gradient is masked to it by clipping the right notch.
  ribbon: { width: RIBBON_W, height: RIBBON_H + 12, marginVertical: -6, flexDirection: 'row', alignItems: 'center' },
  strip: { height: RIBBON_H, overflow: 'hidden' },
  ribbonRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 12, paddingRight: 24 },
  badgeText: { fontSize: 12.5, fontWeight: '800', color: '#3A1D05', letterSpacing: 0.2 },
  badgeSub: { fontSize: 11.5, fontWeight: '700', color: 'rgba(58,29,5,0.7)' },
  popper: { position: 'absolute', left: '50%', top: '50%', marginLeft: 22 },
  // Two rounded bars, the lower one shorter — the Threads-style menu glyph.
  burger: { paddingVertical: 8, gap: 6, alignItems: 'flex-start' },
  burgerLine: { height: 2.5, borderRadius: 2, backgroundColor: colors.text },

  tabsWrap: { flexGrow: 0, height: TABS_H, borderBottomWidth: HAIRLINE, borderBottomColor: colors.border },
  tabs: { paddingHorizontal: 0 },
  tab: { paddingHorizontal: 12, paddingTop: 10, height: TABS_H - HAIRLINE },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingBottom: 10 },
  tabText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  tabLine: { position: 'absolute', left: 0, bottom: 0, width: UL_BASE, height: 2.5, borderRadius: 2 },

  list: { paddingBottom: layout.tabBarSpace + 16, backgroundColor: colors.bg, flexGrow: 1 },
  hairline: { height: HAIRLINE, backgroundColor: colors.border },
  gap: { height: 10 },
  // Every feed block is a white card on the pale canvas.
  card: { marginHorizontal: 12, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border },

  // Threads-style: a plain rounded pill, no border, quiet placeholder.
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, paddingHorizontal: 14, height: 40, borderRadius: 999, backgroundColor: colors.surfaceMuted },
  searchText: { flex: 1, fontSize: 15, color: colors.textFaint },
  compose: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, marginTop: 8, marginBottom: 10 },
  composeText: { flex: 1, fontSize: 15, color: colors.textMuted },
  composeBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  composeBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.text },

  post: { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12, marginHorizontal: 12, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  gutter: { width: 40, alignItems: 'center', marginRight: 12 },
  rail: { marginHorizontal: 12, paddingVertical: 14, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  railHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginBottom: 12 },
  railIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  railTitle: { fontSize: 15.5, fontWeight: '700', color: colors.text },
  railSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  railLink: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: 10, paddingRight: 7, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.surfaceMuted },
  railLinkText: { fontSize: 12.5, fontWeight: '700', color: colors.text },
  railScroll: { paddingHorizontal: 14, gap: GRID_GAP },
  gridRow: { flexDirection: 'row', gap: GRID_GAP, paddingHorizontal: 12, paddingTop: GRID_GAP },

  // Product card
  product: { borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  productMedia: { width: '100%', backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  productPrice: { position: 'absolute', left: 8, bottom: 8, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.surface, ...shadow.soft },
  productPriceText: { fontSize: 13.5, fontWeight: '800', color: colors.text },
  productHeart: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  soldTag: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.text },
  soldText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: colors.surface },
  productBody: { padding: 10, gap: 6 },
  productTitle: { fontSize: 13.5, fontWeight: '600', color: colors.text, lineHeight: 18, height: 36 },
  productMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  condChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.surfaceMuted },
  condText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  productSeller: { flex: 1, fontSize: 11.5, color: colors.textMuted },

  // Club tile
  tile: { borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  tileBand: { height: 58, overflow: 'hidden' },
  tileBlob: { position: 'absolute', width: 90, height: 90, borderRadius: 45, right: -30, top: -45, opacity: 0.16 },
  tileTag: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  tileTagText: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.3 },
  tileLogo: { marginTop: -24, marginLeft: 10, width: 50, height: 50, borderRadius: 25, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.surface, ...shadow.soft },
  tileLogoImg: { width: 44, height: 44, borderRadius: 22 },
  tileBody: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 10, gap: 4 },
  tileName: { fontSize: 14, fontWeight: '700', color: colors.text },
  tileMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  tileMeta: { fontSize: 12, color: colors.textMuted },
  joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 999, paddingVertical: 7 },
  joinBtnGo: { backgroundColor: colors.primary },
  joinBtnDone: { backgroundColor: colors.surfaceMuted, borderWidth: HAIRLINE, borderColor: colors.border },
  joinText: { fontSize: 13, fontWeight: '700' },
  kindDot: { position: 'absolute', right: -3, bottom: -3, width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  thread: { flex: 1, width: 2, borderRadius: 1, backgroundColor: colors.border, marginTop: 8, marginBottom: -4 },
  content: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: colors.text, flexShrink: 1 },
  who: { flex: 1, fontSize: 12, lineHeight: 20, color: colors.textFaint, marginLeft: -2, includeFontPadding: false },
  time: { fontSize: 12.5, lineHeight: 20, color: colors.textFaint, includeFontPadding: false },
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
  roster: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  seats: { flexDirection: 'row', alignItems: 'center' },
  seat: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.surface, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  seatFilled: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  seatOpen: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.mediaStroke },
  rosterText: { flex: 1, fontSize: 13, color: colors.textMuted },
  stripItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stripText: { fontSize: 12.5, color: colors.textMuted },
  stripStrong: { fontWeight: '700', color: colors.text },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Lost & Found (plain post, photo detached from the text)
  plain: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12, marginHorizontal: 12, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  plainHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  plainTitle: { fontSize: 16.5, fontWeight: '700', color: colors.text, lineHeight: 22 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  statusText: { fontSize: 14, color: colors.text },
  resolved: { fontSize: 12, fontWeight: '700', color: colors.success },
  photo: { width: '100%', height: 220, borderRadius: 14, marginBottom: 12, backgroundColor: colors.surfaceMuted },
  photoEmpty: { width: '100%', height: 100, borderRadius: 14, marginBottom: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 14 },
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
};
