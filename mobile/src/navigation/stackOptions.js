import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Native-stack header options in the active palette. A hook rather than a
 * constant, so headers repaint when the theme is toggled. The native header
 * is not one of our Text components, so it names the Manrope file directly.
 */
export function useStackOptions() {
  const { t } = useTheme();
  // Memoised so navigators don't see a new options object on every render.
  return useMemo(
    () => ({
      headerStyle: { backgroundColor: t.surface },
      headerShadowVisible: false,
      headerTintColor: t.text,
      headerTitleStyle: { color: t.text, fontFamily: 'Manrope_700Bold', fontSize: 17 },
      headerBackTitleStyle: { fontFamily: 'Manrope_600SemiBold' },
      contentStyle: { backgroundColor: t.surface },
    }),
    [t]
  );
}
