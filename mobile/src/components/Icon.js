import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

/** Icon set matching the WhatsApp-dark design spec (same SVG path data). */
const ICONS = {
  home: (c, f) => <Path d="M4 11 12 4.5 20 11v8.5h-6v-5h-4v5H4V11Z" fill={f ? c : 'none'} stroke={f ? 'none' : c} />,
  search: (c) => (
    <>
      <Circle cx={11} cy={11} r={6.5} stroke={c} />
      <Path d="m16 16 4.5 4.5" stroke={c} />
    </>
  ),
  chat: (c, f) => <Path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4V6Z" fill={f ? c : 'none'} stroke={f ? 'none' : c} />,
  heart: (c, f) => <Path d="M12 20.2c-1.6-1-7.5-4.9-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 3c0 4.7-5.9 8.6-7.5 9.6Z" fill={f ? c : 'none'} stroke={f ? 'none' : c} />,
  comment: (c) => <Path d="M20.5 11.6a7.9 7.9 0 0 1-11.4 7.1L4.5 20l1.4-4.4A7.9 7.9 0 1 1 20.5 11.6Z" stroke={c} fill="none" />,
  repost: (c) => (
    <>
      <Path d="M6 9V7a2 2 0 0 1 2-2h9l-2.6-2.4" stroke={c} />
      <Path d="M18 15v2a2 2 0 0 1-2 2H7l2.6 2.4" stroke={c} />
    </>
  ),
  hand: (c) => (
    <>
      <Path d="M9 12V4.8a1.4 1.4 0 0 1 2.8 0V11" stroke={c} />
      <Path d="M11.8 10.6V4.4a1.4 1.4 0 0 1 2.8 0V11" stroke={c} />
      <Path d="M14.6 10.8V6.4a1.4 1.4 0 0 1 2.8 0V15a5.5 5.5 0 0 1-5.5 5.5h-1a5 5 0 0 1-4.4-2.6L4 13.4a1.4 1.4 0 0 1 2.3-1.6L9 15" stroke={c} />
    </>
  ),
  back: (c) => (
    <>
      <Path d="M19 12H5" stroke={c} />
      <Path d="m11 6-6 6 6 6" stroke={c} />
    </>
  ),
  chevronRight: (c) => <Path d="m9 5 7 7-7 7" stroke={c} fill="none" />,
  plus: (c) => <Path d="M12 5.5v13M5.5 12h13" stroke={c} />,
  dotsV: (c) => (
    <>
      <Circle cx={12} cy={5} r={1.8} fill={c} stroke="none" />
      <Circle cx={12} cy={12} r={1.8} fill={c} stroke="none" />
      <Circle cx={12} cy={19} r={1.8} fill={c} stroke="none" />
    </>
  ),
  trash: (c) => (
    <>
      <Path d="M4.5 7h15" stroke={c} />
      <Path d="M9.5 7V5.6A1.6 1.6 0 0 1 11.1 4h1.8a1.6 1.6 0 0 1 1.6 1.6V7" stroke={c} />
      <Path d="M6.6 7l.9 12a2 2 0 0 0 2 1.9h5a2 2 0 0 0 2-1.9l.9-12" stroke={c} />
      <Path d="M10.4 11v6M13.6 11v6" stroke={c} />
    </>
  ),
  dotsH: (c) => (
    <>
      <Circle cx={5} cy={12} r={1.8} fill={c} stroke="none" />
      <Circle cx={12} cy={12} r={1.8} fill={c} stroke="none" />
      <Circle cx={19} cy={12} r={1.8} fill={c} stroke="none" />
    </>
  ),
  camera: (c) => (
    <>
      <Rect x={3} y={6.5} width={18} height={13} rx={3} stroke={c} />
      <Circle cx={12} cy={13} r={3.4} stroke={c} />
      <Path d="M9 6.5 10 4.5h4l1 2" stroke={c} />
    </>
  ),
  phone: (c) => <Path d="M4 6.5a2 2 0 0 1 2-2h1.5l2 4-2 1.5a10 10 0 0 0 5 5L14 13l4 2v1.5a2 2 0 0 1-2 2A13.5 13.5 0 0 1 4 6.5Z" stroke={c} />,
  mic: (c) => (
    <>
      <Path d="M12 3.5a2.6 2.6 0 0 1 2.6 2.6v5a2.6 2.6 0 0 1-5.2 0v-5A2.6 2.6 0 0 1 12 3.5Z" stroke={c} />
      <Path d="M6 11a6 6 0 0 0 12 0" stroke={c} />
      <Path d="M12 17v3.5" stroke={c} />
    </>
  ),
  emoji: (c) => (
    <>
      <Circle cx={12} cy={12} r={8.5} stroke={c} />
      <Path d="M9 14.5a4 4 0 0 0 6 0" stroke={c} />
      <Circle cx={9.2} cy={10} r={0.9} fill={c} stroke="none" />
      <Circle cx={14.8} cy={10} r={0.9} fill={c} stroke="none" />
    </>
  ),
  attach: (c) => <Path d="M15 7.5 8.5 14a3 3 0 0 0 4.2 4.2l6.3-6.3a5 5 0 0 0-7-7L5.5 11.4" stroke={c} />,
  globe: (c) => (
    <>
      <Circle cx={12} cy={12} r={9} stroke={c} />
      <Path d="M3.5 12h17M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" stroke={c} />
    </>
  ),
  verified: (c) => (
    <>
      <Circle cx={12} cy={12} r={9} stroke={c} />
      <Path d="M8 12.5l2.8 2.8L16 9.5" stroke={c} />
    </>
  ),
  send: (c) => <Path d="M3 20.5 21.5 12 3 3.5l3.4 7.3H14v2.4H6.4L3 20.5Z" fill={c} stroke="none" />,
  edit: (c) => <Path d="m14 7 3.5 3.5-8 8-4.5 1 1-4.5 8-8Z" stroke={c} fill="none" />,
  image: (c) => (
    <>
      <Rect x={3} y={5} width={18} height={14} rx={3} stroke={c} />
      <Circle cx={8.5} cy={10} r={1.6} stroke={c} />
      <Path d="m3 17 5.5-4.5L14 17" stroke={c} />
      <Path d="m13 15 3-2.5 5 4.5" stroke={c} />
    </>
  ),
  location: (c) => (
    <>
      <Path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" stroke={c} />
      <Circle cx={12} cy={10} r={2.4} stroke={c} />
    </>
  ),
  check: (c) => <Path d="m5 13 5 5L19 7" stroke={c} />,
  tag: (c) => (
    <>
      <Path d="M3 12V4h8l9 9-8 8-9-9Z" stroke={c} />
      <Circle cx={7.5} cy={7.5} r={1.3} fill={c} stroke="none" />
    </>
  ),
  logout: (c) => (
    <>
      <Path d="M14 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8" stroke={c} />
      <Path d="M17 8l4 4-4 4M21 12H10" stroke={c} />
    </>
  ),
  bell: (c) => (
    <>
      <Path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10Z" stroke={c} />
      <Path d="M10 18.5a2 2 0 0 0 4 0" stroke={c} />
    </>
  ),
  shield: (c, f, on) => (
    <>
      <Path d="M12 3l7 3v5c0 4.6-3.1 7.7-7 9-3.9-1.3-7-4.4-7-9V6l7-3Z" fill={f ? c : 'none'} stroke={f ? 'none' : c} />
      <Path d="m8.8 12 2.2 2.2 4.2-4.4" stroke={f ? on : c} />
    </>
  ),
  filter: (c) => <Path d="M4 5.5h16l-6.2 8v5.2l-3.6 1.8v-7L4 5.5Z" stroke={c} fill="none" />,
  user: (c, f) => (
    <>
      <Circle cx={12} cy={8} r={4} fill={f ? c : 'none'} stroke={f ? 'none' : c} />
      <Path d="M4.5 20a7.5 7.5 0 0 1 15 0" fill={f ? c : 'none'} stroke={f ? 'none' : c} />
    </>
  ),
  star: (c, f) => <Path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8L12 3.6Z" fill={f ? c : 'none'} stroke={c} />,
  wrench: (c) => <Path d="M15.5 4.5a4 4 0 0 1-5 5L5 15l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.4 2.4-2-2 2.4-2.4Z" stroke={c} fill="none" />,
  users: (c) => (
    <>
      <Circle cx={9} cy={8} r={3} stroke={c} />
      <Path d="M3.8 19a5.2 5.2 0 0 1 10.4 0" stroke={c} />
      <Path d="M16 5.5a3 3 0 0 1 0 5.5" stroke={c} />
      <Path d="M17.5 19a5.2 5.2 0 0 0-2.6-4.4" stroke={c} />
    </>
  ),
  briefcase: (c) => (
    <>
      <Rect x={3} y={7} width={18} height={12} rx={2.5} stroke={c} />
      <Path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7" stroke={c} />
    </>
  ),
  grid: (c) => (
    <>
      <Rect x={4} y={4} width={7} height={7} rx={2} stroke={c} />
      <Rect x={13} y={4} width={7} height={7} rx={2} stroke={c} />
      <Rect x={4} y={13} width={7} height={7} rx={2} stroke={c} />
      <Rect x={13} y={13} width={7} height={7} rx={2} stroke={c} />
    </>
  ),
  calendarCheck: (c) => (
    <>
      <Rect x={4} y={5} width={16} height={16} rx={3} stroke={c} />
      <Path d="M4 9h16M8 3v4M16 3v4" stroke={c} />
      <Path d="m9 14 2 2 4-4" stroke={c} />
    </>
  ),
  megaphone: (c) => (
    <>
      <Path d="M4 10v4a1.5 1.5 0 0 0 1.5 1.5H7l1 4h2l-1-4 9 3.5V6L9 9.5H5.5A1.5 1.5 0 0 0 4 11Z" stroke={c} />
      <Path d="M18 9.5a3 3 0 0 1 0 5" stroke={c} />
    </>
  ),
  bag: (c) => (
    <>
      <Path d="M6 8h12l-1 12H7L6 8Z" stroke={c} />
      <Path d="M9 8V6.5a3 3 0 0 1 6 0V8" stroke={c} />
    </>
  ),
  compass: (c) => (
    <>
      <Circle cx={12} cy={12} r={9} stroke={c} />
      <Path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" stroke={c} />
    </>
  ),
  map: (c) => (
    <>
      <Path d="M9 4 3 6.5v13.5L9 17.5l6 2.5 6-2.5V4l-6 2.5L9 4Z" stroke={c} />
      <Path d="M9 4v13.5M15 6.5V20" stroke={c} />
    </>
  ),
  // ---- Post page design set ----
  compose: (c) => (
    <>
      <Path d="M11 4.5H6.5a2.5 2.5 0 0 0-2.5 2.5v10.5a2.5 2.5 0 0 0 2.5 2.5H17a2.5 2.5 0 0 0 2.5-2.5V13" stroke={c} />
      <Path d="m17.4 3.6 3 3L12 15l-4 1 1-4 8.4-8.4Z" stroke={c} />
    </>
  ),
  sliders: (c) => (
    <>
      <Path d="M4 7h9M19.5 7H21M4 12h3.5M14 12h7M4 17h7.5M18 17h3" stroke={c} />
      <Circle cx={16} cy={7} r={2.4} stroke={c} />
      <Circle cx={10.5} cy={12} r={2.4} stroke={c} />
      <Circle cx={14.5} cy={17} r={2.4} stroke={c} />
    </>
  ),
  gridDots: (c) => (
    <>
      <Circle cx={8.6} cy={8.6} r={2.7} stroke={c} />
      <Circle cx={15.4} cy={8.6} r={2.7} stroke={c} />
      <Circle cx={8.6} cy={15.4} r={2.7} stroke={c} />
      <Circle cx={15.4} cy={15.4} r={2.7} stroke={c} />
    </>
  ),
  list: (c) => (
    <>
      <Circle cx={5} cy={7} r={1.5} fill={c} stroke="none" />
      <Circle cx={5} cy={12} r={1.5} fill={c} stroke="none" />
      <Circle cx={5} cy={17} r={1.5} fill={c} stroke="none" />
      <Path d="M10 7h10M10 12h10M10 17h10" stroke={c} />
    </>
  ),
  plane: (c, f, on) => (
    <>
      <Path d="M20.6 3.4 3.6 10.1l7.2 2.9 2.9 7.2 6.9-16.8Z" fill={f ? c : 'none'} stroke={f ? 'none' : c} />
      <Path d="m10.8 13 9.8-9.6" stroke={f ? on : c} />
    </>
  ),
  shareArrow: (c) => (
    <>
      <Path d="M4 19.5c.6-6.6 5.2-10.2 12.2-10.4" stroke={c} />
      <Path d="m14.6 4.6 5.4 4.5-5.4 4.5" stroke={c} />
    </>
  ),
  moon: (c, f) => (
    <Path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" fill={f ? c : 'none'} stroke={c} />
  ),
  trophy: (c) => (
    <>
      <Path d="M7 4h10v6a5 5 0 0 1-10 0V4Z" stroke={c} />
      <Path d="M7 6H4.4a3.6 3.6 0 0 0 3.6 3.6" stroke={c} />
      <Path d="M17 6h2.6a3.6 3.6 0 0 1-3.6 3.6" stroke={c} />
      <Path d="M12 15v3.4M8.4 20.5h7.2" stroke={c} />
    </>
  ),
  bookmark: (c, f) => (
    <Path d="M6.5 4.5h11v15l-5.5-4-5.5 4v-15Z" fill={f ? c : 'none'} stroke={c} />
  ),
  calendar: (c) => (
    <>
      <Rect x={3.5} y={5} width={17} height={16} rx={3.5} stroke={c} />
      <Path d="M3.5 10h17M8 3v4M16 3v4" stroke={c} />
    </>
  ),
};

export default function Icon({ name, size = 24, color = '#171B1D', filled = false, onColor = '#FFFFFF', strokeWidth = 1.7, style }) {
  const render = ICONS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {render ? render(color, filled, onColor) : null}
    </Svg>
  );
}
