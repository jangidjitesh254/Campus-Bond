import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Path, Rect, Circle } from 'react-native-svg';

const C = 'rgba(124,192,61,0.12)'; // very faint apple green

function Sparkle({ x, y, s = 10 }) {
  return (
    <Path
      d={`M${x} ${y - s} C ${x + 1} ${y - 1.5} ${x + 1.5} ${y - 1} ${x + s} ${y} C ${x + 1.5} ${y + 1} ${x + 1} ${y + 1.5} ${x} ${y + s} C ${x - 1} ${y + 1.5} ${x - 1.5} ${y + 1} ${x - s} ${y} C ${x - 1.5} ${y - 1} ${x - 1} ${y - 1.5} ${x} ${y - s} Z`}
      fill={C}
      stroke="none"
    />
  );
}

/** Faint decorative doodle background — absolute-fill, non-interactive. */
export default function Doodles({ style }) {
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 780" preserveAspectRatio="xMidYMid slice">
        <G stroke={C} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Chat bubbles */}
          <Rect x={38} y={300} width={96} height={58} rx={18} />
          <Path d="M60 358 l0 16 -16 -16" />
          <Rect x={244} y={430} width={78} height={48} rx={16} />
          <Path d="M306 478 l0 14 14 -14" />

          {/* Paper plane */}
          <Path d="M262 292 l64 -26 -20 62 -16 -20 -18 12 2 -22 -12 -6Z" />
          <Path d="M290 308 l16 -42" />

          {/* Backpack */}
          <Rect x={54} y={560} width={72} height={82} rx={20} />
          <Path d="M74 560 a16 16 0 0 1 32 0" />
          <Rect x={70} y={600} width={40} height={30} rx={10} />
          <Path d="M82 600 v30 M98 600 v30" />

          {/* Graduation cap */}
          <Path d="M300 548 l38 16 -38 16 -38 -16 38 -16Z" />
          <Path d="M320 572 v20 a6 6 0 0 1 -12 0" />
          <Path d="M338 564 v18" />

          {/* Dashed swoosh trail */}
          <Path d="M40 200 C 130 150 260 250 350 190" strokeDasharray="2 12" />
          <Path d="M30 690 C 120 640 250 720 360 660" strokeDasharray="2 12" />
        </G>
        {/* Sparkles */}
        <Sparkle x={66} y={240} s={11} />
        <Sparkle x={330} y={360} s={9} />
        <Sparkle x={126} y={470} s={8} />
        <Sparkle x={210} y={200} s={7} />
        <Sparkle x={300} y={690} s={10} />
      </Svg>
    </View>
  );
}
