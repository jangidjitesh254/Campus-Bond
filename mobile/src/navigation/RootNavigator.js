import React, { useEffect } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import SuccessOverlay from '../components/SuccessOverlay';
import AppTabs from './AppTabs';
import ComposeScreen from '../screens/ComposeScreen';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useStackOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

/** Navigation theme follows the active palette. */
function useNavTheme() {
  const { t, isDark } = useTheme();
  return {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      primary: t.primary,
      background: t.page,
      card: t.page,
      text: t.text,
      border: t.hairline,
      notification: t.primary,
    },
  };
}

function AuthStack({ showIntro }) {
  const screenOptions = useStackOptions();
  const { t } = useTheme();
  return (
    <Stack.Navigator
      initialRouteName={showIntro ? 'Onboarding' : 'Login'}
      screenOptions={{ ...screenOptions, headerTintColor: t.primary, headerTitle: '' }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
    </Stack.Navigator>
  );
}

/** Tabs plus full-screen sheets (composer) that must cover the tab bar. */
function MainStack() {
  const { t } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.page } }}>
      <Stack.Screen name="Tabs" component={AppTabs} />
      <Stack.Screen name="Compose" component={ComposeScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { isLoggedIn, booting, onboarded, celebration, endCelebration } = useAuth();
  const navTheme = useNavTheme();

  // Session restored → fade the native splash out over the first screen.
  useEffect(() => {
    if (!booting) SplashScreen.hideAsync().catch(() => {});
  }, [booting]);

  // Native splash is still covering the screen while we boot.
  if (booting) return null;

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer theme={navTheme}>
        {/* First launch: the intro screen sits in front of the login flow. */}
        {isLoggedIn ? <MainStack /> : <AuthStack showIntro={!onboarded} />}
      </NavigationContainer>

      {/* Login / signup success: plays above the auth→app switch, then fades out over Home. */}
      {celebration ? (
        <SuccessOverlay
          title={celebration.title}
          subtitle={celebration.subtitle}
          onDone={celebration.finish}
          onHidden={endCelebration}
        />
      ) : null}
    </View>
  );
}
