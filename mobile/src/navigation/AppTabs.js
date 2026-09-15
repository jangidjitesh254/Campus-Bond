import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Avatar from '../components/Avatar';
import HomeStack from './HomeStack';
import PostStack from './PostStack';
import MapStack from './MapStack';
import ClubStack from './ClubStack';
import SellStack from './SellStack';
import SearchStack from './SearchStack';
import ActivityStack from './ActivityStack';
import ProfileStack from './ProfileStack';
import { useAuth } from '../context/AuthContext';
import { useTheme, useStyles } from '../context/ThemeContext';
import { MenuHost, useMenu } from '../context/MenuContext';

const Tab = createBottomTabNavigator();

/** Two little ghost eyes + a smile, drawn inside a filled icon so the mascot "lives" in it. */
function Face({ cx = 12, cy = 12, s = 1 }) {
  const { t: colors } = useTheme();
  const eye = colors.surface;
  return (
    <>
      <Circle cx={cx - 2.4 * s} cy={cy - 0.6 * s} r={1.55 * s} fill={eye} />
      <Circle cx={cx + 2.4 * s} cy={cy - 0.6 * s} r={1.55 * s} fill={eye} />
      <Circle cx={cx - 2.4 * s} cy={cy - 0.6 * s} r={0.7 * s} fill={colors.text} />
      <Circle cx={cx + 2.4 * s} cy={cy - 0.6 * s} r={0.7 * s} fill={colors.text} />
      <Path d={`M${cx - 1.6 * s} ${cy + 2.2 * s}q${1.6 * s} ${1.6 * s} ${3.2 * s} 0`} stroke={eye} strokeWidth={0.9 * s} strokeLinecap="round" fill="none" />
    </>
  );
}

/** Soft, rounded tab icons (Instagram-like). When active they fill in and the ghost peeks out. */
function TabIcon({ name, on, size = 27 }) {
  const { t: colors } = useTheme();
  const c = on ? colors.text : colors.textMuted;
  const stroke = { stroke: c, strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  // Filled state keeps the same stroke so the silhouette stays the same size as the outline
  const solid = { ...stroke, fill: c };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' ? (
        <>
          {/* Pitched roof with a soft peak, no door — the ghost is the resident */}
          <Path
            d="M4.2 11.6c0-.6.3-1.2.8-1.6l5.9-4.8c.6-.5 1.6-.5 2.2 0l5.9 4.8c.5.4.8 1 .8 1.6v6.2c0 1.5-1.2 2.7-2.7 2.7H6.9c-1.5 0-2.7-1.2-2.7-2.7v-6.2Z"
            {...(on ? solid : stroke)}
          />
          {on ? <Face cx={12} cy={13} s={0.95} /> : null}
        </>
      ) : name === 'map' ? (
        <>
          {/* Folded campus map with soft corners; the ghost peeks out of the middle panel when active */}
          <Path
            d="M3.6 6.9c0-.7.4-1.3 1-1.6l3.5-1.6c.5-.2 1.1-.2 1.6 0l4.4 1.9c.5.2 1.1.2 1.6 0l3.2-1.4c1-.4 2 .3 2 1.4v11.5c0 .7-.4 1.3-1 1.6l-3.5 1.6c-.5.2-1.1.2-1.6 0l-4.4-1.9c-.5-.2-1.1-.2-1.6 0l-3.2 1.4c-1 .4-2-.3-2-1.4V6.9Z"
            {...(on ? solid : stroke)}
          />
          {on ? <Face cx={12} cy={12.6} s={0.85} /> : <Path d="M9 3.6v15M15 5.4v15" {...stroke} strokeWidth={1.6} />}
        </>
      ) : name === 'plus' ? (
        <>
          <Rect x={3.2} y={3.2} width={17.6} height={17.6} rx={5.5} {...stroke} stroke={colors.text} />
          <Path d="M12 8.4v7.2M8.4 12h7.2" {...stroke} stroke={colors.text} strokeWidth={2} />
        </>
      ) : (
        <>
          <Path
            d="M12 20.4c-.3 0-.6-.1-.8-.3C7.5 17.1 3 13.7 3 9.3 3 6.5 5.2 4.4 7.9 4.4c1.7 0 3.1.8 4.1 2.1 1-1.3 2.4-2.1 4.1-2.1 2.7 0 4.9 2.1 4.9 4.9 0 4.4-4.5 7.8-8.2 10.8-.2.2-.5.3-.8.3Z"
            {...(on ? solid : stroke)}
          />
          {on ? <Face cx={12} cy={10.2} s={0.85} /> : null}
        </>
      )}
    </Svg>
  );
}

