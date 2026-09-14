import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ActivityScreen from '../screens/ActivityScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import { useStackOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

export default function ActivityStack() {
  const screenOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ActivityHome" component={ActivityScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Thread" component={EventDetailScreen} options={{ title: 'Post' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
    </Stack.Navigator>
  );
}
