import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CampusMapScreen from '../screens/map/CampusMapScreen';
import WalkthroughScreen from '../screens/map/WalkthroughScreen';
import { useStackOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

export default function MapStack() {
  const screenOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Map" component={CampusMapScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Walkthrough" component={WalkthroughScreen} options={{ title: 'Campus walks' }} />
    </Stack.Navigator>
  );
}
