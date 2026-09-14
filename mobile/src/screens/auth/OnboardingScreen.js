import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Polygon } from 'react-native-svg';
import { Ghost, GhostSticker, BODY } from '../../components/Mascot';
import { Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, font } from '../../theme';

const MASCOT_W = 150;

/* ------------------------------------------------------------------ */
/*  Layout data                                                        */
/* ------------------------------------------------------------------ */

// Sticker positions as fractions of the stage; sizes in px.
const STICKERS = [
  { variant: 'wink', x: 0.06, y: 0.06, size: 66, extra: <Path d="M78 22 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#F4C542" /> },
  { variant: 'glasses', x: 0.7, y: 0.03, size: 74 },
  { variant: 'happy', x: 0.8, y: 0.5, size: 66, extra: <Path d="M76 60 l4 -4 4 4 -4 5z M82 62 c6 -6 12 0 6 6 -6 6 -12 0 -6 -6z" fill="#EF5B54" /> },
  { variant: 'cool', x: 0.0, y: 0.56, size: 70 },
  { variant: 'kiss', x: 0.18, y: 0.86, size: 62 },
  { variant: 'surprised', x: 0.62, y: 0.86, size: 66 },
];

// Confetti bits, like the reference: orange dot, cyan triangle, purple squiggle.
function Bits({ stage }) {
  return (
    <>
      <View style={{ position: 'absolute', left: 0.42 * stage.w, top: 0.0 * stage.h, width: 16, height: 16, borderRadius: 8, backgroundColor: '#F4A340' }} />
      <Svg style={{ position: 'absolute', left: 0.9 * stage.w, top: 0.9 * stage.h }} width={26} height={26} viewBox="0 0 26 26">
        <Polygon points="3,2 24,13 3,24" fill="#8EE0EE" strokeLinejoin="round" stroke="#8EE0EE" strokeWidth={5} />
      </Svg>
      <Svg style={{ position: 'absolute', left: 0.02 * stage.w, top: 0.4 * stage.h }} width={30} height={16} viewBox="0 0 30 16">
        <Path d="M2 10 c4 -10 8 -10 12 0 s8 10 12 0" stroke="#B49CF2" strokeWidth={4} strokeLinecap="round" fill="none" />
      </Svg>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function OnboardingScreen({ navigation }) {
  const { completeOnboarding } = useAuth();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const lid = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  const heading = useRef(new Animated.Value(0)).current;
  const cta = useRef(new Animated.Value(0)).current;
  const pops = useRef(STICKERS.map(() => new Animated.Value(0))).current;
  const move = useRef(new Animated.Value(0)).current; // 0 = screen centre, 1 = final slot

  // The mascot's final slot on screen. It starts at the screen centre (where the
  // reveal circle grows from) and glides up into this slot after the reveal.
  const [slotY, setSlotY] = useState(null);
  const mascotRef = useRef(null);

  useEffect(() => {
    Animated.sequence([
      // 1. wink on the green splash
      Animated.delay(500),
      Animated.timing(lid, { toValue: 1, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(140),
      Animated.timing(lid, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.delay(260),
      // 2. circle reveal
      Animated.timing(reveal, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      // 3. mascot glides up to its slot
      Animated.timing(move, { toValue: 1, duration: 520, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      // 4. heading, stickers, CTA
      Animated.parallel([
        Animated.timing(heading, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ...pops.map((v, i) => Animated.spring(v, { toValue: 1, delay: 100 + i * 60, friction: 5, tension: 100, useNativeDriver: true })),
        Animated.timing(cta, { toValue: 1, duration: 400, delay: 380, useNativeDriver: true }),
      ]),
    ]).start();
  }, [lid, reveal, heading, cta, pops, move]);

  function go(screen) {
    completeOnboarding();
    navigation.replace(screen);
  }

  const diag = Math.sqrt(width * width + height * height);
  const circle = MASCOT_W + 60;
  const circleScale = reveal.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, (diag * 1.05) / circle] });
  const shadowOpacity = reveal.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0, 1] });
  const headingY = heading.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });
  const centreY = height / 2;
  const startOffset = slotY == null ? 0 : centreY - slotY;
  const mascotY = move.interpolate({ inputRange: [0, 1], outputRange: [startOffset, 0] });

  const stage = { w: Math.min(width - spacing.xl * 2, 360), h: Math.min(330, height * 0.42) };

  return (
    <View style={styles.root}>
      {/* Green splash layer + expanding pale circle */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: BODY }]} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.circle,
          { width: circle, height: circle, borderRadius: circle / 2, left: width / 2 - circle / 2, top: centreY - circle / 2, transform: [{ scale: circleScale }] },
        ]}
      />

      {/* Heading */}
      <Animated.View style={[styles.head, { paddingTop: insets.top + 48, opacity: heading, transform: [{ translateY: headingY }] }]}>
        <Text style={styles.title}>Welcome! Ready to meet{'\n'}everyone on your campus?</Text>
      </Animated.View>

      {/* Stage */}
      <View style={[styles.stage, { width: stage.w, height: stage.h }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: cta }]}>
          <Bits stage={stage} />
        </Animated.View>

        {STICKERS.map((st, i) => (
          <Animated.View
            key={st.variant}
            style={{ position: 'absolute', left: st.x * stage.w, top: st.y * stage.h, opacity: pops[i], transform: [{ scale: pops[i] }] }}
          >
            <GhostSticker variant={st.variant} size={st.size} extra={st.extra} />
          </Animated.View>
        ))}

        <Animated.View
          ref={mascotRef}
          style={[styles.mascotWrap, { opacity: slotY == null ? 0 : 1, transform: [{ translateY: mascotY }] }]}
          onLayout={() => mascotRef.current?.measureInWindow((_x, y) => setSlotY(y + (MASCOT_W * 1.2) / 2))}
        >
          <Ghost lid={lid} />
          <Animated.View style={[styles.shadow, { opacity: shadowOpacity }]} />
        </Animated.View>
      </View>

      <View style={{ flex: 1 }} />

      {/* CTA */}
      <Animated.View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, spacing.lg), opacity: cta }]}>
        <Button title="Yes, let's go!" onPress={() => go('Register')} />
        <TouchableOpacity style={styles.footer} onPress={() => go('Login')}>
          <Text style={font.bodyMuted}>Already have an account? </Text>
          <Text style={styles.link}>Log in</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BODY },
  circle: { position: 'absolute', backgroundColor: colors.bg },
  head: { paddingHorizontal: spacing.xl, alignItems: 'center' },
  title: { fontSize: 22, lineHeight: 30, fontWeight: '700', color: colors.text, textAlign: 'center' },
  stage: { alignSelf: 'center', marginTop: 22, alignItems: 'center', justifyContent: 'center' },
  mascotWrap: { alignItems: 'center' },
  shadow: { width: 96, height: 10, borderRadius: 5, backgroundColor: colors.surfaceHi, marginTop: 8 },
  bottom: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  link: { color: colors.accent, fontWeight: '700' },
});

