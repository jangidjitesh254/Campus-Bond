import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import AppTabs from './AppTabs';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useStackOptions } from './stackOptions';
import { Loading } from '../components/ui';

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

function AuthStack() {
  const screenOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={{ ...screenOptions, headerTitle: '' }}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { isLoggedIn, booting } = useAuth();
  const navTheme = useNavTheme();

  if (booting) return <Loading label="Loading Campus Bond…" />;

  return (
    <NavigationContainer theme={navTheme}>
      {isLoggedIn ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
