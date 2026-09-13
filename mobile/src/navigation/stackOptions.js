import { useTheme } from '../context/ThemeContext';

/**
 * Native-stack header options in the active palette. A hook rather than a
 * constant, so headers repaint when the theme is toggled. The native header
 * is not one of our Text components, so it names the Manrope file directly.
 */
export function useStackOptions() {
  const { t } = useTheme();
  return {
    headerStyle: { backgroundColor: t.page },
    headerShadowVisible: false,
    headerTintColor: t.text,
    headerTitleStyle: { color: t.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 17 },
    headerBackTitleStyle: { fontFamily: 'Manrope_600SemiBold' },
    contentStyle: { backgroundColor: t.page },
  };
}
