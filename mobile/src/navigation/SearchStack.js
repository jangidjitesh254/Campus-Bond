import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchScreen from '../screens/SearchScreen';
import CreateLostScreen from '../screens/lost/CreateLostScreen';
import LostDetailScreen from '../screens/lost/LostDetailScreen';
import MyLostPostsScreen from '../screens/lost/MyLostPostsScreen';
import { useStackOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

/** Global search, plus the Lost & Found screens it can open. */
export default function SearchStack() {
  const screenOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="SearchHome" component={SearchScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateLost" component={CreateLostScreen} options={{ title: 'Report an item' }} />
      <Stack.Screen name="LostDetail" component={LostDetailScreen} options={{ title: 'Item' }} />
      <Stack.Screen name="MyLostPosts" component={MyLostPostsScreen} options={{ title: 'My items' }} />
    </Stack.Navigator>
  );
}
