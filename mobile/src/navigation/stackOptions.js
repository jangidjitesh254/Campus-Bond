import { useTheme } from '../context/ThemeContext';

/**
 * Native-stack header options in the active palette. A hook rather than a
 * constant, so headers repaint when the theme is toggled.
 */
export function useStackOptions() {
  const { t } = useTheme();
  return {
    headerStyle: { backgroundColor: t.page },
    headerShadowVisible: false,
    headerTintColor: t.text,
    headerTitleStyle: { color: t.text, fontWeight: '700', fontSize: 17 },
    contentStyle: { backgroundColor: t.page },
  };
}
