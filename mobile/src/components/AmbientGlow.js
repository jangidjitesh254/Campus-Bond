import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

/**
 * The two blurred colour blobs behind every screen — violet top-right,
 * coral bottom-left. CSS `filter: blur(90px)` has no native equivalent, so
 * each blob is a radial gradient that fades to transparent, which reads the
 * same at phone size. Put it first inside a screen's root view.
 */
export default function AmbientGlow({ style }) {
  const { t } = useTheme();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="glowA" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={t.glowA} stopOpacity={t.glowAOpacity} />
            <Stop offset="55%" stopColor={t.glowA} stopOpacity={t.glowAOpacity * 0.45} />
            <Stop offset="100%" stopColor={t.glowA} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glowB" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={t.glowB} stopOpacity={t.glowBOpacity} />
            <Stop offset="55%" stopColor={t.glowB} stopOpacity={t.glowBOpacity * 0.45} />
            <Stop offset="100%" stopColor={t.glowB} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/* top-right violet: 280px blob centred ~70px in from the corner */}
        <Circle cx="100%" cy="80" r="230" fill="url(#glowA)" />
        {/* bottom-left coral: sits above the tab bar */}
        <Circle cx="50" cy="78%" r="220" fill="url(#glowB)" />
      </Svg>
    </View>
  );
}
