import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

/**
 * Circular progress ring for the campus score.
 * `value` is the current score, `target` the score needed for a full ring.
 */
export default function ScoreRing({ value = 0, target = 100, size = 108, stroke = 10 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, target > 0 ? value / target : 0));
  // Keep a small visible arc even at 0 so the ring reads as "just getting started".
  const shown = Math.max(pct, 0.06);
  const dash = circumference * shown;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surfaceHi} strokeWidth={stroke} fill="none" />
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Center label */}
      <View style={styles.center}>
        <Text style={styles.value}>{value}</Text>
      </View>

      {/* Trophy badge */}
      <View style={styles.badge}>
        <Ionicons name="trophy" size={13} color={colors.onPrimary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 34, fontWeight: '900', color: colors.text },
  badge: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
