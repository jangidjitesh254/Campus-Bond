import React from 'react';
import { StyleSheet, Pressable, Animated, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme, useStyles } from '../context/ThemeContext';
import { shadow } from '../theme';

const MENU_W = 220;
const ROW_H = 46;

/**
 * Dims whatever it sits on. Drop one inside any block; drive `dim` 0→1 and
 * the block darkens. The spotlit block simply doesn't get one (or gets
 * `lit`), so it stays bright while everything around it goes dark — no
 * overlay above the list, no clone, no modal: the real block is the one
 * that lifts.
 */
export function DimLayer({ dim, lit }) {
  if (lit) return null;
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: Animated.multiply(dim, 0.55) }]} />;
}

/**
 * The menu for a spotlit block: sits right under it (above it when there
 * is no room), scaling in from that edge. `frame` is the block's frame in
 * the host's coordinates. Tapping anywhere else closes.
 */
export function SpotMenu({ frame, items, progress, onClose }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { height: H, width: W } = useWindowDimensions();
  const list = (items || []).filter(Boolean);
  if (!frame) return null;

  const menuH = list.length * ROW_H + 12;
  const gap = 8;
  let top = frame.y + frame.height + gap;
  let above = false;
  if (top + menuH > H - 24 && frame.y - gap - menuH > 8) {
    above = true;
    top = frame.y - gap - menuH;
  }
  const left = Math.max(12, Math.min(frame.x + frame.width - MENU_W, W - MENU_W - 12));
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const shift = progress.interpolate({ inputRange: [0, 1], outputRange: [(above ? 1 : -1) * 16, 0] });

  return (
    <>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => onClose()} />
      <Animated.View style={[styles.menu, { top, left, opacity: progress, transform: [{ translateY: shift }, { scale }] }]}>
        {list.map((it, i) => (
          <TouchableOpacity
            key={it.label}
            style={[styles.item, i > 0 && styles.itemBorder, it.disabled && { opacity: 0.4 }]}
            onPress={() => onClose(it.onPress)}
            disabled={it.disabled}
            activeOpacity={0.6}
          >
            <Text style={[styles.itemText, it.destructive && { color: colors.danger }]}>{it.label}</Text>
            {it.icon ? <Ionicons name={it.icon} size={19} color={it.destructive ? colors.danger : colors.text} /> : null}
          </TouchableOpacity>
        ))}
      </Animated.View>
    </>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    menu: { position: 'absolute', width: MENU_W, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.surface, ...shadow.card, shadowOpacity: 0.2, shadowRadius: 18, elevation: 10 },
    item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: ROW_H },
    itemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    itemText: { fontSize: 15.5, color: colors.text, fontWeight: '500' },
  });
