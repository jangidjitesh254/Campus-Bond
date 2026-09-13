/**
 * Campus Bond design system — "Ember".
 *
 * From the Claude Design handoff: near-black or warm-white grounds lit by a
 * violet and a coral glow, translucent glass cards, a coral gradient for the
 * one action that matters on a screen, and Manrope everywhere.
 *
 * Both palettes share every key, so a screen reads `t.x` and repaints when
 * the mode flips. Translucent values are deliberate: cards and chips sit on
 * top of the glow, so they must let it through.
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
  accent: ['#FF6B45', '#FF9153'],
  avatar: ['#8C7CF0', '#5F4FCF'],
  hero: ['#2B1F4A', '#4A3470'],
};

/** Light — "Home feed (Light)" and friends. */
export const ink = {
  primary: '#14141A', // solid pill buttons, active chips
  onPrimary: '#FFFFFF',
  text: '#14141A',
  textMuted: 'rgba(20,20,26,0.6)',
  textFaint: 'rgba(20,20,26,0.5)',
  textDim: 'rgba(20,20,26,0.42)',
  page: '#F5F4F1',
  surface: 'rgba(255,255,255,0.75)', // glass card
  surfaceAlt: '#EDEAE4', // round icon buttons, reply pill, condition tags
  hairline: 'rgba(20,20,26,0.07)',
  hairlineAlt: 'rgba(20,20,26,0.06)',
  borderSoft: 'rgba(20,20,26,0.12)', // chips, outlined pills
  field: '#EDEAE4',
  accent: '#D2491F', // coral as text: active tab, TODAY, See All
  accentFill: '#FF6B45', // coral as a fill (dots, tags)
  accentSoft: 'rgba(255,107,69,0.14)',

  // glow blobs
  glowA: '#6C4DFF',
  glowB: '#FF6B45',
  glowAOpacity: 0.16,
  glowBOpacity: 0.13,
  glass: 'rgba(255,255,255,0.75)',
  glassBorder: 'rgba(20,20,26,0.08)',
  barGlass: 'rgba(255,255,255,0.78)',

  // --- parity aliases used across screens ---
  bg: '#F5F4F1',
  card: 'rgba(255,255,255,0.75)',
  white: '#FFFFFF',
  surfaceMuted: '#EDEAE4',
  surfaceHi: '#E8E5DF',
  border: 'rgba(20,20,26,0.08)',
  mediaStroke: 'rgba(20,20,26,0.3)',
  primaryDark: '#0A0A0D',
  primaryLight: 'rgba(20,20,26,0.55)',
  primarySoft: 'rgba(20,20,26,0.06)',
  link: '#D2491F',
  danger: '#C1461E',
  dangerSoft: 'rgba(255,107,69,0.14)',
  success: '#1F7A5A',
  successSoft: 'rgba(40,170,120,0.14)',
  warning: '#A85D14',
  amber: '#A85D14',
  amberSoft: 'rgba(255,169,69,0.16)',
  like: '#FF6B45',
  avatarBg: 'rgba(108,77,255,0.16)',
  avatarText: '#5B46D9',
  avatarNeutral: '#E8E5DF',
  chatBg: '#F5F4F1',
  bubbleOut: '#14141A',
  bubbleIn: 'rgba(255,255,255,0.85)',
  datePill: '#EDEAE4',
  badgeTeamBg: 'rgba(20,20,26,0.06)',
  badgeTeamFg: 'rgba(20,20,26,0.72)',
  badgeEventBg: 'rgba(108,77,255,0.16)',
  badgeEventFg: '#5B46D9',
  badgeNoticeBg: 'rgba(255,169,69,0.16)',
  badgeNoticeFg: '#A85D14',
  ink: '#14141A',
  inkSoft: 'rgba(20,20,26,0.55)',
  sky: '#5B46D9',
  sun: '#A85D14',
  grape: '#5B46D9',
  coral: '#D2491F',
};

/** Per-kind colours for feed cards: foreground / text-on-fill / soft background / ring. */
export const kinds = {
  team: { fg: 'rgba(20,20,26,0.72)', on: '#FFFFFF', bg: 'rgba(20,20,26,0.06)', ring: 'rgba(20,20,26,0.12)' },
  lost: { fg: '#A85D14', on: '#FFFFFF', bg: 'rgba(255,169,69,0.16)', ring: 'rgba(255,169,69,0.35)' },
  notice: { fg: '#5B46D9', on: '#FFFFFF', bg: 'rgba(108,77,255,0.16)', ring: 'rgba(108,77,255,0.3)' },
};

