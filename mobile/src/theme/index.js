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

  // Avatars (default)
  avatarBg: '#E4F3E9',
  avatarText: '#1E7A43',

  // Lost / Found labels
  amber: '#C6892E',
  amberSoft: '#FBEFD5',

  // Post-feed accents (colored filter pills, blobs, compose FAB)
  sun: '#F5B301', // amber — Lost&Found pill, compose + filter buttons, blob
  sunSoft: '#FDEFC4',
  grape: '#8B5CF6', // Teams pill
  coral: '#F0564F', // Notice pill
  sky: '#2F80ED', // Events pill
  ink: '#101413', // near-black "Interested" button
  inkSoft: '#454C47', // unselected dark filter pill

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

export const dark = {
  bg: '#12121C', // deep navy-violet canvas
  surface: 'rgba(255,255,255,0.055)', // translucent card
  surfaceStrong: 'rgba(255,255,255,0.085)',
  border: 'rgba(255,255,255,0.10)',
  rail: 'rgba(255,255,255,0.10)',
  text: '#F3F3F8',
  textMuted: '#9B9BB2',
  textFaint: '#6F6F88',
  navBar: 'rgba(32,32,48,0.94)',
};

/** Per-category accent colours, cycled across the feed. */
export const accents = {
  violet: { main: '#7C74E8', soft: 'rgba(124,116,232,0.18)' },
  coral: { main: '#E8836F', soft: 'rgba(232,131,111,0.18)' },
  amber: { main: '#E0A44A', soft: 'rgba(224,164,74,0.18)' },
  teal: { main: '#4FBFA8', soft: 'rgba(79,191,168,0.18)' },
};

/**
 * "Ink & copper" palette — design handoff 7a for the home feed.
 * Slate ink primary, copper accent, cool neutrals, white surfaces.
 */
export const ink = {
  primary: '#2E3438', // slate ink — brand, active states, primary buttons
  onPrimary: '#FFFFFF',
  text: '#171B1D',
  textMuted: '#8E9497',
  textFaint: '#A6ABAC',
  textDim: '#B6BBBC', // mono counters
  page: '#FCFDFD',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFBFB', // card action bar
  hairline: '#EDEFEF',
  hairlineAlt: '#EFF2F2', // action-bar top border
  borderSoft: '#E7EAEA', // icon buttons, chips
  field: '#F2F4F4',
  accent: '#A9603A', // copper — section labels, lost & found

  // --- parity aliases so screens can swap `colors.*` for `t.*` wholesale ---
  bg: '#FCFDFD',
  card: '#FFFFFF',
  white: '#FFFFFF',
  surfaceMuted: '#F2F4F4',
  surfaceHi: '#EDEFEF',
  border: '#E7EAEA',
  mediaStroke: '#B6BBBC',
  primaryDark: '#171B1D',
  primaryLight: '#8E9497',
  primarySoft: '#EDEFEF',
  accentSoft: '#FAEFE8',
  link: '#A9603A',
  danger: '#C0503C',
  dangerSoft: '#FAEAE6',
  success: '#3F7A5E',
  successSoft: '#E8F1EC',
  warning: '#A9603A',
  amber: '#A9603A',
  amberSoft: '#FAEFE8',
  like: '#C0503C',
  avatarBg: '#EDEFEF',
  avatarText: '#2E3438',
  chatBg: '#FCFDFD',
  bubbleOut: '#2E3438',
  bubbleIn: '#FFFFFF',
  datePill: '#EDEFEF',
  badgeTeamBg: '#EDEFEF',
  badgeTeamFg: '#2E3438',
  badgeEventBg: '#F2EFF5',
  badgeEventFg: '#6B5B7B',
  badgeNoticeBg: '#FAEFE8',
  badgeNoticeFg: '#A9603A',
  ink: '#2E3438',
  inkSoft: '#8E9497',
  sky: '#6B5B7B',
  sun: '#A9603A',
  grape: '#6B5B7B',
  coral: '#A9603A',
};

