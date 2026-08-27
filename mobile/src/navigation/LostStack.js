import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LostFeedScreen from '../screens/lost/LostFeedScreen';
import CreateLostScreen from '../screens/lost/CreateLostScreen';
import LostDetailScreen from '../screens/lost/LostDetailScreen';
import MyLostPostsScreen from '../screens/lost/MyLostPostsScreen';
import { useStackOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

export default function LostStack() {
  const screenOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="LostFeed" component={LostFeedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateLost" component={CreateLostScreen} options={{ title: 'Report an item' }} />
      <Stack.Screen name="LostDetail" component={LostDetailScreen} options={{ title: 'Item' }} />
      <Stack.Screen name="MyLostPosts" component={MyLostPostsScreen} options={{ title: 'My items' }} />
    </Stack.Navigator>
  );
}
