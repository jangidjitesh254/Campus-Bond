import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PostFeedScreen from '../screens/PostFeedScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';
import MyPostsScreen from '../screens/events/MyPostsScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import { stackScreenOptions } from './HomeStack';

const Stack = createNativeStackNavigator();

export default function PostStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="PostFeed" component={PostFeedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Thread" component={EventDetailScreen} options={{ title: 'Post' }} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'New post' }} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} options={{ title: 'My posts' }} />
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
    </Stack.Navigator>
  );
}
