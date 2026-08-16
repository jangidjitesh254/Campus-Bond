import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

export const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerShadowVisible: false,
  headerTintColor: colors.text,
  headerTitleStyle: { color: colors.text, fontWeight: '700' },
  contentStyle: { backgroundColor: colors.bg },
};

function FeatureScreen({ route }) {
  return <PlaceholderScreen {...(route.params || {})} />;
}

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="HomeDash" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Feature" component={FeatureScreen} options={({ route }) => ({ title: route.params?.headerTitle || 'Coming soon' })} />
    </Stack.Navigator>
  );
}