/** Jelly tap: squash → stretch → settle, like the mascot. The plus also does a quarter spin. */
function useJelly() {
  const t = useRef(new Animated.Value(0)).current;
  const play = () => {
    t.setValue(0);
    Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.spring(t, { toValue: 2, friction: 4, tension: 160, useNativeDriver: true }),
    ]).start();
  };
  const scaleX = t.interpolate({ inputRange: [0, 1, 2], outputRange: [1, 1.25, 1] });
  const scaleY = t.interpolate({ inputRange: [0, 1, 2], outputRange: [1, 0.75, 1] });
  const translateY = t.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 3, 0] });
  const rotate = t.interpolate({ inputRange: [0, 2], outputRange: ['0deg', '90deg'] });
  return { play, scaleX, scaleY, translateY, rotate };
}

function TabButton({ onPress, spin, children }) {
  const styles = useStyles(makeStyles);
  const j = useJelly();
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        j.play();
        onPress();
      }}
      activeOpacity={0.7}
      hitSlop={6}
    >
      <Animated.View style={{ transform: [{ translateY: j.translateY }, { scaleX: j.scaleX }, { scaleY: j.scaleY }, ...(spin ? [{ rotate: j.rotate }] : [])] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

/** What the bar shows, in order. `compose` is a button, not a route. */
const BAR = [
  { route: 'Home', icon: 'home' },
  { route: 'Map', icon: 'map' },
  { compose: true },
  { route: 'Activity', icon: 'heart' },
  { route: 'More', profile: true },
];

/** Flat, edge-to-edge bar with icon-only tabs — Instagram / Threads style. */
function TabBar({ state, navigation }) {
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { chrome, setChrome } = useMenu();
  const [barH, setBarH] = useState(64);
  const current = state.routes[state.index]?.name;

  // The 3D campus map owns the whole screen — no bar there.
  if (current === 'Map') return null;

  // Slides down out of view while a feed is being scrolled down.
  const hide = { transform: [{ translateY: chrome.interpolate({ inputRange: [0, 1], outputRange: [0, barH + 8] }) }] };

  function go(name) {
    setChrome(false); // switching tabs always brings the bar back
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (current !== name && !event.defaultPrevented) navigation.navigate(name);
  }

  function compose() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.getParent()?.navigate('Compose');
  }

  return (
    <Animated.View style={[styles.bar, hide, { paddingBottom: Math.max(insets.bottom, 8) }]} onLayout={(e) => setBarH(e.nativeEvent.layout.height)}>
      {BAR.map((item) => {
        if (item.compose) {
          return (
            <TabButton key="compose" onPress={compose} spin>
              <TabIcon name="plus" size={28} />
            </TabButton>
          );
        }
        const focused = current === item.route;
        return (
          <TabButton key={item.route} onPress={() => go(item.route)}>
            {item.profile ? (
              <View style={[styles.avatarRing, focused && styles.avatarRingOn]}>
                <Avatar name={user?.name} size={24} />
              </View>
            ) : (
              <TabIcon name={item.icon} on={focused} />
            )}
          </TabButton>
        );
      })}
    </Animated.View>
  );
}

export default function AppTabs({ navigation }) {
  return (
    <MenuHost navigation={navigation}>
    <Tab.Navigator screenOptions={{ headerShown: false, freezeOnBlur: true }} tabBar={(props) => <TabBar {...props} />}>
      {/* The four bar tabs mount up front so switching between them is instant;
          screens that are not on screen are frozen so they cost nothing. */}
      <Tab.Screen name="Home" component={HomeStack} options={{ lazy: false, freezeOnBlur: false }} />
      <Tab.Screen name="Map" component={MapStack} />
      <Tab.Screen name="Activity" component={ActivityStack} options={{ lazy: false }} />
      <Tab.Screen name="More" component={ProfileStack} options={{ lazy: false }} />
      {/* Not in the bar — reachable via navigate('Post' | 'Club' | 'Sell' | 'Search', …) from the feed and profile */}
      <Tab.Screen name="Post" component={PostStack} />
      <Tab.Screen name="Club" component={ClubStack} />
      <Tab.Screen name="Sell" component={SellStack} />
      <Tab.Screen name="Search" component={SearchStack} />
    </Tab.Navigator>
    </MenuHost>
  );
}

const makeStyles = (colors, isDark) => {
  return StyleSheet.create({
  // Floats over the content so it can slide away without leaving a gap.
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 8,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  item: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  avatarRing: { padding: 2, borderRadius: 999, borderWidth: 1.5, borderColor: 'transparent' },
  avatarRingOn: { borderColor: colors.text },
});
};
