import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Modal } from 'react-native';
import { Text } from './Text';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { spacing, fontFor } from '../theme';
import { useTheme, useStyles } from '../context/ThemeContext';

/**
 * Full-screen check-mark celebration shown after login / signup succeeds.
 *
 * Rendered in its own opaque Modal window so it sits above the native
 * navigation screens (a plain absolutely-positioned View loses to
 * react-native-screens on Android and ended up behind the login form, and a
 * transparent modal still let the form show through). It outlives the auth
 * screens:
 *   1. the window fades in + success haptic, play the Lottie once
 *   2. `onDone()` — the session is activated and the app mounts underneath
 *   3. the content zooms out, the window fades away over the new screen, then `onHidden()`
 */
export default function SuccessOverlay({ title, subtitle = 'Welcome to Campus Bond 🎓', onDone, onHidden }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [open, setOpen] = useState(true);
  const fade = useRef(new Animated.Value(0)).current;
  const zoom = useRef(new Animated.Value(1)).current;
  const finished = useRef(false);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();

    // Haptic pattern timed to the animation: a soft tap as it appears, a firm
    // thump as the check-mark lands, then the system "success" buzz.
    const buzz = (fn) => fn().catch(() => {});
    const timers = [
      setTimeout(() => buzz(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)), 0),
      setTimeout(() => buzz(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)), 520),
      setTimeout(() => buzz(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)), 720),
      // Safety net in case the animation never reports finishing (e.g. web).
      setTimeout(finish, 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function finish() {
    if (finished.current) return;
    finished.current = true;
    onDone?.(); // app switches underneath us
    // Let the new screen paint, zoom the content out, then the window itself fades away.
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(zoom, { toValue: 1.12, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start(() => {
        setOpen(false);
        setTimeout(() => onHidden?.(), 320); // the modal's own fade-out
      });
    }, 250);
  }

  return (
    <Modal visible={open} transparent={false} backdropColor={colors.bg} animationType="fade" statusBarTranslucent navigationBarTranslucent hardwareAccelerated onRequestClose={() => {}}>
      {/* Opaque window: the sheet is the full window, never see-through */}
      <View style={styles.sheet}>
      <Animated.View style={[styles.overlay, { opacity: fade }]} pointerEvents="none">
        <Animated.View style={{ alignItems: 'center', transform: [{ scale: zoom }] }}>
        <LottieView
          source={require('../../assets/animations/checkMark.json')}
          autoPlay
          loop={false}
          speed={1.5}
          style={styles.lottie}
          onAnimationFinish={finish}
        />
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </Animated.View>
      </Animated.View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors, isDark) => {
  const font = fontFor(colors);
  return StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.bg },
  overlay: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  lottie: { width: 220, height: 220 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: spacing.sm, textAlign: 'center' },
  subtitle: { ...font.bodyMuted, marginTop: 6, textAlign: 'center' },
});
};
