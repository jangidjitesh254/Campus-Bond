import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

/**
 * Circular ring for the campus score. Shows either the score number or, when
 * `centerText` is given (e.g. the user's initial), acts as an avatar frame.
 */
export default function ScoreRing({
  value = 0,
  target = 100,
  size = 104,
  stroke = 9,
  centerText,
  trackColor = colors.surfaceHi,
  progressColor = colors.primary,
  valueColor = colors.text,
  badgeColor = colors.primary,
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, target > 0 ? value / target : 0));
  const dash = circumference * pct;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Track (full ring) */}
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={stroke} fill="none" />
        {/* Progress arc */}
        {pct > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>

      <View style={styles.center}>
        <Text style={[styles.text, { color: valueColor }, centerText ? styles.initial : styles.value]}>
          {centerText ?? value}
        </Text>
      </View>

      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Ionicons name="trophy" size={13} color="#fff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '900' },
  value: { fontSize: 32 },
  initial: { fontSize: 40 },
  badge: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
