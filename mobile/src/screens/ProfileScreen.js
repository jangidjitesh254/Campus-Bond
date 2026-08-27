import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import { handleOf } from '../components/ThreadPost';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { imageUrl } from '../api/market';
import { EventsApi } from '../api/events';
import { MarketApi } from '../api/market';
import { ClubApi } from '../api/clubs';
import { spacing, font, radius, layout, shadow } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { t, kinds, isDark, toggle } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const { user, logout } = useAuth();
  const [counts, setCounts] = useState({ posts: 0, listings: 0, clubs: 0 });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([EventsApi.myCreated().catch(() => []), MarketApi.myListings().catch(() => []), ClubApi.mine().catch(() => [])])
        .then(([p, l, c]) => active && setCounts({ posts: p.length, listings: l.length, clubs: c.length }))
        .catch(() => {});
      return () => { active = false; };
    }, [])
  );

  function onLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  }

  const avatarUri = imageUrl(user?.avatar);

  const rows = [
    { icon: 'edit', label: 'Edit profile', onPress: () => navigation.navigate('EditProfile') },
    { icon: 'moon', label: 'Dark theme', switchOn: isDark, onPress: toggle },
    { icon: 'grid', label: 'Campus dashboard', onPress: () => navigation.getParent()?.navigate('Home') },
    { icon: 'map', label: 'Campus map', onPress: () => navigation.getParent()?.navigate('Map') },
    { icon: 'megaphone', label: 'My posts', onPress: () => navigation.getParent()?.navigate('Post', { screen: 'MyPosts' }) },
    { icon: 'tag', label: 'My listings', onPress: () => navigation.getParent()?.navigate('Sell', { screen: 'MyListings' }) },
    { icon: 'search', label: 'My lost & found', onPress: () => navigation.getParent()?.navigate('Post', { screen: 'MyLostPosts' }) },
    { icon: 'users', label: 'My clubs', onPress: () => navigation.getParent()?.navigate('Club') },
    { icon: 'chat', label: 'Messages', onPress: () => navigation.getParent()?.navigate('Post', { screen: 'ChatList' }) },
    { icon: 'bell', label: 'Settings', onPress: () => navigation.navigate('Feature', { step: '00', label: 'SETTINGS', headerTitle: 'Settings', title: 'Settings', subtitle: 'Notifications, privacy and account settings are coming soon.', bullets: ['NOTIFY', 'PRIVACY', 'ACCOUNT'] }) },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: layout.tabBarSpace }}>
        {/* Profile header */}
        <View style={styles.head}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <Avatar name={user?.name} size={80} bg={t.primary} textColor={t.onPrimary} />
          )}
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.handle}>@{handleOf(user?.name)}</Text>
          <View style={styles.chips}>
            <View style={styles.deptChip}><Text style={styles.deptText}>{user?.branch || 'No branch'}{user?.semester ? ` · Sem ${user.semester}` : ''}</Text></View>
            {user?.isVerified ? (
              <View style={styles.verified}>
                <Icon name="verified" size={14} color={t.primary} strokeWidth={2} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.85}>
            <Icon name="edit" size={15} color={t.onPrimary} strokeWidth={1.8} />
            <Text style={styles.editText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <Stat styles={styles} num={user?.campusScore ?? 0} label="Points" />
          <View style={styles.statDivider} />
          <Stat styles={styles} num={counts.posts} label="Posts" />
          <View style={styles.statDivider} />
          <Stat styles={styles} num="—" label="Rank" />
        </View>

        {/* Department details */}
        <Text style={styles.groupTitle}>Details</Text>
        <View style={styles.card}>
          <Detail styles={styles} label="Department" value={user?.branch || '—'} />
          <Detail styles={styles} label="Semester" value={user?.semester ? `Semester ${user.semester}` : '—'} />
          <Detail styles={styles} label="Email" value={user?.email} last />
        </View>

        {/* Actions */}
        <Text style={styles.groupTitle}>Account</Text>
        <View style={styles.card}>
          {rows.map((r, i) => (
            <TouchableOpacity key={r.label} style={[styles.row, i < rows.length - 1 && styles.rowBorder]} onPress={r.onPress} activeOpacity={0.7}>
              <View style={styles.rowIcon}><Icon name={r.icon} size={18} color={t.primary} strokeWidth={1.7} /></View>
              <Text style={styles.rowLabel}>{r.label}</Text>
              {r.switchOn === undefined ? (
                <Icon name="chevronRight" size={18} color={t.textFaint} strokeWidth={2} />
              ) : (
                <Switch
                  value={r.switchOn}
                  onValueChange={r.onPress}
                  trackColor={{ true: t.primary, false: t.surfaceHi }}
                  thumbColor="#fff"
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logout} onPress={onLogout} activeOpacity={0.8}>
          <Icon name="logout" size={18} color={t.danger} strokeWidth={1.7} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
        <Text style={styles.version}>Campus Bond · v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ num, label, styles}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNum}>{num}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function Detail({ label, value, last, styles}) {
  return (
    <View style={[styles.detail, !last && styles.rowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    head: { alignItems: 'center', paddingTop: 16, paddingHorizontal: 16 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: t.surfaceMuted },
    name: { fontSize: 22, fontWeight: '800', color: t.text, marginTop: 10 },
    handle: { fontSize: 14, color: t.textMuted, marginTop: 2 },
    chips: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    deptChip: { backgroundColor: t.surfaceAlt, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
    deptText: { fontSize: 12.5, fontWeight: '600', color: t.primary },
    verified: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    verifiedText: { fontSize: 12.5, fontWeight: '700', color: t.primary },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: t.ink, borderRadius: 12, paddingHorizontal: 17, paddingVertical: 10, marginTop: 14 },
    editText: { fontSize: 13.5, fontWeight: '700', color: t.onPrimary },
    stats: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginTop: 20, backgroundColor: t.surface, borderRadius: 20, borderWidth: 1, borderColor: t.border, paddingVertical: 16, ...shadow.card },
    stat: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 20, fontWeight: '800', color: t.text },
    statLabel: { fontSize: 12, color: t.textMuted, marginTop: 3 },
    statDivider: { width: 1, height: 28, backgroundColor: t.border },
    groupTitle: { ...font.eyebrow, color: t.textMuted, marginTop: 24, marginBottom: 8, marginLeft: 18 },
    card: { marginHorizontal: 14, backgroundColor: t.surface, borderRadius: 20, borderWidth: 1, borderColor: t.border, ...shadow.card },
    detail: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingHorizontal: 16, paddingVertical: 14 },
    detailLabel: { fontSize: 14, color: t.textMuted },
    detailValue: { fontSize: 14, fontWeight: '600', color: t.text, flexShrink: 1, textAlign: 'right' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: t.border },
    rowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: t.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: t.text },
    logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, marginHorizontal: 16, paddingVertical: 14, borderRadius: radius.lg, backgroundColor: t.dangerSoft },
    logoutText: { fontSize: 15, fontWeight: '700', color: t.danger },
    version: { textAlign: 'center', fontSize: 13, color: t.textFaint, marginTop: 20 },
    });
  }
