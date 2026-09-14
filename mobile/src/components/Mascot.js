import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors } from '../theme';

/** Faint one-colour ghost used as a watermark on empty media slots. `bg` is the colour behind it. */
export function GhostMark({ width = 56, color = PALE, bg = '#fff', variant = 'smile' }) {
  return (
    <Svg width={width} height={(width * 120) / 100} viewBox="0 0 100 120">
      <Path d={GHOST_PATH} fill={color} />
      <Face variant={variant} ink={color} eye={bg} mouth={bg} />
    </Svg>
  );
}

/**
 * Campus Bond's ghost mascot — drawn entirely with SVG so it can be any size
 * and any expression. Used on onboarding and the auth screens.
 */

export const BODY = colors.primary;
export const INK = colors.primaryDark;
export const PALE = '#CFE8D6';

// Rounded head, straight sides, three scallops along the bottom. viewBox 0 0 100 120.
export const GHOST_PATH =
  'M10 50 A40 40 0 0 1 90 50 V100 A13.34 13.34 0 0 1 63.33 100 A13.34 13.34 0 0 1 36.66 100 A13.34 13.34 0 0 1 10 100 Z';

/** The ghost's face. `variant` picks an expression. */
export function Face({ variant = 'smile', cx = 50, cy = 60, s = 1, ink = INK, mouth = '#fff', eye = '#fff' }) {
  const ex = 14 * s; // eye offset from centre
  const er = 11 * s; // eye white radius
  const pr = 5.5 * s; // pupil radius
  const L = { x: cx - ex, y: cy - 2 * s };
  const R = { x: cx + ex, y: cy - 2 * s };
  const arc = (p) => `M${p.x - 7 * s} ${p.y + 1} Q${p.x} ${p.y - 8 * s} ${p.x + 7 * s} ${p.y + 1}`;
  const smile = `M${cx - 8 * s} ${cy + 14 * s} Q${cx} ${cy + 22 * s} ${cx + 8 * s} ${cy + 14 * s}`;
  const openEye = (p) => (
    <>
      <Circle cx={p.x} cy={p.y} r={er} fill={eye} />
      <Circle cx={p.x} cy={p.y} r={pr} fill={ink} />
    </>
  );
  // `mouth` doubles as the line colour (white on the body, dark on pale stickers).
  const line = mouth;
  const closedEye = (p) => <Path d={arc(p)} stroke={line} strokeWidth={3 * s} strokeLinecap="round" fill="none" />;

  let eyes;
  if (variant === 'wink') {
    eyes = (
      <>
        {openEye(L)}
        {closedEye(R)}
      </>
    );
  } else if (variant === 'happy' || variant === 'kiss') {
    eyes = (
      <>
        {closedEye(L)}
        {closedEye(R)}
      </>
    );
  } else if (variant === 'glasses') {
    eyes = (
      <>
        {openEye(L)}
        {openEye(R)}
        <Circle cx={L.x} cy={L.y} r={er + 2 * s} stroke={line} strokeWidth={2.5 * s} fill="none" />
        <Circle cx={R.x} cy={R.y} r={er + 2 * s} stroke={line} strokeWidth={2.5 * s} fill="none" />
        <Path d={`M${L.x + er + 2 * s} ${L.y} H${R.x - er - 2 * s}`} stroke={line} strokeWidth={2.5 * s} />
      </>
    );
  } else if (variant === 'cool') {
    eyes = (
      <>
        <Rect x={L.x - er} y={L.y - 6 * s} width={er * 2} height={12 * s} rx={4 * s} fill={ink} stroke={line} strokeWidth={1.8 * s} />
        <Rect x={R.x - er} y={R.y - 6 * s} width={er * 2} height={12 * s} rx={4 * s} fill={ink} stroke={line} strokeWidth={1.8 * s} />
        <Path d={`M${L.x + er} ${L.y - 2 * s} H${R.x - er}`} stroke={line} strokeWidth={2 * s} />
      </>
    );
  } else if (variant === 'sad') {
    eyes = (
      <>
        {openEye(L)}
        {openEye(R)}
        <Path d={`M${L.x - 8 * s} ${L.y - 15 * s} l14 5`} stroke={line} strokeWidth={3 * s} strokeLinecap="round" />
        <Path d={`M${R.x + 8 * s} ${R.y - 15 * s} l-14 5`} stroke={line} strokeWidth={3 * s} strokeLinecap="round" />
      </>
    );
  } else {
    eyes = (
      <>
        {openEye(L)}
        {openEye(R)}
      </>
    );
  }

  let mouthEl;
  if (variant === 'kiss') {
    const hx = cx + 14 * s;
    const hy = cy + 12 * s;
    const heart = `M${hx} ${hy + 6 * s} L${hx - 6 * s} ${hy} A3.4 3.4 0 0 1 ${hx} ${hy - 3 * s} A3.4 3.4 0 0 1 ${hx + 6 * s} ${hy} Z`;
    mouthEl = (
      <>
        <Circle cx={cx} cy={cy + 16 * s} r={3.5 * s} fill={mouth} />
        <Path d={heart} fill="#EF5B54" />
      </>
    );
  } else if (variant === 'surprised') {
    mouthEl = <Circle cx={cx} cy={cy + 17 * s} r={4.5 * s} fill={mouth} />;
  } else if (variant === 'sad') {
    mouthEl = <Path d={`M${cx - 8 * s} ${cy + 20 * s} Q${cx} ${cy + 12 * s} ${cx + 8 * s} ${cy + 20 * s}`} stroke={mouth} strokeWidth={3 * s} strokeLinecap="round" fill="none" />;
  } else {
    mouthEl = <Path d={smile} stroke={mouth} strokeWidth={3 * s} strokeLinecap="round" fill="none" />;
  }

  return (
    <>
      {eyes}
      <Circle cx={cx} cy={cy + 7 * s} r={2 * s} fill={mouth} />
      {mouthEl}
    </>
  );
}