/** Per-kind colours: foreground / text-on-fill / soft background / ring. */
export const kinds = {
  team: { fg: '#2E3438', on: '#FFFFFF', bg: '#EDEFEF', ring: '#DEE2E2' },
  lost: { fg: '#A9603A', on: '#FFFFFF', bg: '#FAEFE8', ring: '#EFDCCF' },
  notice: { fg: '#6B5B7B', on: '#FFFFFF', bg: '#F2EFF5', ring: '#E4DEEB' },
};

/** Dark counterpart of "Ink & copper" — same keys, so palettes swap wholesale. */
export const inkDark = {
  primary: '#E6EAEB', // light slate carries the active fills on dark
  onPrimary: '#12171A',
  text: '#ECEFF0',
  textMuted: '#8E9497',
  textFaint: '#767C7F',
  textDim: '#666D70',
  page: '#0F1315',
  surface: '#171C1F',
  surfaceAlt: '#141A1D',
  hairline: '#232A2E',
  hairlineAlt: '#202629',
  borderSoft: '#2A3236',
  field: '#1B2124',
  accent: '#C9834F', // copper, lifted so it reads on near-black

  // --- parity aliases (see light palette) ---
  bg: '#0F1315',
  card: '#171C1F',
  white: '#171C1F',
  surfaceMuted: '#1B2124',
  surfaceHi: '#232A2E',
  border: '#2A3236',
  mediaStroke: '#666D70',
  primaryDark: '#ECEFF0',
  primaryLight: '#8E9497',
  primarySoft: '#232B2F',
  accentSoft: '#2C221B',
  link: '#C9834F',
  danger: '#E0705A',
  dangerSoft: '#2E1E1B',
  success: '#5FA484',
  successSoft: '#1B2823',
  warning: '#C9834F',
  amber: '#C9834F',
  amberSoft: '#2C221B',
  like: '#E0705A',
  avatarBg: '#232B2F',
  avatarText: '#DCE1E3',
  chatBg: '#0F1315',
  bubbleOut: '#E6EAEB',
  bubbleIn: '#171C1F',
  datePill: '#232A2E',
  badgeTeamBg: '#232B2F',
  badgeTeamFg: '#DCE1E3',
  badgeEventBg: '#262232',
  badgeEventFg: '#A895BC',
  badgeNoticeBg: '#2C221B',
  badgeNoticeFg: '#C9834F',
  ink: '#E6EAEB',
  inkSoft: '#8E9497',
  sky: '#A895BC',
  sun: '#C9834F',
  grape: '#A895BC',
  coral: '#C9834F',
};

export const kindsDark = {
  team: { fg: '#DCE1E3', on: '#12171A', bg: '#232B2F', ring: '#313A3F' },
  lost: { fg: '#C9834F', on: '#14181B', bg: '#2C221B', ring: '#3D2E23' },
  notice: { fg: '#A895BC', on: '#14181B', bg: '#262232', ring: '#363048' },
};

/** Club category accents — each society gets its own identity colour. */
export const clubAccents = {
  tech:     { fg: '#33708F', bg: '#E6F0F5' },
  cultural: { fg: '#6B5B7B', bg: '#F2EFF5' },
  sports:   { fg: '#3F7A5E', bg: '#E7F1EB' },
  academic: { fg: '#4A5A73', bg: '#EBEEF4' },
  arts:     { fg: '#A9603A', bg: '#FAEFE8' },
  social:   { fg: '#8A5A6B', bg: '#F6EDF0' },
  other:    { fg: '#2E3438', bg: '#EDEFEF' },
};

export const clubAccentsDark = {
  tech:     { fg: '#6FB3D2', bg: '#1B2A32' },
  cultural: { fg: '#A895BC', bg: '#262232' },
  sports:   { fg: '#5FA484', bg: '#1B2823' },
  academic: { fg: '#8DA3C4', bg: '#1E2530' },
  arts:     { fg: '#C9834F', bg: '#2C221B' },
  social:   { fg: '#C08D9E', bg: '#2B1F24' },
  other:    { fg: '#DCE1E3', bg: '#232B2F' },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 14, lg: 18, xl: 22, pill: 999 };
export const layout = { tabBarSpace: 70 }; // clears the floating rounded tab bar
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
