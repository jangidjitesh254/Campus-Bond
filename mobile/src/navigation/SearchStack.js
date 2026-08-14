import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchScreen from '../screens/SearchScreen';
import LostFeedScreen from '../screens/lost/LostFeedScreen';
import CreateLostScreen from '../screens/lost/CreateLostScreen';
import LostDetailScreen from '../screens/lost/LostDetailScreen';
import MyLostPostsScreen from '../screens/lost/MyLostPostsScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { stackScreenOptions } from './HomeStack';

const Stack = createNativeStackNavigator();

function FeatureScreen({ route }) {
  return <PlaceholderScreen {...(route.params || {})} />;
}

export default function SearchStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LostFeed" component={LostFeedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateLost" component={CreateLostScreen} options={{ title: 'Report an item' }} />
      <Stack.Screen name="LostDetail" component={LostDetailScreen} options={{ title: 'Item' }} />
      <Stack.Screen name="MyLostPosts" component={MyLostPostsScreen} options={{ title: 'My items' }} />
      <Stack.Screen
        name="Feature"
        component={FeatureScreen}
        options={({ route }) => ({ title: route.params?.headerTitle || 'Coming soon' })}
      />
    </Stack.Navigator>
  );
}
