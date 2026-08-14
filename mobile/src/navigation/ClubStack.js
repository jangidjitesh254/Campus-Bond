import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { stackScreenOptions } from './HomeStack';

const Stack = createNativeStackNavigator();

const ClubScreen = () => (
  <PlaceholderScreen
    step="04"
    label="CLUBS"
    title="Clubs & societies"
    subtitle="Discover clubs, join with one tap, and manage your society's members and events — all in one place."
    bullets={['DISCOVER', 'JOIN', 'MANAGE']}
    icon="people-circle-outline"
  />
);

export default function ClubStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Club" component={ClubScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
