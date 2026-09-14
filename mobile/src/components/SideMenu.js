import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Modal, Pressable, Animated, Easing, TouchableOpacity, useWindowDimensions } from 'react-native';
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
 * Drawer that slides in from the left edge of Home: the student's shortcuts
 * (campus score, enrolled clubs, wishlist, orders). Each row shows a small
 * live count so the menu is useful at a glance.
 */
export default function SideMenu({ visible, onClose, onNavigate }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const panelWidth = Math.min(300, Math.round(width * 0.8));
  const x = useRef(new Animated.Value(-panelWidth)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const [counts, setCounts] = useState({ score: null, clubs: null, wishlist: null, orders: null });

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(x, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
      // Refresh the little numbers every time the drawer opens.
      Promise.allSettled([ScoreApi.me(), ClubApi.mine(), MarketApi.myWishlist(), MarketApi.myOrders()]).then(([s, c, w, o]) =>
        setCounts({
          score: s.status === 'fulfilled' ? s.value.total : null,
          clubs: c.status === 'fulfilled' ? c.value.length : null,
          wishlist: w.status === 'fulfilled' ? w.value.length : null,
          orders: o.status === 'fulfilled' ? o.value.length : null,
        })
      );
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(x, { toValue: -panelWidth, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible, panelWidth, x, fade, mounted]);

  if (!mounted) return null;

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

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.panel, { width: panelWidth, paddingTop: insets.top + 18, paddingBottom: insets.bottom + 18, transform: [{ translateX: x }] }]}>
        <View style={styles.who}>
          <Avatar name={user?.name} size={48} />
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
    </Modal>
  );
}

const makeStyles = (colors, isDark) => {
  return StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(22,36,28,0.35)' },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#173A26',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
  },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  list: { paddingTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  iconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  rowHint: { fontSize: 12.5, color: colors.textMuted, marginRight: 2 },
  foot: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10 },
  footText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
});
};
