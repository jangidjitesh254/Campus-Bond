import React from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

/**
 * Status bar icons follow the active palette.
 *
 * On Android the bar is forced translucent with a transparent background:
 * on Android 15+ the system already does this (edge-to-edge), but on older
 * phones Expo Go leaves the bar opaque and black, and dark icons on black
 * disappear — which looked like the bar was missing. Every screen already
 * pads by the top inset, so drawing under the bar is safe.
 */
function Chrome() {
  const { isDark, t } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.page }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <RootNavigator />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#0A0A0D' }} />;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Chrome />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
