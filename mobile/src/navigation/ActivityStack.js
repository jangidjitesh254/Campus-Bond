import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ActivityScreen from '../screens/ActivityScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import { stackScreenOptions } from './HomeStack';

const Stack = createNativeStackNavigator();

export default function ActivityStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Activity" component={ActivityScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Thread" component={EventDetailScreen} options={{ title: 'Post' }} />
    </Stack.Navigator>
  );
}
