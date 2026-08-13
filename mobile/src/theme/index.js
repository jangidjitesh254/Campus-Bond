import { Platform } from 'react-native';

/**
 * Campus Bond design system — "Fresh" theme.
 * Light, airy surfaces with a vivid apple-green accent, near-black text,
 * white cards, and a dark feature banner. Matches the reference home screen.
 */

export const colors = {
  // Surfaces
  bg: '#F6F8F2', // page background (subtle warm off-white)
  surface: '#FFFFFF', // cards
  surfaceAlt: '#EEF6E2', // light-green tint (icon circles, chips, inputs)
  surfaceHi: '#E3F0D0', // stronger tint / pressed
  border: '#ECEEE8', // hairline

  // Secondary brand color: a deep forest-green that reads as near-black.
  // Used for banners, the profile avatar, and dark accents to balance the green.
  dark: '#16241B',
  darkSoft: '#223529', // slightly lifted dark (dark cards / chips)
  onDarkMuted: 'rgba(255,255,255,0.7)',

  // Brand accent (apple green)
  primary: '#7CC03D',
  primaryDark: '#63A62B',
  primaryLight: '#A6DA6E',
  primarySoft: '#EAF5DA', // light green circle backgrounds
  onPrimary: '#FFFFFF', // text/icon on green
  accent: '#7CC03D', // alias
  accentSoft: '#EAF5DA',

  teal: '#3FB6A8',

  // Semantic
  success: '#5FB63B',
  successSoft: '#E7F4DA',
  danger: '#EF5B54',
  dangerSoft: '#FDE9E8',
  warning: '#F0A32E',
  warningSoft: '#FCEFDA',

  // Text
  text: '#1A1D1A', // near-black
  textMuted: '#8A8F86', // gray
  textFaint: '#B3B8AF', // faint gray

  // Legacy aliases
  card: '#FFFFFF',
  white: '#FFFFFF',
  onDark: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 26,
  pill: 999,
};

// Bottom clearance so scroll content isn't hidden under the floating tab bar.
export const layout = {
  tabBarSpace: 104,
};

export const monoFamily = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });

export const font = {
  h1: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  h3: { fontSize: 17, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, fontWeight: '400', color: colors.text },
  bodyMuted: { fontSize: 15, fontWeight: '400', color: colors.textMuted },
  small: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  mono: {
    fontFamily: monoFamily,
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
};

export const shadow = {
  card: {
    shadowColor: '#2B3A1F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  soft: {
    shadowColor: '#2B3A1F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
};

export default { colors, spacing, radius, font, shadow, monoFamily };
