import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EventFeedScreen from '../screens/events/EventFeedScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import MyPostsScreen from '../screens/events/MyPostsScreen';
import { useStackOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

export default function EventsStack() {
  const screenOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="EventFeed" component={EventFeedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'New post' }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Details' }} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} options={{ title: 'My Posts' }} />
    </Stack.Navigator>
  );
}
