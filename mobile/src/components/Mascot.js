import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
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

/* ------------------------------------------------------------------ */
/*  Event outfits for the header mascot                                */
/* ------------------------------------------------------------------ */

/** Little sparkle that twinkles on its own rhythm. */
function Twinkle({ x, y, size, color, delay }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 520, useNativeDriver: true }),
        Animated.delay(900),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  return (
    <Animated.View style={{ position: 'absolute', left: x, top: y, opacity: v, transform: [{ scale }] }}>
      <Ionicons name="sparkles" size={size} color={color} />
    </Animated.View>
  );
}

/** A note / confetti bit that floats up and fades, forever. */
function Drift({ x, y, size, color, delay, icon }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([Animated.delay(delay), Animated.timing(v, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true })])
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 1.6] });
  const opacity = v.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] });
  const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '12deg'] });
  return (
    <Animated.View style={{ position: 'absolute', left: x, top: y, opacity, transform: [{ translateY }, { rotate }] }}>
      <Ionicons name={icon} size={size} color={color} />
    </Animated.View>
  );
}

/**
 * What the header mascot carries for the campus moment — laid over the
 * ghost in the ghost's own coordinate space (`size` = ghost width).
 *
 *   trophy  — SIH / hackathons: a gold trophy that swings, with sparkles
 *   party   — fests: a party hat and drifting music notes
 *   study   — exams: a mortarboard
 *   work    — placements: a tie
 */
export function MascotDecor({ mood, size = 100 }) {
  const swing = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (mood !== 'trophy') return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(swing, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(swing, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [mood, swing]);

  if (!mood) return null;
  const u = size / 100; // 1 unit = 1% of the ghost's width
  const gold = '#F2B84B';

  if (mood === 'trophy') {
    const rotate = swing.interpolate({ inputRange: [0, 1], outputRange: ['-14deg', '10deg'] });
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {/* Held out to the right, swinging from the "hand" */}
        <Animated.View style={{ position: 'absolute', left: 74 * u, top: 44 * u, transform: [{ rotate }] }}>
          <Ionicons name="trophy" size={48 * u} color={gold} />
        </Animated.View>
        <Twinkle x={-6 * u} y={8 * u} size={16 * u} color={gold} delay={0} />
        <Twinkle x={86 * u} y={-2 * u} size={14 * u} color={gold} delay={600} />
        <Twinkle x={104 * u} y={40 * u} size={12 * u} color={gold} delay={1100} />
      </View>
    );
  }
  if (mood === 'party') {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {/* Party hat perched on the head */}
        <View style={{ position: 'absolute', left: 30 * u, top: -30 * u, transform: [{ rotate: '-14deg' }] }}>
          <Svg width={44 * u} height={44 * u} viewBox="0 0 44 44">
            <Path d="M22 2 L40 40 H4 Z" fill="#EF5B54" />
            <Path d="M10 27 L34 27 L38 36 H6 Z" fill="#F2B84B" />
            <Circle cx="22" cy="3" r="4" fill="#F2B84B" />
          </Svg>
        </View>
        <Drift x={-10 * u} y={30 * u} size={16 * u} color="#EF5B54" delay={0} icon="musical-note" />
        <Drift x={96 * u} y={20 * u} size={18 * u} color="#6A4BC4" delay={700} icon="musical-notes" />
      </View>
    );
  }
  if (mood === 'study') {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={{ position: 'absolute', left: 22 * u, top: -20 * u, transform: [{ rotate: '-8deg' }] }}>
          <Ionicons name="school" size={52 * u} color="#16241C" />
        </View>
      </View>
    );
  }
  if (mood === 'work') {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={{ position: 'absolute', left: 42 * u, top: 74 * u }}>
          <Svg width={16 * u} height={30 * u} viewBox="0 0 16 30">
            <Path d="M3 0 H13 L10 5 L14 24 L8 30 L2 24 L6 5 Z" fill="#2F6FE0" />
          </Svg>
        </View>
      </View>
    );
  }
  return null;
}
