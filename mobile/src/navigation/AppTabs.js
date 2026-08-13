import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import EventsStack from './EventsStack';
import MoreStack from './MoreStack';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { colors, shadow } from '../theme';

const Tab = createBottomTabNavigator();

// Club / Lost & Found / Sell are teaser screens until their phase ships.
const ClubScreen = () => (
  <PlaceholderScreen step="04" label="CLUB" title="Clubs & societies"
    subtitle="Discover clubs, join with one tap, and manage your society's members and events."
    bullets={['DISCOVER', 'JOIN', 'MANAGE']} icon="people-circle-outline" />
);
const LostScreen = () => (
  <PlaceholderScreen step="02" label="LOST & FOUND" title="Lost something?"
    subtitle="Post a photo of a lost or found item and let the whole campus help you reunite with it."
    bullets={['SNAP', 'POST', 'RECOVER']} icon="search-outline" />
);
const SellScreen = () => (
  <PlaceholderScreen step="03" label="MARKETPLACE" title="Buy & sell on campus"
    subtitle="A campus-only marketplace for second-hand books, kits and semester essentials."
    bullets={['LIST', 'CHAT', 'DEAL']} icon="pricetags-outline" />
);

const TABS = {
  Home: { label: 'Home', icon: 'home' },
  Post: { label: 'Post', icon: 'megaphone' },
  Club: { label: 'Club', icon: 'people-circle' },
  Lost: { label: 'Lost', icon: 'search' },
  Sell: { label: 'Sell', icon: 'pricetags' },
  More: { label: 'More', icon: 'grid' },
};

function FloatingTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <View style={styles.shadowWrap}>
        <BlurView
          intensity={40}
          tint="light"
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={styles.bar}
        >
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const meta = TABS[route.name] || { label: route.name, icon: 'ellipse' };

            function onPress() {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }

            return (
              <TouchableOpacity key={route.key} style={styles.item} onPress={onPress} activeOpacity={0.7}>
                <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                  <Ionicons
                    name={focused ? meta.icon : `${meta.icon}-outline`}
                    size={20}
                    color={focused ? colors.primaryDark : colors.textMuted}
                  />
                </View>
                <Text style={[styles.label, { color: focused ? colors.primaryDark : colors.textMuted }]}>
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
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Post" component={EventsStack} />
      <Tab.Screen name="Club" component={ClubScreen} />
      <Tab.Screen name="Lost" component={LostScreen} />
      <Tab.Screen name="Sell" component={SellScreen} />
      <Tab.Screen name="More" component={MoreStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, alignItems: 'center' },
  shadowWrap: {
    width: '100%',
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.55)',
    ...shadow.card,
    shadowOpacity: 0.16,
  },
  bar: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.45)',
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Round, translucent green highlight — visible but see-through ("glass").
  iconWrapActive: {
    backgroundColor: 'rgba(124,192,61,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(124,192,61,0.45)',
  },
  label: { fontSize: 10, fontWeight: '700', marginTop: 1 },
});
