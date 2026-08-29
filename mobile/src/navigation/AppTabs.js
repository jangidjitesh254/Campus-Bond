import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from '../components/Icon';
import HomeStack from './HomeStack';
import PostStack from './PostStack';
import ClubStack from './ClubStack';
import MapStack from './MapStack';
import SellStack from './SellStack';
import ProfileStack from './ProfileStack';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

// The Post feed IS the home page, so the `Post` route is labelled "Home" and is
// the navigator's initial route. `Home` (the tile dashboard) and `Map` stay
// registered but have no slot — both are reached from the More/Profile rows.
// Five slots means the centre action lands dead centre.
const BAR = [
  { name: 'Post', label: 'Home', icon: 'home' },
  { name: 'Club', label: 'Club', icon: 'users' },
  null, // slot for the centre action
  { name: 'Sell', label: 'Market', icon: 'tag' },
  // `Home` (the tile dashboard) and `Map` have no slot of their own — they are
  // reached from the More/Profile rows, so More stays lit while you're on them.
  { name: 'More', label: 'More', icon: 'dotsH', owns: ['More', 'Home', 'Map'] },
];

// What the centre + can create. Each entry drops the student straight into the
// right form, with the post kind already chosen for them.
const COMPOSE = [
  { key: 'team', label: 'Team post', hint: 'Find teammates for a project', icon: 'users', screen: 'CreateEvent', params: { category: 'hackathon' } },
  { key: 'lost', label: 'Lost & Found', hint: 'Report a lost or found item', icon: 'search', screen: 'CreateLost' },
  { key: 'notice', label: 'Notice', hint: 'Announce it to campus', icon: 'megaphone', screen: 'CreateEvent', params: { category: 'cultural' } },
  { key: 'other', label: 'Other', hint: 'Anything else', icon: 'compose', screen: 'CreateEvent', params: { category: 'other' } },
];

/** Bottom bar with curved shoulders: icon over label, the active one lifted
 *  into a raised pill, and an ink circle carrying the centre + action. */
function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const [composeOpen, setComposeOpen] = useState(false);
  const pop = useRef(new Animated.Value(0)).current;

  // The menu springs up out of the + rather than just appearing.
  useEffect(() => {
    Animated.spring(pop, {
      toValue: composeOpen ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 90,
    }).start();
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

  const activeName = state.routes[state.index].name;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}>
      {BAR.map((item) => {
        if (!item) {
          return (
            <View key="fab" style={styles.item}>
              <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.85}
                onPress={() => setComposeOpen(true)}
              >
                <Icon name="plus" size={20} color={t.accent} strokeWidth={2.6} />
              </TouchableOpacity>
            </View>
          );
        }
        // A button owns its own route by default, plus any slot-less ones
        // listed in `owns` — so exactly one button is always highlighted.
        const focused = (item.owns || [item.name]).includes(activeName);

        return (
          <TouchableOpacity
            key={item.name}
            style={styles.item}
            onPress={() => go(item.name)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10 }}
          >
            {/* The pill is always laid out, so labels stay on one baseline */}
            <View style={[styles.slot, focused && styles.slotOn]}>
              <Icon
                name={item.icon}
                size={21}
                color={focused ? t.text : t.textMuted}
                strokeWidth={focused ? 1.9 : 1.7}
              />
            </View>
            <Text style={[styles.label, focused && styles.labelOn]} numberOfLines={1}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      <Modal
        visible={composeOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setComposeOpen(false)}
      >
        <Pressable style={styles.composeBackdrop} onPress={() => setComposeOpen(false)}>
          <Animated.View
            style={[
              styles.composeStack,
              {
                bottom: Math.max(insets.bottom, 10) + 84,
                opacity: pop,
                transform: [
                  { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
                  { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                ],
              },
            ]}
          >
            {COMPOSE.map((c) => (
              <Pressable
                key={c.key}
                onPress={() => compose(c)}
                style={({ pressed }) => [styles.composeItem, pressed && styles.composeItemOn]}
              >
                <View style={styles.composeIcon}>
                  <Icon name={c.icon} size={17} color={t.primary} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.composeLabel}>{c.label}</Text>
                  <Text style={styles.composeHint}>{c.hint}</Text>
                </View>
              </Pressable>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      {/* Post is first, so the app opens on the feed. */}
      <Tab.Screen name="Post" component={PostStack} />
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Club" component={ClubStack} />
      <Tab.Screen name="Map" component={MapStack} />
      <Tab.Screen name="Sell" component={SellStack} />
      <Tab.Screen name="More" component={ProfileStack} />
    </Tab.Navigator>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    bar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(15,19,21,0.97)' : 'rgba(252,253,253,0.97)',
      // Curved shoulders, then flush down to the bottom edge of the screen
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      borderTopWidth: 1,
      borderTopColor: t.hairline,
      paddingTop: 10,
      paddingHorizontal: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: isDark ? 0.4 : 0.07,
      shadowRadius: 18,
      elevation: 14,
    },
    item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },

    // Icon well. Only the active tab paints it, which is what lifts it forward.
    slot: {
      width: 48,
      height: 36,
      borderRadius: 18, // exactly half the height — semicircular ends
      alignItems: 'center',
      justifyContent: 'center',
    },
    slotOn: {
      backgroundColor: t.surface,
      borderWidth: isDark ? 1 : 0,
      borderColor: t.hairline,
      shadowColor: '#171B1D',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0 : 0.1,
      shadowRadius: 12,
      elevation: isDark ? 0 : 3,
    },
    label: { fontSize: 11.5, fontWeight: '500', letterSpacing: -0.1, color: t.textMuted },
    labelOn: { fontWeight: '600', color: t.text },

    composeBackdrop: { flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(23,27,29,0.38)' },
    composeStack: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 8 },
    composeItem: {
      width: 262,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 18,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderSoft,
      shadowColor: '#171B1D',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0 : 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    composeItemOn: { backgroundColor: t.field },
    composeIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: t.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    composeLabel: { fontSize: 14, fontWeight: '600', letterSpacing: -0.2, color: t.text },
    composeHint: { fontSize: 11.5, color: t.textMuted, marginTop: 2 },

    // Ink disc with the copper +, sitting a touch above its neighbours.
    fab: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginTop: -8,
      backgroundColor: isDark ? t.surfaceHi : t.ink,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#171B1D',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.5 : 0.24,
      shadowRadius: 18,
      elevation: 8,
    },
    });
  }
