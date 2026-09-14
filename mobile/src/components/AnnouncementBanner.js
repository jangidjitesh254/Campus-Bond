import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { GhostMark } from './Mascot';
import { useTheme, useStyles } from '../context/ThemeContext';

const GAP = 12; // equal to SIDE, so the neighbouring card never peeks in
const SIDE = 12;
const HEIGHT = 180;

/** Card colours per tone. `brand` is the one loud card; the rest stay quiet. */
const tonesFor = (colors, isDark) => ({
  brand: {
    gradient: ['#123F25', '#1B6B3C'],
    fg: '#FFFFFF',
    muted: 'rgba(255,255,255,0.74)',
    pill: 'rgba(255,255,255,0.16)',
    pillFg: '#FFFFFF',
    btn: '#FFFFFF',
    btnFg: '#15532E',
    blob: 'rgba(255,255,255,0.08)',
    mark: 'rgba(255,255,255,0.14)',
  },
  amber: {
    gradient: isDark ? ['#33260F', '#463314'] : ['#FFF4DF', '#FBE3B8'],
    fg: colors.text,
    muted: colors.textMuted,
    pill: 'rgba(198,137,46,0.18)',
    pillFg: colors.amber,
    btn: colors.text,
    btnFg: colors.surface,
    blob: 'rgba(198,137,46,0.1)',
    mark: 'rgba(198,137,46,0.16)',
  },
  blue: {
    gradient: isDark ? ['#14213A', '#1A2D4D'] : ['#EAF1FE', '#D4E2FA'],
    fg: colors.text,
    muted: colors.textMuted,
    pill: 'rgba(47,111,224,0.16)',
    pillFg: colors.badgeEventFg,
    btn: colors.text,
    btnFg: colors.surface,
    blob: 'rgba(47,111,224,0.1)',
    mark: 'rgba(47,111,224,0.16)',
  },
  neutral: {
    gradient: isDark ? ['#16211A', '#1E2C23'] : ['#F1F6EE', '#DFEBE1'],
    fg: colors.text,
    muted: colors.textMuted,
    pill: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
    pillFg: colors.textMuted,
    btn: colors.text,
    btnFg: colors.surface,
    blob: 'rgba(21,83,46,0.07)',
    mark: 'rgba(21,83,46,0.12)',
  },
});

const TAG_ICON = { Hackathon: 'code-slash', Fest: 'sparkles', Exams: 'school', Placements: 'briefcase', Notice: 'megaphone' };

/** "3 days left" / "Last day" — from expiresAt, if any. */
function endsIn(a) {
  if (!a.expiresAt) return null;
  const d = Math.ceil((new Date(a.expiresAt) - Date.now()) / 86400000);
  if (d <= 0) return null;
  if (d === 1) return 'Last day';
  if (d < 14) return `${d} days left`;
  return `${Math.round(d / 7)} weeks left`;
}

/**
 * Paged carousel of campus announcements for the top of Home. Each card is
 * a soft gradient with decorative circles and a big faint icon watermark;
 * the headline (`brand`) card is deep green with the mascot. Swipes one
 * card at a time, auto-advances every few seconds until touched, and shows
 * a dot per card underneath.
 */
export default function AnnouncementBanner({ items, onPress }) {
  const { t: colors, isDark } = useTheme();
  const styles = useStyles(makeStyles);
  const TONES = tonesFor(colors, isDark);
  const { width } = useWindowDimensions();
  const cardW = width - SIDE * 2;
  const step = cardW + GAP;
  const scroll = useRef(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0); // the dots follow the real scroll offset
  const touched = useRef(false);

  // Auto-advance until the student interacts.
  useEffect(() => {
    if (!items || items.length < 2) return undefined;
    const id = setInterval(() => {
      if (touched.current) return;
      const next = (indexRef.current + 1) % items.length;
      scroll.current?.scrollTo({ x: next * step, animated: true });
    }, 5000);
    return () => clearInterval(id);
  }, [items, step]);

  function onScroll(e) {
    const i = Math.max(0, Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.x / step)));
    if (i !== indexRef.current) {
      indexRef.current = i;
      setIndex(i);
    }
  }

  if (!items?.length) return null;

  function open(a) {
    if (onPress) return onPress(a);
    if (a.link) Linking.openURL(a.link).catch(() => {});
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: SIDE, gap: GAP }}
        onScrollBeginDrag={() => { touched.current = true; }}
        onScroll={onScroll}
        scrollEventThrottle={64}
      >
        {items.map((a, i) => {
          const tone = TONES[a.tone] || TONES.neutral;
          const icon = TAG_ICON[a.tag] || 'megaphone';
          const left = endsIn(a);
          return (
            <TouchableOpacity key={a._id} style={[styles.card, { width: cardW }]} activeOpacity={0.9} onPress={() => open(a)}>
              <LinearGradient colors={tone.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

              {/* Decoration: two soft circles and a big faint icon behind the text */}
              <View style={[styles.blob, { backgroundColor: tone.blob }]} />
              {a.tone === 'brand' ? (
                <View style={styles.mascot}>
                  <GhostMark width={44} color="rgba(255,255,255,0.9)" bg="#15532E" variant="happy" />
                </View>
              ) : (
                <Ionicons name={icon} size={96} color={tone.mark} style={styles.mark} />
              )}

              <View style={styles.inner}>
                <View style={[styles.pill, { backgroundColor: tone.pill }]}>
                  <Ionicons name={`${icon}-outline`} size={11} color={tone.pillFg} />
                  <Text style={[styles.pillText, { color: tone.pillFg }]}>{a.tag || 'Notice'}</Text>
                </View>

                <View style={styles.textCol}>
                  <Text style={[styles.title, { color: tone.fg }]} numberOfLines={2}>{a.title}</Text>
                  {a.body ? <Text style={[styles.body, { color: tone.muted }]} numberOfLines={1}>{a.body}</Text> : null}
                </View>

                <View style={styles.bottomRow}>
                  {a.cta ? (
                    <View style={[styles.btn, { backgroundColor: tone.btn }]}>
                      <Text style={[styles.btnText, { color: tone.btnFg }]}>{a.cta}</Text>
                      <Ionicons name="arrow-forward" size={13} color={tone.btnFg} />
                    </View>
                  ) : null}
                  {left ? <Text style={[styles.left, { color: tone.muted }]}>{left}</Text> : null}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((a, i) => (
            <View key={a._id} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (colors, isDark) => {
  return StyleSheet.create({
  wrap: { paddingTop: 12, paddingBottom: 6 },
  card: { height: HEIGHT, borderRadius: 20, overflow: 'hidden' },
  inner: { flex: 1, paddingHorizontal: 18, paddingVertical: 18, justifyContent: 'space-between' },
  blob: { position: 'absolute', width: 200, height: 200, borderRadius: 100, right: -80, top: -100 },
  mark: { position: 'absolute', right: 14, bottom: 14, transform: [{ rotate: '-10deg' }] },
  mascot: { position: 'absolute', right: 16, bottom: 14 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  textCol: { paddingRight: 70, gap: 6 },
  title: { fontSize: 18, fontWeight: '800', lineHeight: 23 },
  body: { fontSize: 13, lineHeight: 18 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  btnText: { fontSize: 13, fontWeight: '700' },
  left: { fontSize: 12, fontWeight: '600' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.surfaceHi },
  dotOn: { width: 16, backgroundColor: colors.text },
});
};
