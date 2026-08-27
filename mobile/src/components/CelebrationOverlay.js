import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, shadow } from '../theme';

const { width } = Dimensions.get('window');
// Literals only — this runs at module load, before any theme exists.
const CONFETTI_COLORS = ['#3F7A5E', '#33708F', '#A9603A', '#6B5B7B', '#8A5A6B', '#4A5A73'];

/**
 * A one-second celebration burst shown after a delightful action
 * (e.g. sending an interest request). Purely decorative — pass `visible`
 * and it calls `onDone` when the animation finishes.
 */
export default function CelebrationOverlay({ visible, onDone, message = 'Interest sent! 🎉', subtitle = 'We messaged the poster for you' }) {
  const { t, kinds, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  // Fixed set of confetti pieces, re-animated each time.
  const pieces = useRef(
    Array.from({ length: 16 }).map((_, i) => ({
      startX: (i / 16) * width,
      drift: (Math.random() - 0.5) * 120,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 8 + Math.round(Math.random() * 8),
      delay: Math.round(Math.random() * 150),
      fall: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;

    scale.setValue(0);
    opacity.setValue(0);
    pieces.forEach((p) => p.fall.setValue(0));

    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ...pieces.map((p) =>
        Animated.timing(p.fall, {
          toValue: 1,
          duration: 1100,
          delay: p.delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      ),
    ]).start();

    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => onDone && onDone());
    }, 1000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {pieces.map((p, i) => {
        const translateY = p.fall.interpolate({ inputRange: [0, 1], outputRange: [-40, 520] });
        const translateX = p.fall.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] });
        const rotate = p.fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] });
        const pieceOpacity = p.fall.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View
            key={i}
            style={[
              styles.piece,
              {
                left: p.startX,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: i % 2 ? p.size / 2 : 2,
                opacity: pieceOpacity,
                transform: [{ translateY }, { translateX }, { rotate }],
              },
            ]}
          />
        );
      })}

      <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>{message}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </Animated.View>
    </View>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    piece: { position: 'absolute', top: 0 },
    card: {
      backgroundColor: t.surface,
      borderRadius: radius.xl,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.xxl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: t.border,
      ...shadow.card,
    },
    emoji: { fontSize: 52, marginBottom: spacing.sm },
    title: { fontSize: 18, fontWeight: '900', color: t.text },
    sub: { fontSize: 13, color: t.textMuted, marginTop: 4 },
    });
  }
