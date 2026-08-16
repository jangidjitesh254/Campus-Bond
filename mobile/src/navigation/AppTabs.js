import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import Icon from '../components/Icon';
import HomeStack from './HomeStack';
import PostStack from './PostStack';
import LostStack from './LostStack';
import ClubStack from './ClubStack';
import SellStack from './SellStack';
import ProfileStack from './ProfileStack';
import { colors, shadow } from '../theme';

const Tab = createBottomTabNavigator();

const TABS = {
  Home: { label: 'Home', icon: 'home', fill: true },
  Post: { label: 'Post', icon: 'megaphone', fill: false },
  Club: { label: 'Club', icon: 'users', fill: false },
  Lost: { label: 'Lost', icon: 'search', fill: false },
  Sell: { label: 'Sell', icon: 'tag', fill: false },
  More: { label: 'More', icon: 'grid', fill: false },
};

/** Floating, rounded, frosted-glass tab bar (iOS-style). */
function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <View style={styles.shadowWrap}>
        <BlurView
          intensity={38}
          tint="light"
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={styles.bar}
        >
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const meta = TABS[route.name] || { label: route.name, icon: 'home' };
            const color = focused ? colors.primary : colors.textMuted;

            function onPress() {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }

            return (
              <TouchableOpacity key={route.key} style={styles.item} onPress={onPress} activeOpacity={0.8}>
                <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                  <Icon name={meta.icon} size={21} color={color} filled={focused && meta.fill} strokeWidth={1.8} />
                </View>
                <Text style={[styles.label, { color, fontWeight: focused ? '700' : '500' }]} numberOfLines={1}>
                  {meta.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Post" component={PostStack} />
      <Tab.Screen name="Club" component={ClubStack} />
      <Tab.Screen name="Lost" component={LostStack} />
      <Tab.Screen name="Sell" component={SellStack} />
      <Tab.Screen name="More" component={ProfileStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, alignItems: 'center' },
  shadowWrap: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.6)',
    ...shadow.card,
    shadowOpacity: 0.14,
  },
  bar: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconWrap: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: 'rgba(21,83,46,0.16)' },
  label: { fontSize: 9.5 },
});
