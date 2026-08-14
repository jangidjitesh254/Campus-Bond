import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from '../components/Icon';
import HomeStack from './HomeStack';
import LostStack from './LostStack';
import ClubStack from './ClubStack';
import SellStack from './SellStack';
import ProfileStack from './ProfileStack';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const TABS = {
  Home: { label: 'Home', icon: 'home', fill: true },
  Lost: { label: 'Lost & Found', icon: 'search', fill: false },
  Club: { label: 'Club', icon: 'users', fill: false },
  Sell: { label: 'Sell', icon: 'tag', fill: false },
  More: { label: 'More', icon: 'grid', fill: false },
};

function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const meta = TABS[route.name] || { label: route.name, icon: 'home' };
        const color = focused ? colors.primary : colors.textFaint;

        function onPress() {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }

        return (
          <TouchableOpacity key={route.key} style={styles.item} onPress={onPress} activeOpacity={0.8}>
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Icon name={meta.icon} size={22} color={color} filled={focused && meta.fill} strokeWidth={1.8} />
            </View>
            <Text style={[styles.label, { color, fontWeight: focused ? '700' : '500' }]} numberOfLines={1}>
              {meta.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Lost" component={LostStack} />
      <Tab.Screen name="Club" component={ClubStack} />
      <Tab.Screen name="Sell" component={SellStack} />
      <Tab.Screen name="More" component={ProfileStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  item: { alignItems: 'center', gap: 3, flex: 1 },
  iconWrap: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 999 },
  iconWrapActive: { backgroundColor: colors.primarySoft },
  label: { fontSize: 10.5 },
});
