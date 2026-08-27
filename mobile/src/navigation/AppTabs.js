import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  { name: 'More', label: 'More', icon: 'dotsH' },
];

/** Bottom bar with curved shoulders: icon over label, the active one lifted
 *  into a raised pill, and an ink circle carrying the centre + action. */
function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);

  // The "+" opens CreateLost while the Post feed is on its Lost Found filter,
  // otherwise a normal post. The feed publishes its filter into route params.
  function createTarget() {
    const post = state.routes.find((r) => r.name === 'Post');
    const feed = post?.state?.routes?.find((r) => r.name === 'PostFeed');
    return feed?.params?.filter === 'Lost Found' ? 'CreateLost' : 'CreateEvent';
  }

  function go(name) {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const focused = state.routes[state.index].key === route.key;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(name);
  }

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) + 14 }]}>
      {BAR.map((item) => {
        if (!item) {
          return (
            <View key="fab" style={styles.item}>
              <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Post', { screen: createTarget() })}
              >
                <Icon name="plus" size={22} color={t.accent} strokeWidth={2.6} />
              </TouchableOpacity>
            </View>
          );
        }
        const route = state.routes.find((r) => r.name === item.name);
        const focused = route ? state.routes[state.index].key === route.key : false;

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
      paddingTop: 16,
      paddingHorizontal: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: isDark ? 0.4 : 0.07,
      shadowRadius: 18,
      elevation: 14,
    },
    item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },

    // Icon well. Only the active tab paints it, which is what lifts it forward.
    slot: {
      width: 50,
      height: 42,
      borderRadius: 15,
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

    // Ink disc with the copper +, sitting a touch above its neighbours.
    fab: {
      width: 54,
      height: 54,
      borderRadius: 27,
      marginTop: -12,
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
