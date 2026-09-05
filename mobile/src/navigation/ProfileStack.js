import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import MyActivityScreen from '../screens/MyActivityScreen';
import CampusScoreScreen from '../screens/CampusScoreScreen';
import ResourcesScreen from '../screens/resources/ResourcesScreen';
import CreateResourceScreen from '../screens/resources/CreateResourceScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { useStackOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

function FeatureScreen({ route }) {
  return <PlaceholderScreen {...(route.params || {})} />;
}

export default function ProfileStack() {
  const screenOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit profile' }} />
      <Stack.Screen name="MyActivity" component={MyActivityScreen} options={{ title: 'My activity' }} />
      <Stack.Screen name="CampusScore" component={CampusScoreScreen} options={{ title: 'Campus Score' }} />
      <Stack.Screen name="Resources" component={ResourcesScreen} options={{ title: 'Past papers & notes' }} />
      <Stack.Screen name="CreateResource" component={CreateResourceScreen} options={{ title: 'Share a file' }} />
      <Stack.Screen
        name="Feature"
        component={FeatureScreen}
        options={({ route }) => ({ title: route.params?.headerTitle || 'Coming soon' })}
      />
    </Stack.Navigator>
  );
}
