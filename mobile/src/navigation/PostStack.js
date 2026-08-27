import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PostFeedScreen from '../screens/PostFeedScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';
import MyPostsScreen from '../screens/events/MyPostsScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import CreateLostScreen from '../screens/lost/CreateLostScreen';
import LostDetailScreen from '../screens/lost/LostDetailScreen';
import MyLostPostsScreen from '../screens/lost/MyLostPostsScreen';
import { useStackOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

export default function PostStack() {
  const screenOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="PostFeed" component={PostFeedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Thread" component={EventDetailScreen} options={{ title: 'Post' }} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'New post' }} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} options={{ title: 'My posts' }} />
      <Stack.Screen name="Activity" component={ActivityScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
      <Stack.Screen name="CreateLost" component={CreateLostScreen} options={{ title: 'Report an item' }} />
      <Stack.Screen name="LostDetail" component={LostDetailScreen} options={{ title: 'Item' }} />
      <Stack.Screen name="MyLostPosts" component={MyLostPostsScreen} options={{ title: 'My items' }} />
    </Stack.Navigator>
  );
}
