import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';
import MyPostsScreen from '../screens/events/MyPostsScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

export const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerShadowVisible: false,
  headerTintColor: colors.text,
  headerTitleStyle: { color: colors.text, fontWeight: '700' },
  contentStyle: { backgroundColor: colors.bg },
};

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Thread" component={EventDetailScreen} options={{ title: 'Post' }} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'New post' }} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} options={{ title: 'My posts' }} />
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
    </Stack.Navigator>
  );
}
