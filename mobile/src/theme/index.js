import { Platform } from 'react-native';

/**
 * Campus Bond design system — "Grove" theme (locked).
 * Deep forest-green chrome on a pale-green canvas, white cards, and
 * per-type accent colors (TEAM green · EVENT blue · NOTICE red).
 */

export const colors = {
  // Surfaces
  bg: '#EFF5EC', // pale green canvas
  surface: '#FFFFFF', // cards
  surfaceAlt: '#E4F3E9', // light-green tint (avatars, soft pills)
  surfaceMuted: '#EAF1E6', // neutral-ish light (search, inputs)
  surfaceHi: '#DCEBDF',
  border: '#E6ECE3',
  mediaStroke: '#B9C6B7',

  // Accent — deep forest green (chrome: buttons, nav, FAB, brand)
  primary: '#15532E',
  primaryDark: '#0F3D22',
  primaryLight: '#3E8A5A',
  primarySoft: '#E4F3E9',
  onPrimary: '#FFFFFF',
  accent: '#15532E',
  accentSoft: '#E4F3E9',
  link: '#1E7A43',

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

  // Lost / Found labels
  amber: '#C6892E',
  amberSoft: '#FBEFD5',

  // Chat
  chatBg: '#EFF4EC',
  bubbleOut: '#15532E',
  bubbleIn: '#FFFFFF',
  datePill: '#E6ECE3',

  // Semantic
  success: '#1E7A43',
  successSoft: '#E4F3E9',
  danger: '#C6552E',
  dangerSoft: '#FBEAE2',
  warning: '#C6892E',
  like: '#C6552E',

  // Text
  text: '#16241C',
  textMuted: '#6B7B72',
  textFaint: '#A6B0A5',

  // Legacy aliases
  card: '#FFFFFF',
  white: '#FFFFFF',
  onDark: '#16241C',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 14, lg: 18, xl: 22, pill: 999 };
export const layout = { tabBarSpace: 24 };
export const monoFamily = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });

export const font = {
  h1: { fontSize: 22, fontWeight: '700', color: colors.text },
  h2: { fontSize: 20, fontWeight: '700', color: colors.text },
  h3: { fontSize: 16, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, fontWeight: '400', color: colors.text },
  bodyMuted: { fontSize: 15, fontWeight: '400', color: colors.textMuted },
  small: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: colors.textMuted, textTransform: 'uppercase' },
};

export const shadow = {
  card: { shadowColor: '#173A26', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 2 },
  soft: { shadowColor: '#173A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
};

export default { colors, spacing, radius, layout, font, shadow, monoFamily };
