import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { GhostMark } from './Mascot';
import Avatar from './Avatar';
import { imageUrl } from '../api/lostfound';
import { useAuth } from '../context/AuthContext';
import { ScoreApi } from '../api/score';
import { ClubApi } from '../api/clubs';
import { MarketApi } from '../api/market';
import { useTheme, useStyles } from '../context/ThemeContext';

/**
 * The menu that lives *under* the app: the whole screen slides to the right
 * and this panel is revealed beneath it (see MenuHost). Threads-style —
 * one big title, sectioned lists with plain icons. Always mounted at the
 * left edge; `visible` fades the rows in with a little parallax and
 * refreshes the counts.
 */
export default function SideMenu({ visible, width, onClose, onNavigate }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const reveal = useRef(new Animated.Value(0)).current;
  const [counts, setCounts] = useState({ score: null, clubs: null, wishlist: null, orders: null });
  const [myClubs, setMyClubs] = useState([]);

  useEffect(() => {
    Animated.spring(reveal, { toValue: visible ? 1 : 0, damping: 24, stiffness: 190, mass: 0.9, overshootClamping: true, useNativeDriver: true }).start();
    if (!visible) return;
    // Refresh the little numbers every time the menu opens.
    Promise.allSettled([ScoreApi.me(), ClubApi.mine(), MarketApi.myWishlist(), MarketApi.myOrders()]).then(([s, c, w, o]) =>
      {
        setCounts({
          score: s.status === 'fulfilled' ? s.value.total : null,
          clubs: c.status === 'fulfilled' ? c.value.length : null,
          wishlist: w.status === 'fulfilled' ? w.value.length : null,
          orders: o.status === 'fulfilled' ? o.value.length : null,
        });
        if (c.status === 'fulfilled') setMyClubs(c.value);
      }
    );
  }, [visible, reveal]);

  const n = (v, one, many) => (v == null ? '' : `${v} ${v === 1 ? one : many}`);
  const SECTIONS = [
    {
      title: 'Mine',
      seeAll: { tab: 'More' },
      rows: [
        { key: 'score', icon: 'trophy-outline', label: 'Campus score', hint: counts.score == null ? '' : `${counts.score} pts`, tab: 'More', to: { screen: 'CampusScore' } },
        { key: 'wishlist', icon: 'heart-outline', label: 'My wishlist', hint: n(counts.wishlist, 'item', 'items'), tab: 'Sell', to: { screen: 'Wishlist' } },
        { key: 'orders', icon: 'bag-handle-outline', label: 'My orders', hint: n(counts.orders, 'order', 'orders'), tab: 'Sell', to: { screen: 'MyOrders' } },
      ],
    },
    {
      title: 'Other feeds',
      seeAll: { tab: 'Home', to: { screen: 'HomeDash', params: { tab: 'all' } } },
      rows: [
        { key: 'teams', icon: 'people-circle-outline', label: 'Teams', tab: 'Home', to: { screen: 'HomeDash', params: { tab: 'event' } } },
        { key: 'lost', icon: 'search-outline', label: 'Lost & Found', tab: 'Home', to: { screen: 'HomeDash', params: { tab: 'lost' } } },
        { key: 'market', icon: 'pricetag-outline', label: 'Market', tab: 'Home', to: { screen: 'HomeDash', params: { tab: 'market' } } },
        { key: 'papers', icon: 'document-text-outline', label: 'Papers & notes', tab: 'More', to: { screen: 'Resources' } },
        { key: 'map', icon: 'map-outline', label: '3D campus map', tab: 'Map' },
      ],
    },
  ];

  function go(item) {
    onClose();
    onNavigate(item.tab, item.to);
  }

  // Rows drift in from the left as the screen slides away.
  const translateX = reveal.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] });

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.panel, { width, paddingTop: insets.top + 8, opacity: reveal, transform: [{ translateX }] }]}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Campus</Text>
          <GhostMark width={26} color={colors.primary} bg={colors.surface} variant="happy" />
        </View>
        <Text style={styles.who} numberOfLines={1}>
          {user?.name}{user?.branch ? ` · ${user.branch}` : ''}{user?.semester ? ` · Sem ${user.semester}` : ''}
        </Text>

        {/* Clubs the student has joined — like "Communities" in Threads */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Your clubs</Text>
            <TouchableOpacity onPress={() => go({ tab: 'Club' })} hitSlop={8}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {myClubs.length ? (
            myClubs.slice(0, 5).map((c) => {
              const uri = imageUrl(c.image);
              return (
                <TouchableOpacity key={c._id} style={styles.row} onPress={() => go({ tab: 'Club', to: { screen: 'ClubDetail', params: { id: c._id } } })} activeOpacity={0.6}>
                  {uri ? <Image source={{ uri }} style={styles.clubLogo} /> : <Avatar name={c.name} size={32} style={styles.rowIcon} />}
                  <Text style={styles.rowLabel} numberOfLines={1}>{c.name}</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <TouchableOpacity style={styles.row} onPress={() => go({ tab: 'Club' })} activeOpacity={0.6}>
              <Ionicons name="add-circle-outline" size={28} color={colors.textMuted} style={styles.rowIcon} />
              <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Join a club</Text>
            </TouchableOpacity>
          )}
        </View>

        {SECTIONS.map((sec) => (
          <View key={sec.title} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
              <TouchableOpacity onPress={() => go(sec.seeAll)} hitSlop={8}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {sec.rows.map((it) => (
              <TouchableOpacity key={it.key} style={styles.row} onPress={() => go(it)} activeOpacity={0.6}>
                <Ionicons name={it.icon} size={28} color={colors.text} style={styles.rowIcon} />
                <Text style={styles.rowLabel} numberOfLines={1}>{it.label}</Text>
                {it.hint ? <Text style={styles.rowHint}>{it.hint}</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    panel: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: colors.surface },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingTop: 14 },
    title: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    who: { fontSize: 13, color: colors.textMuted, paddingHorizontal: 24, marginTop: 2 },
    section: { marginTop: 26 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 6 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
    seeAll: { fontSize: 14, color: colors.textFaint },
    row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingVertical: 15 },
    rowIcon: { width: 32, textAlign: 'center' },
    clubLogo: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.surfaceMuted },
    rowLabel: { flex: 1, fontSize: 18, fontWeight: '600', color: colors.text },
    rowHint: { fontSize: 13, color: colors.textFaint },
  });
