import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Modal, Pressable, Animated, Easing, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { shadow } from '../theme';
import { useTheme, useStyles } from '../context/ThemeContext';

const WIDTH = 220;

/**
 * "⋯" button that pops a context menu anchored to itself — springs out of
 * the top-right corner like the ChatGPT mobile menu, and shrinks back on close.
 *
 *   <DotsMenu items={[{ label: 'Share', icon: 'paper-plane-outline', onPress }]} />
 *
 * Items: { label, icon, onPress, destructive?, disabled? }. Falsy entries are skipped.
 */
const DotsMenu = forwardRef(function DotsMenu({ items, size = 20, color, style, children, align = 'right' }, ref) {
  const { t: colors } = useTheme();
  const tint = color || colors.textMuted;
  const styles = useStyles(makeStyles);
  const btn = useRef(null);
  const [anchor, setAnchor] = useState(null); // { x, y, w, h } in window coords
  const [mounted, setMounted] = useState(false);
  const t = useRef(new Animated.Value(0)).current;
  const { width: W, height: H } = useWindowDimensions();

  const list = (items || []).filter(Boolean);

  function open() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    btn.current?.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y, w, h });
      setMounted(true);
    });
  }

  // Lets a parent open the menu too, e.g. on a long-press of the whole card.
  useImperativeHandle(ref, () => ({ open }), []); // eslint-disable-line react-hooks/exhaustive-deps

  function close(after) {
    Animated.timing(t, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      setMounted(false);
      after?.();
    });
  }

  useEffect(() => {
    if (!mounted) return;
    t.setValue(0);
    Animated.spring(t, { toValue: 1, friction: 7, tension: 110, useNativeDriver: true }).start();
  }, [mounted, t]);

  // Menu sits under the button, right edges aligned; flips above if it would run off the bottom.
  const menuH = list.length * 46 + 12;
  const top = anchor ? (anchor.y + anchor.h + 6 + menuH > H - 24 ? anchor.y - 6 - menuH : anchor.y + anchor.h + 6) : 0;
  const left = anchor ? Math.max(12, Math.min(align === 'left' ? anchor.x : anchor.x + anchor.w - WIDTH, W - WIDTH - 12)) : 0;
  const fromAbove = anchor ? top < anchor.y : false;

  // Scale from the corner nearest the button: shift while scaling so the corner stays put.
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [(align === 'left' ? -1 : 1) * WIDTH * 0.25, 0] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [(fromAbove ? 1 : -1) * menuH * 0.25, 0] });

  return (
    <>
      <TouchableOpacity ref={btn} onPress={open} hitSlop={10} style={style} activeOpacity={0.6}>
        {children || <Ionicons name="ellipsis-horizontal" size={size} color={tint} />}
      </TouchableOpacity>

      <Modal visible={mounted} transparent animationType="none" onRequestClose={() => close()} statusBarTranslucent>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: t }]} />
        </Pressable>

        <Animated.View style={[styles.menu, { top, left, opacity: t, transform: [{ translateX }, { translateY }, { scale }] }]}>
          {list.map((it, i) => (
            <TouchableOpacity
              key={it.label}
              style={[styles.item, i > 0 && styles.itemBorder, it.disabled && { opacity: 0.4 }]}
              onPress={() => close(it.onPress)}
              disabled={it.disabled}
              activeOpacity={0.6}
            >
              <Text style={[styles.itemText, it.destructive && { color: colors.danger }]}>{it.label}</Text>
              {it.selected ? <Ionicons name="checkmark" size={19} color={colors.primary} /> : it.icon ? <Ionicons name={it.icon} size={19} color={it.destructive ? colors.danger : colors.text} /> : null}
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Modal>
    </>
  );
});

export default DotsMenu;

const makeStyles = (colors, isDark) => {
  return StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(22,36,28,0.18)' },
  menu: { position: 'absolute', width: WIDTH, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.surface, ...shadow.card, shadowOpacity: 0.16, shadowRadius: 18, elevation: 8 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 46 },
  itemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  itemText: { fontSize: 15.5, color: colors.text, fontWeight: '500' },
});
};
