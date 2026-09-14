import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import Avatar from './Avatar';
import { Ghost } from './Mascot';
import { useAuth } from '../context/AuthContext';
import { ScoreApi } from '../api/score';
import { ClubApi } from '../api/clubs';
import { MarketApi } from '../api/market';
import { useTheme, useStyles } from '../context/ThemeContext';

/**
 * The menu that lives *under* Home: the screen slides to the right and this
 * panel is revealed beneath it (see HomeScreen). It is always mounted at
 * the left edge; `visible` fades its rows in with a little parallax and
 * refreshes the counts.
 */
export default function SideMenu({ visible, width, onClose, onNavigate }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const reveal = useRef(new Animated.Value(0)).current;
  const [counts, setCounts] = useState({ score: null, clubs: null, wishlist: null, orders: null });

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: visible ? 1 : 0,
      duration: visible ? 320 : 200,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
    if (!visible) return;
    // Refresh the little numbers every time the drawer opens.
    Promise.allSettled([ScoreApi.me(), ClubApi.mine(), MarketApi.myWishlist(), MarketApi.myOrders()]).then(([s, c, w, o]) =>
      setCounts({
        score: s.status === 'fulfilled' ? s.value.total : null,
        clubs: c.status === 'fulfilled' ? c.value.length : null,
        wishlist: w.status === 'fulfilled' ? w.value.length : null,
        orders: o.status === 'fulfilled' ? o.value.length : null,
      })
    );
  }, [visible, reveal]);

  const hint = (n, one, many) => (n == null ? '' : `${n} ${n === 1 ? one : many}`);
  const ITEMS = [
    { key: 'score', icon: 'trophy-outline', label: 'Campus score', hint: counts.score == null ? '' : `${counts.score} pts`, tab: 'More', to: { screen: 'CampusScore' } },
    { key: 'clubs', icon: 'people-outline', label: 'Enrolled clubs', hint: hint(counts.clubs, 'club', 'clubs'), tab: 'Club' },
    { key: 'wishlist', icon: 'heart-outline', label: 'My wishlist', hint: hint(counts.wishlist, 'item', 'items'), tab: 'Sell', to: { screen: 'Wishlist' } },
    { key: 'orders', icon: 'bag-handle-outline', label: 'My orders', hint: hint(counts.orders, 'order', 'orders'), tab: 'Sell', to: { screen: 'MyOrders' } },
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
      style={[styles.panel, { width, paddingTop: insets.top + 22, paddingBottom: insets.bottom + 22, opacity: reveal, transform: [{ translateX }] }]}
    >
      <View style={styles.who}>
        <Avatar name={user?.name} size={52} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>{user?.name}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {user?.branch ? `${user.branch}${user.semester ? ` · Sem ${user.semester}` : ''}` : user?.email}
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {ITEMS.map((it) => (
          <TouchableOpacity key={it.key} style={styles.row} onPress={() => go(it)} activeOpacity={0.7}>
            <View style={styles.iconWrap}>
              <Ionicons name={it.icon} size={20} color={colors.text} />
            </View>
            <Text style={styles.rowLabel}>{it.label}</Text>
            {it.hint ? <Text style={styles.rowHint}>{it.hint}</Text> : null}
            <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.foot}>
        <Ghost width={34} variant="happy" />
        <Text style={styles.footText}>Campus Bond</Text>
      </View>
    </Animated.View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    panel: { position: 'absolute', top: 0, bottom: 0, left: 0, paddingHorizontal: 20 },
    who: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    name: { fontSize: 17, fontWeight: '700', color: colors.text },
    meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    list: { paddingTop: 12 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
    iconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { flex: 1, fontSize: 15.5, fontWeight: '600', color: colors.text },
    rowHint: { fontSize: 12.5, color: colors.textMuted, marginRight: 2 },
    foot: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10 },
    footText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  });