/**
 * The ghost. `width` in px (height is 1.2×). Pass an Animated `lid` (0..1) to
 * make the right eye wink; otherwise pick a static `variant`.
 */
export function Ghost({ width = 150, variant = 'smile', lid, body = BODY }) {
  const w = width;
  const h = (w * 120) / 100;
  const u = w / 100;
  const ex = (50 + 14) * u; // right eye centre
  const ey = (60 - 2) * u;
  const er = 11 * u;
  const lidY = lid ? lid.interpolate({ inputRange: [0, 1], outputRange: [-er * 2.2, -er * 0.15] }) : null;

  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h} viewBox="0 0 100 120">
        <Path d={GHOST_PATH} fill={body} />
        <Face variant={variant} />
      </Svg>
      {lid ? (
        <View style={{ position: 'absolute', left: ex - er, top: ey - er, width: er * 2, height: er * 2, borderRadius: er, overflow: 'hidden' }}>
          <Animated.View
            style={{ position: 'absolute', left: -2, right: -2, height: er * 2.2, backgroundColor: body, borderBottomLeftRadius: er, borderBottomRightRadius: er, transform: [{ translateY: lidY }] }}
          />
        </View>
      ) : null}
    </View>
  );
}

/** Round sticker with a ghost face in a given expression. */
export function GhostSticker({ variant, size = 64, extra }) {
  return (
    <View style={[st.disc, { width: size, height: size, borderRadius: size / 2 }]}>
      <Svg width={size - 6} height={size - 6} viewBox="0 0 100 100">
        <Circle cx={50} cy={50} r={50} fill={PALE} />
        <Face variant={variant} cx={50} cy={48} s={0.95} ink={INK} mouth={INK} />
        {extra}
      </Svg>
    </View>
  );
}

const st = StyleSheet.create({
  disc: {
    backgroundColor: '#fff',
    padding: 3,
    shadowColor: '#173A26',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
});
