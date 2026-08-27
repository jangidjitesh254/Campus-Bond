import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import { useStackOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

export default function MessagesStack() {
  const screenOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
    </Stack.Navigator>
  );
}
