import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Pressable, BackHandler, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import SideMenu from '../components/SideMenu';
import { useTheme, useStyles } from './ThemeContext';

const MenuContext = createContext(null);

// How far the screen slides aside, as a share of the screen width (Threads-style).
const REVEAL = 0.87;

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
  const slide = useRef(new Animated.Value(0)).current; // 0 = in place, 1 = pushed aside
  const chrome = useRef(new Animated.Value(0)).current; // 0 = bottom bar shown, 1 = hidden
  const chromeHidden = useRef(false);

  function setChrome(hidden) {
    if (chromeHidden.current === hidden) return;
    chromeHidden.current = hidden;
    Animated.timing(chrome, { toValue: hidden ? 1 : 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }

  function animate(open) {
    Animated.timing(slide, {
      toValue: open ? 1 : 0,
      duration: open ? 340 : 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  const api = useMemo(
    () => ({
      isOpen,
      chrome,
      setChrome,
      open() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        setOpen(true);
        animate(true);
      },
      close() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setOpen(false);
        animate(false);
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
      <View style={styles.root}>
        <SideMenu visible={isOpen} width={width * REVEAL} onClose={api.close} onNavigate={goTab} />

        <Animated.View style={[styles.sheet, sheet]}>
          {children}
          {/* While pushed aside, any tap on the card brings it back */}
          {isOpen ? <Pressable style={StyleSheet.absoluteFill} onPress={api.close} /> : null}
        </Animated.View>
      </View>
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
