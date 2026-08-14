import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { colors } from '../theme';

/** Initials avatar. `bg` / `textColor` override the default green tint. */
export default function Avatar({ name, size = 38, badge, style, bg, textColor }) {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const fontSize = Math.round(size * 0.34);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }, bg && { backgroundColor: bg }]}>
        <Text style={[styles.text, { fontSize }, textColor && { color: textColor }]}>{initials}</Text>
      </View>
      {badge === 'check' ? (
        <View style={styles.badgeGreen}>
          <Icon name="check" size={9} color={colors.onPrimary} strokeWidth={4} />
        </View>
      ) : null}
      {badge === 'hand' ? (
        <View style={styles.badgeGreen}>
          <Icon name="hand" size={10} color={colors.onPrimary} strokeWidth={2.4} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: colors.avatarText, fontWeight: '700' },
  badgeGreen: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
