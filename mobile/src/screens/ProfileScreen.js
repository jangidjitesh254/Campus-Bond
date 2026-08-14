import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import { handleOf } from '../components/ThreadPost';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, font, radius, layout } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  function onLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  }

  const rows = [
    { icon: 'edit', label: 'My posts', onPress: () => navigation.getParent()?.navigate('Home', { screen: 'MyPosts' }) },
    { icon: 'search', label: 'My lost & found', onPress: () => navigation.getParent()?.navigate('Lost', { screen: 'MyLostPosts' }) },
    { icon: 'chat', label: 'Messages', onPress: () => navigation.getParent()?.navigate('Home', { screen: 'ChatList' }) },
    { icon: 'heart', label: 'Campus score', onPress: () => navigation.navigate('Feature', { step: '06', label: 'CAMPUS SCORE', headerTitle: 'Campus Score', title: 'Your campus score', subtitle: 'Earn points for helping out and staying active.', bullets: ['ENGAGE', 'EARN', 'CLIMB'] }) },
    { icon: 'bell', label: 'Settings', onPress: () => navigation.navigate('Feature', { step: '00', label: 'SETTINGS', headerTitle: 'Settings', title: 'Settings', subtitle: 'Notifications, privacy and account settings are coming soon.', bullets: ['NOTIFY', 'PRIVACY', 'ACCOUNT'] }) },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: layout.tabBarSpace }}>
        {/* Identity */}
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.handle}>
              {handleOf(user?.name)}
              {user?.branch ? ` · ${user.branch}` : ''}
              {user?.semester ? ` · Sem ${user.semester}` : ''}
            </Text>
          </View>
          <Avatar name={user?.name} size={64} />
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{user?.campusScore ?? 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            {user?.isVerified ? (
              <>
                <Text style={styles.statNum}>✓</Text>
                <Text style={styles.statLabel}>Verified</Text>
              </>
            ) : (
              <>
                <Text style={styles.statNum}>—</Text>
                <Text style={styles.statLabel}>Unverified</Text>
              </>
            )}
          </View>
        </View>

        {/* Rows */}
        <View style={styles.rows}>
          {rows.map((r) => (
            <TouchableOpacity key={r.label} style={styles.row} activeOpacity={0.7} onPress={r.onPress}>
              <Icon name={r.icon} size={20} color={colors.text} strokeWidth={1.6} />
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Icon name="chevronRight" size={18} color={colors.textFaint} strokeWidth={2} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onLogout}>
            <Icon name="logout" size={20} color={colors.like} strokeWidth={1.6} />
            <Text style={[styles.rowLabel, { color: colors.like }]}>Log out</Text>
            <View />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Campus Bond · v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 },
  name: { fontSize: 24, fontWeight: '700', color: colors.text },
  handle: { fontSize: 15, color: colors.textMuted, marginTop: 4 },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  rows: { marginTop: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  version: { textAlign: 'center', fontSize: 13, color: colors.textFaint, marginTop: 24 },
});
