import React, { useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import SuccessOverlay from '../components/SuccessOverlay';
import LaunchSplash from '../components/LaunchSplash';
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
  // The animated launch splash covers the boot (session restore) and then reveals the first screen.
  const [launching, setLaunching] = useState(true);

  return (
    <View style={{ flex: 1 }}>
      {!booting ? (
        <NavigationContainer theme={navTheme}>
          {/* First launch: the intro screen sits in front of the login flow. */}
          {isLoggedIn ? <MainStack /> : <AuthStack showIntro={!onboarded} />}
        </NavigationContainer>
      ) : null}

      {/* Login / signup success: plays above the auth→app switch, then fades out over Home. */}
      {celebration ? (
        <SuccessOverlay
          title={celebration.title}
          subtitle={celebration.subtitle}
          onDone={celebration.finish}
          onHidden={endCelebration}
        />
      ) : null}

      {/* Every cold start: green splash, the mascot winks, then a circle wipe into the app.
          On first launch the onboarding screen is the same green stage, so just fade onto it. */}
      {launching ? <LaunchSplash ready={!booting} reveal={isLoggedIn || onboarded} onDone={() => setLaunching(false)} /> : null}
    </View>
  );
}
