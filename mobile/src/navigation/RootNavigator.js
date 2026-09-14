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
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

// Light navigation theme matching the app background.
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

function AuthStack({ showIntro }) {
  return (
    <Stack.Navigator
      initialRouteName={showIntro ? 'Onboarding' : 'Login'}
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.primary,
        headerTitle: '',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
    </Stack.Navigator>
  );
}

/** Tabs plus full-screen sheets (composer) that must cover the floating tab bar. */
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="Tabs" component={AppTabs} />
      <Stack.Screen name="Compose" component={ComposeScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { isLoggedIn, booting, onboarded, celebration, endCelebration } = useAuth();

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
