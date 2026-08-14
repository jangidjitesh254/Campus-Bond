import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { stackScreenOptions } from './HomeStack';

const Stack = createNativeStackNavigator();

function FeatureScreen({ route }) {
  return <PlaceholderScreen {...(route.params || {})} />;
}

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Feature"
        component={FeatureScreen}
        options={({ route }) => ({ title: route.params?.headerTitle || 'Coming soon' })}
      />
    </Stack.Navigator>
  );
}