/** Dark — the primary artboards. */
export const inkDark = {
  primary: '#F6F5F3',
  onPrimary: '#0A0A0D',
  text: '#F6F5F3',
  textMuted: 'rgba(246,245,243,0.5)',
  textFaint: 'rgba(246,245,243,0.4)',
  textDim: 'rgba(246,245,243,0.36)',
  page: '#0A0A0D',
  surface: 'rgba(255,255,255,0.045)',
  surfaceAlt: '#17171B',
  hairline: 'rgba(255,255,255,0.06)',
  hairlineAlt: 'rgba(255,255,255,0.08)',
  borderSoft: 'rgba(255,255,255,0.1)',
  field: '#1E1E23',
  accent: '#FF6B45',
  accentFill: '#FF6B45',
  accentSoft: 'rgba(255,107,69,0.16)',

  glowA: '#6C4DFF',
  glowB: '#FF6B45',
  glowAOpacity: 0.4,
  glowBOpacity: 0.32,
  glass: 'rgba(255,255,255,0.045)',
  glassBorder: 'rgba(255,255,255,0.09)',
  barGlass: 'rgba(24,22,29,0.72)',

  // --- parity aliases ---
  bg: '#0A0A0D',
  card: 'rgba(255,255,255,0.045)',
  white: '#17171B',
  surfaceMuted: '#1E1E23',
  surfaceHi: '#232028',
  border: 'rgba(255,255,255,0.09)',
  mediaStroke: 'rgba(246,245,243,0.3)',
  primaryDark: '#F6F5F3',
  primaryLight: 'rgba(246,245,243,0.55)',
  primarySoft: 'rgba(255,255,255,0.08)',
  link: '#FF6B45',
  danger: '#FF7A5C',
  dangerSoft: 'rgba(255,107,69,0.16)',
  success: '#5FD3A0',
  successSoft: 'rgba(60,200,140,0.16)',
  warning: '#FFB25C',
  amber: '#FFB25C',
  amberSoft: 'rgba(255,169,69,0.16)',
  like: '#FF6B45',
  avatarBg: 'rgba(140,124,240,0.22)',
  avatarText: '#A99BFF',
  avatarNeutral: '#232028',
  chatBg: '#0A0A0D',
  bubbleOut: '#F6F5F3',
  bubbleIn: '#1E1E23',
  datePill: '#1E1E23',
  badgeTeamBg: 'rgba(255,255,255,0.08)',
  badgeTeamFg: 'rgba(246,245,243,0.7)',
  badgeEventBg: 'rgba(140,124,240,0.22)',
  badgeEventFg: '#A99BFF',
  badgeNoticeBg: 'rgba(255,169,69,0.16)',
  badgeNoticeFg: '#FFB25C',
  ink: '#F6F5F3',
  inkSoft: 'rgba(246,245,243,0.55)',
  sky: '#A99BFF',
  sun: '#FFB25C',
  grape: '#A99BFF',
  coral: '#FF6B45',
};

export const kindsDark = {
  team: { fg: 'rgba(246,245,243,0.7)', on: '#0A0A0D', bg: 'rgba(255,255,255,0.08)', ring: 'rgba(255,255,255,0.16)' },
  lost: { fg: '#FFB25C', on: '#0A0A0D', bg: 'rgba(255,169,69,0.16)', ring: 'rgba(255,169,69,0.35)' },
  notice: { fg: '#A99BFF', on: '#0A0A0D', bg: 'rgba(140,124,240,0.22)', ring: 'rgba(140,124,240,0.4)' },
};

/** Club category accents — Social and Arts are from the handoff; the rest follow the same tint recipe. */
export const clubAccents = {
  tech:     { fg: '#5B46D9', bg: 'rgba(108,77,255,0.16)' },
  cultural: { fg: '#C43C68', bg: 'rgba(255,107,140,0.16)' },
  sports:   { fg: '#1F7A5A', bg: 'rgba(40,170,120,0.16)' },
  academic: { fg: '#2F6FE0', bg: 'rgba(47,111,224,0.14)' },
  arts:     { fg: '#A85D14', bg: 'rgba(255,169,69,0.16)' },
  social:   { fg: '#C43C68', bg: 'rgba(255,107,140,0.16)' },
  other:    { fg: 'rgba(20,20,26,0.72)', bg: 'rgba(20,20,26,0.06)' },
};

export const clubAccentsDark = {
  tech:     { fg: '#A99BFF', bg: 'rgba(140,124,240,0.22)' },
  cultural: { fg: '#FF7FA0', bg: 'rgba(255,107,140,0.16)' },
  sports:   { fg: '#5FD3A0', bg: 'rgba(60,200,140,0.16)' },
  academic: { fg: '#7FA8FF', bg: 'rgba(80,140,255,0.18)' },
  arts:     { fg: '#FFB25C', bg: 'rgba(255,169,69,0.16)' },
  social:   { fg: '#FF7FA0', bg: 'rgba(255,107,140,0.16)' },
  other:    { fg: 'rgba(246,245,243,0.7)', bg: 'rgba(255,255,255,0.08)' },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 };
export const layout = { tabBarSpace: 96 }; // clears the floating pill tab bar
// Eyebrow labels used to be monospace; the handoff sets them in Manrope with tracking.
export const monoFamily = 'Manrope_700Bold';

export const font = {
  h1: { fontSize: 27, fontWeight: '800', color: ink.text },
  h2: { fontSize: 22, fontWeight: '800', color: ink.text },
  h3: { fontSize: 18, fontWeight: '800', color: ink.text },
  body: { fontSize: 14.5, fontWeight: '600', lineHeight: 22, color: ink.text },
  bodyMuted: { fontSize: 14.5, fontWeight: '600', lineHeight: 22, color: ink.textMuted },
  small: { fontSize: 13, fontWeight: '600', color: ink.textMuted },
  label: { fontSize: 13, fontWeight: '700', color: ink.text },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: ink.accent, textTransform: 'uppercase' },
};

/**
 * Shadows. On Android an `elevation` shadow on a view with a translucent
 * background is drawn *inside* the view (a pale rectangle inset by the
 * padding), so glass surfaces get no elevation there — the 1px border
 * carries the edge and iOS keeps the real shadow. `glow` is for opaque
 * gradient fills only (the + button, coral CTAs), where elevation is safe.
 */
export const shadow = {
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 0 },
  soft: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 0 },
  glow: { shadowColor: '#FF6B45', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 6 },
};
