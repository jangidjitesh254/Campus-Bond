import { Platform } from 'react-native';

/**
 * Campus Bond design system — "Grove" theme (locked).
 *
 * Deep forest-green chrome on a pale-green canvas, white cards, and per-type
 * accent colors (TEAM green · EVENT blue · NOTICE red). Flat, edge-to-edge
 * surfaces with hairlines — Instagram / Threads style.
 *
 * Two ways to read a colour:
 *  - `colors` — the static light palette (Home, composer, onboarding, tab bar).
 *  - `useTheme().t` — the active palette; `ink` and `inkDark` share every key,
 *    so a screen reads `t.x` and repaints when the mode flips.
 */

export const FONT = {
  family: 'Manrope',
  weights: {
    400: 'Manrope_400Regular',
    500: 'Manrope_500Medium',
    600: 'Manrope_600SemiBold',
    700: 'Manrope_700Bold',
    800: 'Manrope_800ExtraBold',
  },
};

// Shared accent ramps — identical in both modes (they sit on their own fills).
export const gradients = {
  accent: ['#15532E', '#1E7A43'],
  avatar: ['#3E8A5A', '#15532E'],
  hero: ['#0F3D22', '#15532E'],
};

/** Light — the locked Grove palette. */
export const ink = {
  // Accent — deep forest green (chrome: buttons, nav, FAB, brand)
  primary: '#15532E',
  primaryDark: '#0F3D22',
  primaryLight: '#3E8A5A',
  primarySoft: '#E4F3E9',
  onPrimary: '#FFFFFF',
  ink: '#16241C',
  accent: '#15532E',
  accentFill: '#15532E',
  accentSoft: '#E4F3E9',
  link: '#1E7A43',

  // Text
  text: '#16241C',
  textMuted: '#6B7B72',
  textFaint: '#A6B0A5',
  textDim: '#A6B0A5',
  inkSoft: '#6B7B72',

  // Surfaces
  page: '#F6F6F6', // neutral off-white canvas
  bg: '#F6F6F6',
  surface: '#FFFFFF', // cards
  card: '#FFFFFF',
  white: '#FFFFFF',
  surfaceAlt: '#E4F3E9', // light-green tint (avatars, soft pills)
  surfaceMuted: '#F0F1F0', // neutral light (search, inputs, chips)
  surfaceHi: '#E4E5E4',
  field: '#FFFFFF',
  border: '#E7E8E7',
  borderSoft: '#E7E8E7',
  hairline: '#E7E8E7',
  hairlineAlt: '#DFE0DF',
  mediaStroke: '#C2C4C2',
  glass: '#FFFFFF',
  glassBorder: '#E7E8E7',
  barGlass: '#FFFFFF',

  // Ambient glow blobs (kept very faint so the canvas stays flat)
  glowA: '#15532E',
  glowB: '#EBD5AB',
  glowAOpacity: 0.05,
  glowBOpacity: 0.06,

  cream: '#EBD5AB',
  creamSoft: '#FBF0D9',

  // Per-type accents (also used as badge colors)
  badgeTeamBg: '#E4F3E9',
  badgeTeamFg: '#1E7A43',
  badgeEventBg: '#E6EEFC',
  badgeEventFg: '#2F6FE0',
  badgeNoticeBg: '#FBEAE2',
  badgeNoticeFg: '#C6552E',
  badgeClubBg: '#EEE8FA',
  badgeClubFg: '#6A4BC4',

  // Avatars (default)
  avatarBg: '#E4F3E9',
  avatarText: '#1E7A43',
  avatarNeutral: '#E4E5E4',

  // Lost / Found labels
  amber: '#C6892E',
  amberSoft: '#FBEFD5',

  // Chat
  chatBg: '#F6F6F6',
  bubbleOut: '#15532E',
  bubbleIn: '#FFFFFF',
  datePill: '#E7E8E7',

  // Semantic
  success: '#1E7A43',
  successSoft: '#E4F3E9',
  danger: '#C6552E',
  dangerSoft: '#FBEAE2',
  warning: '#C6892E',
  like: '#C6552E',

  // Misc accents
  sky: '#2F6FE0',
  sun: '#C6892E',
  grape: '#6A4BC4',
  coral: '#C6552E',
  onDark: '#16241C',
};

/** Static alias for screens that don't switch modes (Home, composer, onboarding, tab bar). */
export const colors = ink;

/** Per-kind colours for feed cards: foreground / text-on-fill / soft background / ring. */
export const kinds = {
  team: { fg: '#1E7A43', on: '#FFFFFF', bg: '#E4F3E9', ring: '#B9DCC6' },
  lost: { fg: '#C6552E', on: '#FFFFFF', bg: '#FBEAE2', ring: '#F0C3B3' },
  notice: { fg: '#2F6FE0', on: '#FFFFFF', bg: '#E6EEFC', ring: '#BFD3F7' },
};

