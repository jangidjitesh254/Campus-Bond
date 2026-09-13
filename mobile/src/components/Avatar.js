import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';
import { gradients } from '../theme';

/**
 * Initials avatar. Default is the violet tint; `gradient` is the purple
 * gradient the design uses for the signed-in student; `neutral` is the
 * quiet grey used for other people in lists; `bg` / `textColor` override.
 */
export default function Avatar({ name, size = 38, badge, style, bg, textColor, gradient, neutral }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const initials = (name || '?')
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const fontSize = Math.round(size * 0.36);
  const round = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[{ width: size, height: size }, style]}>
      {gradient ? (
        <LinearGradient colors={gradients.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.circle, round]}>
          <Text style={[styles.text, { fontSize, color: '#FFFFFF' }]}>{initials}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.circle, round, neutral && { backgroundColor: t.avatarNeutral }, bg && { backgroundColor: bg }]}>
          <Text style={[styles.text, { fontSize }, neutral && { color: t.textMuted }, textColor && { color: textColor }]}>{initials}</Text>
        </View>
      )}
      {badge === 'check' ? (
        <View style={styles.badge}>
          <Icon name="check" size={9} color="#FFFFFF" strokeWidth={4} />
        </View>
      ) : null}
      {badge === 'hand' ? (
        <View style={styles.badge}>
          <Icon name="hand" size={10} color="#FFFFFF" strokeWidth={2.4} />
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    circle: { backgroundColor: t.avatarBg, alignItems: 'center', justifyContent: 'center' },
    text: { color: t.avatarText, fontWeight: '800' },
    badge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: t.accentFill,
      borderWidth: 2,
      borderColor: t.page,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
