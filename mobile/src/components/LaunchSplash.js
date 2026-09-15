import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Ghost, BODY } from './Mascot';
import { useTheme } from '../context/ThemeContext';

const MASCOT_W = 150;

/**
 * The launch splash, shown on every cold start: the green screen with the
 * mascot, who winks; once the app underneath is ready (`ready`) a circle in
 * the app's background colour wipes out from the mascot while the mascot
 * shrinks away, then the layer fades and `onDone()` fires.
 *
 * `reveal={false}` skips the wipe and simply fades — used on first launch,
 * where the onboarding screen underneath is the same green stage.
 */
export default function LaunchSplash({ ready, reveal = true, onDone }) {
  const { t } = useTheme();
  const { width, height } = useWindowDimensions();
  const lid = useRef(new Animated.Value(0)).current;
  const wipe = useRef(new Animated.Value(0)).current;
  const shrink = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const [winked, setWinked] = useState(false);
  const done = useRef(false);

  // Our layer is up, so the static native splash can go.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    Animated.sequence([
      Animated.delay(450),
      Animated.timing(lid, { toValue: 1, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(140),
      Animated.timing(lid, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.delay(220),
    ]).start(() => setWinked(true));
  }, [lid]);

  // Wink finished and the app is ready underneath → leave.
  useEffect(() => {
    if (!ready || !winked || done.current) return;
    done.current = true;
    const out = reveal
      ? Animated.sequence([
          Animated.parallel([
            Animated.timing(wipe, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(shrink, { toValue: 0, duration: 320, easing: Easing.in(Easing.back(1.2)), useNativeDriver: true }),
          ]),
          Animated.timing(fade, { toValue: 0, duration: 240, useNativeDriver: true }),
        ])
      : Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true });
    out.start(() => onDone?.());
  }, [ready, winked, reveal, wipe, shrink, fade, onDone]);

  const diag = Math.sqrt(width * width + height * height);
  const circle = MASCOT_W + 60;
  const circleScale = wipe.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, (diag * 1.05) / circle] });

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.root, { opacity: fade }]}>
      <Animated.View
        style={[
          styles.circle,
          { backgroundColor: t.bg, width: circle, height: circle, borderRadius: circle / 2, left: width / 2 - circle / 2, top: height / 2 - circle / 2, transform: [{ scale: circleScale }] },
        ]}
      />
      <View style={styles.centre}>
        <Animated.View style={{ transform: [{ scale: shrink }] }}>
          <Ghost width={MASCOT_W} lid={lid} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: BODY, zIndex: 100, elevation: 100 },
  circle: { position: 'absolute' },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