/** Dark — the same keys, green-tinted night surfaces. */
export const inkDark = {
  primary: '#3E8A5A',
  primaryDark: '#E8F1EA',
  primaryLight: '#7FC79A',
  primarySoft: 'rgba(62,138,90,0.2)',
  onPrimary: '#FFFFFF',
  ink: '#E8F1EA',
  accent: '#7FC79A',
  accentFill: '#3E8A5A',
  accentSoft: 'rgba(62,138,90,0.2)',
  link: '#7FC79A',

  text: '#E8F1EA',
  textMuted: 'rgba(232,241,234,0.6)',
  textFaint: 'rgba(232,241,234,0.42)',
  textDim: 'rgba(232,241,234,0.36)',
  inkSoft: 'rgba(232,241,234,0.55)',

  page: '#0B0B0B',
  bg: '#0B0B0B',
  surface: '#161616',
  card: '#161616',
  white: '#161616',
  surfaceAlt: '#1F2A23',
  surfaceMuted: '#202020',
  surfaceHi: '#2A2A2A',
  field: '#202020',
  border: 'rgba(255,255,255,0.08)',
  borderSoft: 'rgba(255,255,255,0.1)',
  hairline: 'rgba(255,255,255,0.07)',
  hairlineAlt: 'rgba(255,255,255,0.09)',
  mediaStroke: 'rgba(232,241,234,0.3)',
  glass: '#161616',
  glassBorder: 'rgba(255,255,255,0.08)',
  barGlass: '#161616',

  glowA: '#3E8A5A',
  glowB: '#EBD5AB',
  glowAOpacity: 0.14,
  glowBOpacity: 0.06,

  cream: '#EBD5AB',
  creamSoft: 'rgba(235,213,171,0.16)',

  badgeTeamBg: 'rgba(62,138,90,0.22)',
  badgeTeamFg: '#7FC79A',
  badgeEventBg: 'rgba(47,111,224,0.22)',
  badgeEventFg: '#8FB4F5',
  badgeNoticeBg: 'rgba(198,85,46,0.22)',
  badgeNoticeFg: '#F0A085',
  badgeClubBg: 'rgba(106,75,196,0.24)',
  badgeClubFg: '#B7A3F2',

  avatarBg: 'rgba(62,138,90,0.22)',
  avatarText: '#7FC79A',
  avatarNeutral: '#2A2A2A',

  amber: '#E0A85A',
  amberSoft: 'rgba(224,168,90,0.18)',

  chatBg: '#0B0B0B',
  bubbleOut: '#3E8A5A',
  bubbleIn: '#202020',
  datePill: '#202020',

  success: '#7FC79A',
  successSoft: 'rgba(62,138,90,0.2)',
  danger: '#F0A085',
  dangerSoft: 'rgba(198,85,46,0.2)',
  warning: '#E0A85A',
  like: '#F0A085',

  sky: '#8FB4F5',
  sun: '#E0A85A',
  grape: '#B7A3F2',
  coral: '#F0A085',
  onDark: '#E8F1EA',
};

export const kindsDark = {
  team: { fg: '#7FC79A', on: '#0E1611', bg: 'rgba(62,138,90,0.22)', ring: 'rgba(62,138,90,0.4)' },
  lost: { fg: '#F0A085', on: '#0E1611', bg: 'rgba(198,85,46,0.22)', ring: 'rgba(198,85,46,0.4)' },
  notice: { fg: '#8FB4F5', on: '#0E1611', bg: 'rgba(47,111,224,0.22)', ring: 'rgba(47,111,224,0.4)' },
};

/** Club category accents. */
export const clubAccents = {
  tech:     { fg: '#6A4BC4', bg: '#EEE8FA' },
  cultural: { fg: '#C6552E', bg: '#FBEAE2' },
  sports:   { fg: '#1E7A43', bg: '#E4F3E9' },
  academic: { fg: '#2F6FE0', bg: '#E6EEFC' },
  arts:     { fg: '#C6892E', bg: '#FBEFD5' },
  social:   { fg: '#C6552E', bg: '#FBEAE2' },
  other:    { fg: '#6B7B72', bg: '#EAF1E6' },
};

export const clubAccentsDark = {
  tech:     { fg: '#B7A3F2', bg: 'rgba(106,75,196,0.24)' },
  cultural: { fg: '#F0A085', bg: 'rgba(198,85,46,0.22)' },
  sports:   { fg: '#7FC79A', bg: 'rgba(62,138,90,0.22)' },
  academic: { fg: '#8FB4F5', bg: 'rgba(47,111,224,0.22)' },
  arts:     { fg: '#E0A85A', bg: 'rgba(224,168,90,0.18)' },
  social:   { fg: '#F0A085', bg: 'rgba(198,85,46,0.22)' },
  other:    { fg: 'rgba(232,241,234,0.7)', bg: 'rgba(255,255,255,0.08)' },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 14, lg: 18, xl: 22, pill: 999 };
// The bottom bar floats over the content (so it can slide away), so lists pad by its height.
export const layout = { tabBarSpace: 84 };
export const monoFamily = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });

/** Type ramp for a palette — screens that switch modes call `fontFor(t)`. */
export const fontFor = (c) => ({
  h1: { fontSize: 22, fontWeight: '700', color: c.text },
  h2: { fontSize: 20, fontWeight: '700', color: c.text },
  h3: { fontSize: 16, fontWeight: '600', color: c.text },
  body: { fontSize: 15, fontWeight: '400', color: c.text },
  bodyMuted: { fontSize: 15, fontWeight: '400', color: c.textMuted },
  small: { fontSize: 13, fontWeight: '400', color: c.textMuted },
  label: { fontSize: 14, fontWeight: '600', color: c.text },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: c.textMuted, textTransform: 'uppercase' },
});
export const font = fontFor(colors);

export const shadow = {
  card: { shadowColor: '#173A26', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 2 },
  soft: { shadowColor: '#173A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  glow: { shadowColor: '#15532E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 },
};

export default { colors, spacing, radius, layout, font, shadow, monoFamily };
