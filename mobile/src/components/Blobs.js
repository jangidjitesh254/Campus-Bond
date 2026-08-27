import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../theme';

/**
 * Solid organic shapes used on the Post page: a dark-green blob bleeding off
 * the top-left corner, a green leaf bottom-right, and a diagonal band of dots.
 * All layers are decorative and non-interactive.
 */

/**
 * Dark-green blob bleeding off the top-left corner.
 * Currently unused — the Post page dropped it in favour of a plain profile
 * button in the header. Kept here in case the corner shape is wanted again.
 */
export function TopBlob({ style }) {
  return (
    // Stays wide through the middle band so the profile button sits fully inside it.
    <Svg width={100} height={92} viewBox="0 0 112 104" style={[styles.top, style]} pointerEvents="none">
      <Path
        d="M0 0 H108 C 106 28 98 48 86 66 C 74 84 52 98 30 100 C 12 101 0 96 0 84 Z"
        fill={colors.primary}
      />
    </Svg>
  );
}

// Diagonal band of dots on the right edge, above the leaf.
const DOT_COLORS = [colors.sun, colors.badgeTeamFg, colors.primary, colors.sky];
const DOTS = [];
for (let r = 0; r < 9; r++) {
  for (let c = Math.max(0, r - 4); c <= Math.min(3, r); c++) {
    DOTS.push({ x: 330 + c * 13, y: 6 + r * 12, fill: DOT_COLORS[(r + c) % DOT_COLORS.length] });
  }
}

/** Green leaf and dot band along the bottom of the screen. */
export function BottomDecor({ style }) {
  return (
    <View style={[styles.bottom, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 210" preserveAspectRatio="xMidYMax slice">
        {/* Green leaf, bottom-right */}
        <Path
          d="M372 100 C 336 106 310 132 308 162 C 306 177 316 181 328 177 C 358 168 378 138 376 106 C 376 101 375 99 372 100 Z"
          fill={colors.primary}
        />
        {DOTS.map((d, i) => (
          <Circle key={i} cx={d.x} cy={d.y} r={2.4} fill={d.fill} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 210 },
});
