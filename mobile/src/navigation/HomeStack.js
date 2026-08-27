import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { useStackOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

function FeatureScreen({ route }) {
  return <PlaceholderScreen {...(route.params || {})} />;
}

export default function HomeStack() {
  const screenOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="HomeDash" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Feature" component={FeatureScreen} options={({ route }) => ({ title: route.params?.headerTitle || 'Coming soon' })} />
    </Stack.Navigator>
  );
}
