import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreScreen from '../screens/MoreScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerShadowVisible: false,
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.text, fontWeight: '800' },
  contentStyle: { backgroundColor: colors.bg },
};

function FeatureScreen({ route }) {
  return <PlaceholderScreen {...(route.params || {})} />;
}

export default function MoreStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MoreHome" component={MoreScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
      <Stack.Screen
        name="Feature"
        component={FeatureScreen}
        options={({ route }) => ({ title: route.params?.headerTitle || 'Coming soon' })}
      />
    </Stack.Navigator>
  );
}
