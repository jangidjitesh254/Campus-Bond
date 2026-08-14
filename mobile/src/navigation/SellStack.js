import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { stackScreenOptions } from './HomeStack';

const Stack = createNativeStackNavigator();

const SellScreen = () => (
  <PlaceholderScreen
    step="03"
    label="MARKETPLACE"
    title="Buy & sell on campus"
    subtitle="A campus-only marketplace for second-hand books, drawing kits and semester essentials. Save money, reduce waste."
    bullets={['LIST', 'CHAT', 'DEAL']}
    icon="pricetags-outline"
  />
);

export default function SellStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Sell" component={SellScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
