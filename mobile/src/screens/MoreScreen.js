import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, font, radius, layout } from '../theme';

const FEATURE = {
  community: { step: '09', label: 'COMMUNITY', title: 'Campus community', headerTitle: 'Community', subtitle: 'Campus-wide posts, polls and announcements — everything happening, in one feed.', bullets: ['POST', 'POLL', 'FOLLOW'], icon: 'chatbubble-ellipses-outline' },
  placement: { step: '09', label: 'PLACEMENT HUB', title: 'Placement hub', headerTitle: 'Placement Hub', subtitle: 'Share referral openings and resume templates. Help each other land the offer.', bullets: ['REFER', 'APPLY', 'GROW'], icon: 'briefcase-outline' },
  map: { step: '05', label: 'CAMPUS MAP', title: 'Campus map', headerTitle: 'Campus Map', subtitle: 'Find blocks, labs, canteens and venues with an interactive campus map.', bullets: ['LOCATE', 'NAVIGATE', 'ARRIVE'], icon: 'map-outline' },
  score: { step: '06', label: 'CAMPUS SCORE', title: 'Your campus score', headerTitle: 'Campus Score', subtitle: 'Earn points for helping out and staying active. Climb the campus leaderboard.', bullets: ['ENGAGE', 'EARN', 'CLIMB'], icon: 'ribbon-outline' },
  profile: { step: '00', label: 'PROFILE', title: 'Your profile', headerTitle: 'Profile', subtitle: 'Profile editing, avatar and campus details are coming in a later phase.', bullets: ['EDIT', 'AVATAR', 'SHARE'], icon: 'person-outline' },
  settings: { step: '00', label: 'SETTINGS', title: 'Settings', headerTitle: 'Settings', subtitle: 'Notifications, privacy and account settings are coming soon.', bullets: ['NOTIFY', 'PRIVACY', 'ACCOUNT'], icon: 'settings-outline' },
  help: { step: '00', label: 'HELP', title: 'Help & support', headerTitle: 'Help', subtitle: 'FAQs and support are coming soon. For now, reach out to your campus admin.', bullets: ['FAQ', 'CONTACT', 'REPORT'], icon: 'help-circle-outline' },
};

export default function MoreScreen({ navigation }) {
  const { user, logout } = useAuth();

  const openFeature = (f) => navigation.navigate('Feature', f);
  const openMyPosts = () => navigation.navigate('Post', { screen: 'MyPosts' });

  function onLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  }

  const activity = [
    { icon: 'chatbubbles-outline', label: 'Messages', onPress: () => navigation.navigate('ChatList') },
    { icon: 'albums-outline', label: 'My Posts & Applications', onPress: openMyPosts },
    { icon: 'ribbon-outline', label: 'Campus Score', onPress: () => openFeature(FEATURE.score) },
  ];
  const campus = [
    { icon: 'chatbubble-ellipses-outline', label: 'Community', onPress: () => openFeature(FEATURE.community) },
    { icon: 'briefcase-outline', label: 'Placement Hub', onPress: () => openFeature(FEATURE.placement) },
    { icon: 'map-outline', label: 'Campus Map', onPress: () => openFeature(FEATURE.map) },
  ];
  const account = [
    { icon: 'person-outline', label: 'Profile', onPress: () => openFeature(FEATURE.profile) },
    { icon: 'settings-outline', label: 'Settings', onPress: () => openFeature(FEATURE.settings) },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => openFeature(FEATURE.help) },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={font.h1}>More</Text>

        {/* Profile card */}
        <TouchableOpacity style={styles.profile} activeOpacity={0.85} onPress={() => openFeature(FEATURE.profile)}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={font.h3}>{user?.name}</Text>
            <Text style={font.small}>{user?.email}</Text>
            <View style={styles.tags}>
              {user?.branch ? <Text style={styles.tag}>{user.branch}</Text> : null}
              {user?.semester ? <Text style={styles.tag}>Sem {user.semester}</Text> : null}
              {user?.isVerified ? (
                <View style={styles.verified}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              ) : null}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <Group title="Your activity" items={activity} />
        <Group title="Campus" items={campus} />
        <Group title="Account" items={account} />

        <Button title="Log out" variant="secondary" onPress={onLogout} style={{ marginTop: spacing.xl }} />
        <Text style={styles.version}>Campus Bond · v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group({ title, items }) {
  return (
    <>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.list}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.item, i < items.length - 1 && styles.itemBorder]}
            onPress={item.onPress}
            activeOpacity={0.8}
          >
            <View style={styles.itemIcon}>
              <Ionicons name={item.icon} size={19} color={colors.primary} />
            </View>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: layout.tabBarSpace },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  avatarText: { color: colors.onPrimary, fontWeight: '900', fontSize: 24 },
  tags: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, flexWrap: 'wrap' },
  tag: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  verified: { flexDirection: 'row', alignItems: 'center' },
  verifiedText: { color: colors.success, fontSize: 12, fontWeight: '700', marginLeft: 3 },
  groupTitle: { ...font.small, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.xl, marginBottom: spacing.sm, marginLeft: spacing.xs },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  item: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemLabel: { ...font.label, flex: 1 },
  version: { ...font.small, textAlign: 'center', marginTop: spacing.xl, color: colors.textFaint },
});
