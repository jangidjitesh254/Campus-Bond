import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EventFeedScreen from '../screens/events/EventFeedScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import MyPostsScreen from '../screens/events/MyPostsScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerShadowVisible: false,
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.text, fontWeight: '800' },
  contentStyle: { backgroundColor: colors.bg },
};

export default function EventsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="EventFeed" component={EventFeedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'New post' }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Details' }} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} options={{ title: 'My Posts' }} />
    </Stack.Navigator>
  );
}
