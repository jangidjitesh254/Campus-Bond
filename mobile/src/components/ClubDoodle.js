import React from 'react';
import Svg, { G, Path, Circle, Rect } from 'react-native-svg';

/**
 * Faint line-art motif per club category, tucked into a card corner.
 * Purely decorative — the colour is passed in already alpha-reduced.
 */
const MOTIF = {
  tech: (
    <>
      <Path d="M6 20h12a4 4 0 0 1 4 4v8a4 4 0 0 0 4 4h20" />
      <Path d="M6 46h10a4 4 0 0 0 4-4V30" />
      <Rect x={30} y={10} width={18} height={13} rx={3} />
      <Circle cx={6} cy={20} r={2.4} />
      <Circle cx={6} cy={46} r={2.4} />
      <Circle cx={48} cy={36} r={2.4} />
    </>
  ),
  cultural: (
    <>
      <Path d="M24 44V15l22-4v29" />
      <Circle cx={18} cy={45} r={6} />
      <Circle cx={40} cy={41} r={6} />
    </>
  ),
  sports: (
    <>
      <Circle cx={30} cy={30} r={17} />
      <Path d="M30 13v34M13 30h34" />
      <Path d="M19 19c7 4 15 4 22 0M19 41c7-4 15-4 22 0" />
    </>
  ),
  academic: (
    <>
      <Path d="M30 14 52 24 30 34 8 24 30 14Z" />
      <Path d="M42 29v10c0 4-5 7-12 7s-12-3-12-7V29" />
      <Path d="M52 24v13" />
    </>
  ),
  arts: (
    <>
      <Path d="M30 12c11 0 20 8 20 17 0 6-5 8-9 8h-4c-3 0-5 2-5 4 0 3 2 4 2 6 0 2-2 3-4 3-11 0-20-8-20-19s9-19 20-19Z" />
      <Circle cx={22} cy={25} r={2.4} />
      <Circle cx={32} cy={21} r={2.4} />
      <Circle cx={41} cy={28} r={2.4} />
    </>
  ),
  social: (
    <>
      <Rect x={6} y={14} width={30} height={20} rx={7} />
      <Path d="M14 34v6l7-6" />
      <Rect x={28} y={30} width={26} height={17} rx={6} />
      <Path d="M46 47v5l-6-5" />
    </>
  ),
  other: (
    <>
      <Path d="M30 10l3.5 8.5L42 22l-8.5 3.5L30 34l-3.5-8.5L18 22l8.5-3.5L30 10Z" />
      <Path d="M48 34l1.8 4.4L54 40l-4.2 1.6L48 46l-1.8-4.4L42 40l4.2-1.6L48 34Z" />
      <Circle cx={14} cy={42} r={4} />
    </>
  ),
};

export default function ClubDoodle({ category, color, size = 76, style }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" style={style} pointerEvents="none">
      <G stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {MOTIF[category] || MOTIF.other}
      </G>
    </Svg>
  );
}
