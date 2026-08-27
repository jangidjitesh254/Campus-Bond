import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { useStackOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

const MapScreen = () => (
  <PlaceholderScreen
    step="06"
    label="CAMPUS MAP"
    title="Find your way around"
    subtitle="An interactive campus map for blocks, labs, canteens and event venues is on the way."
    bullets={['LOCATE', 'NAVIGATE', 'ARRIVE']}
    icon="map-outline"
  />
);

export default function MapStack() {
  const screenOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
