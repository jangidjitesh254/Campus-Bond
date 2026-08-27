import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ClubFeedScreen from '../screens/club/ClubFeedScreen';
import CreateClubScreen from '../screens/club/CreateClubScreen';
import ClubDetailScreen from '../screens/club/ClubDetailScreen';
import JoinClubScreen from '../screens/club/JoinClubScreen';
import { useStackOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

export default function ClubStack() {
  const screenOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ClubFeed" component={ClubFeedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateClub" component={CreateClubScreen} options={{ title: 'New club' }} />
      <Stack.Screen name="ClubDetail" component={ClubDetailScreen} options={{ title: 'Club' }} />
      <Stack.Screen name="JoinClub" component={JoinClubScreen} options={{ title: 'Apply' }} />
    </Stack.Navigator>
  );
}
