import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, Pressable, Animated, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme, useStyles } from '../context/ThemeContext';
import { shadow } from '../theme';

const MENU_W = 220;
const ROW_H = 46;

/**
 * Instagram-style long-press: the screen dims, the pressed card stays lit
 * in exactly the same place (a clone drawn above the dim), and the menu
 * opens right under it — or above it when there is no room — so the card
 * stays readable while the menu is open.
 *
 *   <Spotlight frame={{ x, y, width, height }} items={menu} onClose={…}>
 *     {cardClone}
 *   </Spotlight>
 *
 * `frame` is the card's own frame in window coordinates; `inset` is how
 * much horizontal margin the card carries outside that frame.
 */
export default function Spotlight({ frame, inset = 12, items, onClose, children }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { height: H, width: W } = useWindowDimensions();
  const t = useRef(new Animated.Value(0)).current;
  const list = (items || []).filter(Boolean);

  useEffect(() => {
    t.setValue(0);
    Animated.spring(t, { toValue: 1, damping: 20, stiffness: 260, mass: 0.7, useNativeDriver: true }).start();
  }, [t]);

  function close(after) {
    Animated.timing(t, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      onClose();
      after?.();
    });
  }

  if (!frame) return null;
  const menuH = list.length * ROW_H + 12;
  const gap = 8;
  // Keep the card where it was if the menu fits below it; otherwise put the
  // menu above; if the card itself is too tall for either, slide it up.
  let cardTop = frame.y;
  let menuTop = frame.y + frame.height + gap;
  let above = false;
  if (menuTop + menuH > H - 24) {
    if (frame.y - gap - menuH > 24) {
      above = true;
      menuTop = frame.y - gap - menuH;
    } else {
      cardTop = Math.max(24, H - 24 - menuH - gap - frame.height);
      menuTop = cardTop + frame.height + gap;
    }
  }
  const menuLeft = Math.max(12, Math.min(frame.x + frame.width - MENU_W, W - MENU_W - 12));
  const lift = t.interpolate({ inputRange: [0, 1], outputRange: [frame.y - cardTop, 0] });
  const menuScale = t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const menuShift = t.interpolate({ inputRange: [0, 1], outputRange: [(above ? 1 : -1) * 16, 0] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={() => close()} statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => close()}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.dim, { opacity: t }]} />
      </Pressable>

      {/* The lit card — a clone, not interactive */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: frame.x - inset, top: cardTop, width: frame.width + inset * 2, transform: [{ translateY: lift }] }}>
        {children}
      </Animated.View>

      <Animated.View style={[styles.menu, { top: menuTop, left: menuLeft, opacity: t, transform: [{ translateY: menuShift }, { scale: menuScale }] }]}>
        {list.map((it, i) => (
          <TouchableOpacity
            key={it.label}
            style={[styles.item, i > 0 && styles.itemBorder, it.disabled && { opacity: 0.4 }]}
            onPress={() => close(it.onPress)}
            disabled={it.disabled}
            activeOpacity={0.6}
          >
            <Text style={[styles.itemText, it.destructive && { color: colors.danger }]}>{it.label}</Text>
            {it.icon ? <Ionicons name={it.icon} size={19} color={it.destructive ? colors.danger : colors.text} /> : null}
          </TouchableOpacity>
        ))}
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    dim: { backgroundColor: 'rgba(0,0,0,0.55)' },
    menu: { position: 'absolute', width: MENU_W, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.surface, ...shadow.card, shadowOpacity: 0.2, shadowRadius: 18, elevation: 10 },
    item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: ROW_H },
    itemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    itemText: { fontSize: 15.5, color: colors.text, fontWeight: '500' },
  });
