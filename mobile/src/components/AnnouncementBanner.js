import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { GhostMark } from './Mascot';
import { colors } from '../theme';

const GAP = 10;
const SIDE = 16;

/** Card colours per tone. `brand` is the one loud card; the rest stay quiet. */
const TONES = {
  brand: { bg: colors.primary, fg: colors.onPrimary, muted: 'rgba(255,255,255,0.72)', pill: 'rgba(255,255,255,0.16)', pillFg: colors.onPrimary, btn: colors.onPrimary, btnFg: colors.primary },
  amber: { bg: colors.amberSoft, fg: colors.text, muted: colors.textMuted, pill: 'rgba(198,137,46,0.16)', pillFg: colors.amber, btn: colors.text, btnFg: colors.surface },
  blue: { bg: colors.badgeEventBg, fg: colors.text, muted: colors.textMuted, pill: 'rgba(47,111,224,0.14)', pillFg: colors.badgeEventFg, btn: colors.text, btnFg: colors.surface },
  neutral: { bg: colors.surfaceMuted, fg: colors.text, muted: colors.textMuted, pill: colors.surface, pillFg: colors.textMuted, btn: colors.text, btnFg: colors.surface },
};

const TAG_ICON = { Hackathon: 'code-slash', Fest: 'sparkles', Exams: 'school', Placements: 'briefcase', Notice: 'megaphone' };

/**
 * Paged carousel of campus announcements for the top of Home. Swipes one
 * card at a time, auto-advances every few seconds until the student
 * touches it, and shows a dot per card underneath.
 */
export default function AnnouncementBanner({ items, onPress }) {
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
        {items.map((a) => {
          const tone = TONES[a.tone] || TONES.neutral;
          return (
            <TouchableOpacity key={a._id} style={[styles.card, { width: cardW, backgroundColor: tone.bg }]} activeOpacity={0.9} onPress={() => open(a)}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={[styles.pill, { backgroundColor: tone.pill }]}>
                  <Ionicons name={`${TAG_ICON[a.tag] || 'megaphone'}-outline`} size={11} color={tone.pillFg} />
                  <Text style={[styles.pillText, { color: tone.pillFg }]}>{a.tag || 'Notice'}</Text>
                </View>
                <Text style={[styles.title, { color: tone.fg }]} numberOfLines={2}>{a.title}</Text>
                {a.body ? <Text style={[styles.body, { color: tone.muted }]} numberOfLines={2}>{a.body}</Text> : null}
                {a.cta ? (
                  <View style={[styles.btn, { backgroundColor: tone.btn }]}>
                    <Text style={[styles.btnText, { color: tone.btnFg }]}>{a.cta}</Text>
                    <Ionicons name="arrow-forward" size={13} color={tone.btnFg} />
                  </View>
                ) : null}
              </View>
              {a.tone === 'brand' ? (
                <View style={styles.mascot}>
                  <GhostMark width={56} color={colors.onPrimary} bg={colors.primary} variant="happy" />
                </View>
              ) : null}
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

const styles = StyleSheet.create({
  wrap: { paddingTop: 12, paddingBottom: 6 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 16, minHeight: 132 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  title: { fontSize: 16.5, fontWeight: '800', lineHeight: 21, marginTop: 8 },
  body: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, marginTop: 10 },
  btnText: { fontSize: 12.5, fontWeight: '700' },
  mascot: { width: 64, alignItems: 'center', justifyContent: 'center', opacity: 0.9 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.surfaceHi },
  dotOn: { width: 16, backgroundColor: colors.text },
});
