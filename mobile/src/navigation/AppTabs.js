import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../components/Text';
import Icon from '../components/Icon';
import PostStack from './PostStack';
import ClubStack from './ClubStack';
import MapStack from './MapStack';
import SellStack from './SellStack';
import ProfileStack from './ProfileStack';
import { useTheme } from '../context/ThemeContext';
import useKeyboardOpen from '../hooks/useKeyboardOpen';
import { gradients, shadow } from '../theme';

const Tab = createBottomTabNavigator();

// The Post feed IS the home page, so the `Post` route is labelled "Home" and is
// the navigator's initial route. `Map` stays registered but has no slot — it is
// reached from a Profile row. Five slots means the centre action lands dead
// centre.
const BAR = [
  { name: 'Post', label: 'Home', icon: 'home' },
  { name: 'Club', label: 'Club', icon: 'users' },
  null, // slot for the centre action
  { name: 'Sell', label: 'Market', icon: 'tag' },
  // `Map` has no slot of its own, so More stays lit while you're on it.
  { name: 'More', label: 'More', icon: 'gridDots', owns: ['More', 'Map'] },
];

// What the centre + can create. Each entry drops the student straight into the
// right form, with the post kind already chosen for them.
const COMPOSE = [
  { key: 'team', label: 'Team post', hint: 'Find teammates for a project', icon: 'users', screen: 'CreateEvent', params: { category: 'hackathon' } },
  { key: 'lost', label: 'Lost & Found', hint: 'Report a lost or found item', icon: 'search', screen: 'CreateLost' },
  { key: 'notice', label: 'Notice', hint: 'Announce it to campus', icon: 'megaphone', screen: 'CreateEvent', params: { category: 'cultural' } },
  { key: 'other', label: 'Other', hint: 'Anything else', icon: 'compose', screen: 'CreateEvent', params: { category: 'other' } },
];

/**
 * Floating glass pill: icon over label, the active item lit coral, and the
 * coral-gradient + raised out of the centre.
 */
function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const [composeOpen, setComposeOpen] = useState(false);
  const keyboardOpen = useKeyboardOpen();
  const pop = useRef(new Animated.Value(0)).current;

  // The menu springs up out of the + rather than just appearing.
  useEffect(() => {
    Animated.spring(pop, { toValue: composeOpen ? 1 : 0, useNativeDriver: true, friction: 7, tension: 90 }).start();
  }, [composeOpen, pop]);

  function compose(option) {
    setComposeOpen(false);
    navigation.navigate('Post', { screen: option.screen, params: option.params });
  }

  function go(name) {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const focused = state.routes[state.index].key === route.key;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(name);
  }

  const active = state.routes[state.index];
  const activeName = active.name;

  // Pushed screens — chat, a post, any form — own the whole screen. Leaving the
  // bar floating over them buries their input bars behind it.
  const onRootScreen = (active.state?.index ?? 0) === 0;
  if (keyboardOpen || !onRootScreen) return null;

  const bottom = Math.max(insets.bottom, 10) + 6;

  return (
    <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      <View style={styles.bar}>
        <BlurView intensity={28} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.barTint]} />

        {BAR.map((item) => {
          if (!item) {
            return (
              <View key="fab" style={styles.item}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setComposeOpen(true)} style={styles.fabWrap}>
                  <LinearGradient colors={gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
                    <Icon name="plus" size={22} color="#FFFFFF" strokeWidth={2.2} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          }
          // A button owns its own route by default, plus any slot-less ones
          // listed in `owns` — so exactly one button is always highlighted.
          const focused = (item.owns || [item.name]).includes(activeName);
          const color = focused ? t.accent : t.textFaint;
          return (
            <TouchableOpacity key={item.name} style={styles.item} onPress={() => go(item.name)} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10 }}>
              <Icon name={item.icon} size={21} color={color} strokeWidth={focused ? 1.9 : 1.7} />
              <Text style={[styles.label, { color }, focused && styles.labelOn]} numberOfLines={1}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={composeOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setComposeOpen(false)}>
        <View style={{ flex: 1 }}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: pop }]} pointerEvents="none">
            <BlurView intensity={26} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, styles.composeTint]} />
          </Animated.View>

          <Pressable style={StyleSheet.absoluteFill} onPress={() => setComposeOpen(false)} />

          <Animated.View
            style={[
              styles.composeStack,
              {
                bottom: bottom + 92,
                opacity: pop,
                transform: [
                  { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
                  { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                ],
              },
            ]}
          >
            {COMPOSE.map((c) => (
              <Pressable key={c.key} onPress={() => compose(c)} style={({ pressed }) => [styles.composeItem, pressed && styles.composeItemOn]}>
                <View style={styles.composeIcon}>
                  <Icon name={c.icon} size={17} color={t.accent} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.composeLabel}>{c.label}</Text>
                  <Text style={styles.composeHint}>{c.hint}</Text>
                </View>
              </Pressable>
            ))}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }} tabBar={(props) => <TabBar {...props} />}>
      {/* Post is first, so the app opens on the feed. */}
      <Tab.Screen name="Post" component={PostStack} />
      <Tab.Screen name="Club" component={ClubStack} />
      <Tab.Screen name="Map" component={MapStack} />
      <Tab.Screen name="Sell" component={SellStack} />
      <Tab.Screen name="More" component={ProfileStack} />
    </Tab.Navigator>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    wrap: { position: 'absolute', left: 16, right: 16 },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 30,
      borderWidth: 1,
      borderColor: t.borderSoft,
      paddingVertical: 12,
      paddingHorizontal: 18,
      overflow: 'hidden',
      ...shadow.card,
    },
    barTint: { backgroundColor: t.barGlass, borderRadius: 30 },
    item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
    label: { fontSize: 10.5, fontWeight: '600' },
    labelOn: { fontWeight: '700' },

    // Coral disc lifted out of the bar.
    fabWrap: { marginTop: -26, borderRadius: 24, ...shadow.glow },
    fab: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },

    composeTint: { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(20,20,26,0.28)' },
    composeStack: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 8 },
    composeItem: {
      width: 262,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 20,
      backgroundColor: isDark ? '#17171B' : '#FFFFFF',
      borderWidth: 1,
      borderColor: t.borderSoft,
      ...shadow.card,
    },
    composeItemOn: { backgroundColor: t.field },
    composeIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' },
    composeLabel: { fontSize: 14, fontWeight: '800', color: t.text },
    composeHint: { fontSize: 11.5, fontWeight: '600', color: t.textMuted, marginTop: 2 },
  });
}
