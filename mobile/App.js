import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
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
import { colors } from './src/theme';

// Keep the native splash visible until the fonts and the saved session have
// been restored (RootNavigator hides it), so the user never sees a blank flash.
SplashScreen.preventAutoHideAsync().catch(() => {});
// The fade is a native option that only exists in a real build — Expo Go
// logs a warning (and shows LogBox) if it is called there.
if (Constants.executionEnvironment !== 'storeClient') {
  SplashScreen.setOptions({ duration: 400, fade: true });
}

/**
 * Status bar icons follow the active palette.
 *
 * On Android the bar is forced translucent with a transparent background:
 * on Android 15+ the system already does this (edge-to-edge), but on older
 * phones Expo Go leaves the bar opaque and black, and dark icons on black
 * disappear. Every screen already pads by the top inset, so drawing under
 * the bar is safe.
 */
function Chrome() {
  const { isDark, t } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.page }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
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
  // The native splash is still covering the screen while the fonts load.
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.primary }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <Chrome />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
