import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Pressable, BackHandler, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import SideMenu from '../components/SideMenu';
import { useTheme, useStyles } from './ThemeContext';

const MenuContext = createContext(null);

// How far the screen slides aside, as a share of the screen width (Threads-style).
const REVEAL = 0.78;
// A rightward swipe that starts within this many px of the left edge opens the menu.
const EDGE = 20;

/**
 * Hosts the side menu *under* the whole tab UI (screens and the bottom bar
 * alike). `open()` slides the whole screen to the right, full height, and
 * the menu sits beneath. Any screen can call `useMenu().open()`.
 *
 * Also owns `chrome`: 0 = bottom bar shown, 1 = hidden. Feeds drive it as
 * the student scrolls (down hides, up reveals); the bar reads it.
 */
export function MenuHost({ navigation, children }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { width } = useWindowDimensions();
  const [isOpen, setOpen] = useState(false);
  const openRef = useRef(false); // mirror for gesture callbacks
  const slide = useRef(new Animated.Value(0)).current; // 0 = in place, 1 = pushed aside
  const travel = width * REVEAL;
  const chrome = useRef(new Animated.Value(0)).current; // 0 = bottom bar shown, 1 = hidden
  const chromeHidden = useRef(false);

  function setChrome(hidden) {
    if (chromeHidden.current === hidden) return;
    chromeHidden.current = hidden;
    Animated.spring(chrome, { toValue: hidden ? 1 : 0, damping: 22, stiffness: 220, mass: 0.7, useNativeDriver: true }).start();
  }

  function animate(open) {
    // A gentle spring reads as a real drawer, not a slideshow.
    Animated.spring(slide, {
      toValue: open ? 1 : 0,
      damping: 24,
      stiffness: 190,
      mass: 0.9,
      overshootClamping: true,
      useNativeDriver: true,
    }).start();
  }

  function settle(open, haptic = true) {
    if (haptic) Haptics.impactAsync(open ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    openRef.current = open;
    setOpen(open);
    animate(open);
  }

  // Swipe: from the left edge to open, leftwards anywhere to close. The
  // sheet follows the finger and springs to whichever side is nearer (or
  // the way the finger was flicking) on release. Two detectors because
  // failing a gesture by hand needs reanimated: a thin edge strip carries
  // the open pan, the whole host carries the close pan while open.
  function follow(e) {
    const base = openRef.current ? 1 : 0;
    slide.setValue(Math.max(0, Math.min(1, base + e.translationX / travel)));
  }
  function release(e) {
    const base = openRef.current ? 1 : 0;
    const p = Math.max(0, Math.min(1, base + e.translationX / travel));
    const open = e.velocityX > 400 ? true : e.velocityX < -400 ? false : p > 0.5;
    settle(open, open !== openRef.current);
  }
  const openPan = useMemo(
    () => Gesture.Pan().activeOffsetX(12).failOffsetY([-18, 18]).onUpdate(follow).onEnd(release).runOnJS(true),
    [travel] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const closePan = useMemo(
    () => Gesture.Pan().enabled(isOpen).activeOffsetX(-12).failOffsetY([-18, 18]).onUpdate(follow).onEnd(release).runOnJS(true),
    [travel, isOpen] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const api = useMemo(
    () => ({
      isOpen,
      chrome,
      setChrome,
      open() {
        settle(true);
      },
      close() {
        settle(false);
      },
    }),
    [isOpen] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Android back closes the menu instead of leaving the screen.
  useEffect(() => {
    if (!isOpen) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      api.close();
      return true;
    });
    return () => sub.remove();
  }, [isOpen, api]);

  function goTab(tab, params) {
    navigation.navigate('Tabs', { screen: tab, params });
  }

  const sheet = {
    transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [0, width * REVEAL] }) }],
  };

  return (
    <MenuContext.Provider value={api}>
      <GestureDetector gesture={closePan}>
      <View style={styles.root}>
        <SideMenu visible={isOpen} width={width * REVEAL} onClose={api.close} onNavigate={goTab} />

        <Animated.View style={[styles.sheet, sheet]}>
          {children}
          {/* While pushed aside, any tap on the card brings it back */}
          {isOpen ? <Pressable style={StyleSheet.absoluteFill} onPress={api.close} /> : null}
        </Animated.View>

        {/* Invisible strip along the left edge (below the header) that catches the open swipe */}
        {!isOpen ? (
          <GestureDetector gesture={openPan}>
            <View style={styles.edge} />
          </GestureDetector>
        ) : null}
      </View>
      </GestureDetector>
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used inside <MenuHost>');
  return ctx;
}

const makeStyles = (colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    edge: { position: 'absolute', left: 0, top: 110, bottom: 0, width: EDGE },
    sheet: {
      flex: 1,
      backgroundColor: colors.surface,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: colors.border,
      shadowColor: '#0B1A10',
      shadowOffset: { width: -6, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 12,
    },
  });
