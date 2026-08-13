import React from 'react';
import Svg, { G, Rect, Line, Path, Circle } from 'react-native-svg';
import { colors } from '../theme';

/** Faint line-art campus skyline used as a header decoration. */
export default function CampusDoodle({ width = 190, height = 120, style }) {
  const c = colors.primaryLight;
  return (
    <Svg width={width} height={height} viewBox="0 0 190 120" style={style}>
      <G stroke={c} strokeWidth={1.6} fill="none" opacity={0.7} strokeLinecap="round">
        {/* Main hall */}
        <Rect x={70} y={54} width={54} height={54} rx={2} />
        <Path d="M70 54 L97 36 L124 54" />
        <Line x1={97} y1={24} x2={97} y2={36} />
        <Path d="M97 24 L112 28 L97 32" fill={c} />
        {/* Clock */}
        <Circle cx={97} cy={66} r={6} />
        {/* Windows */}
        <Rect x={78} y={82} width={9} height={14} rx={1} />
        <Rect x={107} y={82} width={9} height={14} rx={1} />
        {/* Side wings */}
        <Rect x={128} y={72} width={40} height={36} rx={2} />
        <Rect x={26} y={72} width={40} height={36} rx={2} />
        <Line x1={135} y1={82} x2={161} y2={82} />
        <Line x1={33} y1={82} x2={59} y2={82} />
        {/* Trees */}
        <Circle cx={16} cy={96} r={9} />
        <Circle cx={178} cy={96} r={9} />
        {/* Clouds & birds */}
        <Path d="M150 20 q6 -8 14 0" />
        <Path d="M40 26 q5 -6 11 0" />
      </G>
    </Svg>
  );
}
