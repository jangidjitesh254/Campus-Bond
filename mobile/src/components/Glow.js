import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

/**
 * Soft radial glows behind the dark home feed — a violet wash top-left and a
 * warm one top-right, so the canvas has depth instead of reading as flat black.
 * Decorative and non-interactive.
 */
export default function Glow({ style }) {
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="violet" cx="12%" cy="8%" r="62%">
            <Stop offset="0" stopColor="#7C74E8" stopOpacity="0.26" />
            <Stop offset="1" stopColor="#7C74E8" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="warm" cx="95%" cy="18%" r="55%">
            <Stop offset="0" stopColor="#E8935F" stopOpacity="0.20" />
            <Stop offset="1" stopColor="#E8935F" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="deep" cx="82%" cy="92%" r="60%">
            <Stop offset="0" stopColor="#6F63D8" stopOpacity="0.16" />
            <Stop offset="1" stopColor="#6F63D8" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#violet)" />
        <Rect width="100%" height="100%" fill="url(#warm)" />
        <Rect width="100%" height="100%" fill="url(#deep)" />
      </Svg>
    </View>
  );
}
