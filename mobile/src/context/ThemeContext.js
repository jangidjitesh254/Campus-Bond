import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ink, inkDark, kinds as kindsLight, kindsDark, clubAccents, clubAccentsDark } from '../theme';

const KEY = 'campusbond_theme';
const ThemeContext = createContext(null);

/**
 * Light / dark palette switch. The choice is persisted so the app opens in the
 * mode the student last chose. `t` is the active palette and `kinds` the active
 * per-post colours — both share their key names across modes, so screens just
 * read from them rather than branching on the mode.
 */
export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState('light');

  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then((saved) => {
        if (saved === 'dark' || saved === 'light') setModeState(saved);
      })
      .catch(() => {});
  }, []);

  const value = useMemo(() => {
    const isDark = mode === 'dark';
    function setMode(next) {
      setModeState(next);
      SecureStore.setItemAsync(KEY, next).catch(() => {});
    }
    return {
      mode,
      isDark,
      t: isDark ? inkDark : ink,
      kinds: isDark ? kindsDark : kindsLight,
      clubs: isDark ? clubAccentsDark : clubAccents,
      setMode,
      toggle: () => setMode(isDark ? 'light' : 'dark'),
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
