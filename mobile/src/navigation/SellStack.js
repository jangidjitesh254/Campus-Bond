import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SellFeedScreen from '../screens/sell/SellFeedScreen';
import CreateSellScreen from '../screens/sell/CreateSellScreen';
import SellDetailScreen from '../screens/sell/SellDetailScreen';
import MySellScreen from '../screens/sell/MySellScreen';
import { stackScreenOptions } from './HomeStack';

const Stack = createNativeStackNavigator();

export default function SellStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="SellFeed" component={SellFeedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateSell" component={CreateSellScreen} options={{ title: 'List an item' }} />
      <Stack.Screen name="SellDetail" component={SellDetailScreen} options={{ title: 'Item' }} />
      <Stack.Screen name="MyListings" component={MySellScreen} options={{ title: 'My listings' }} />
    </Stack.Navigator>
  );
}
