import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Switch } from 'react-native';
import { Text } from '../components/Text';
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
import { font, radius, layout, shadow, monoFamily } from '../theme';
import AmbientGlow from '../components/AmbientGlow';

export default function ProfileScreen({ navigation }) {
  const { t, isDark, toggle } = useTheme();
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
    { icon: 'map', label: 'Campus map', onPress: () => navigation.getParent()?.navigate('Map') },
    // One place for everything they have posted, of any kind.
    { icon: 'list', label: 'My activity', onPress: () => navigation.navigate('MyActivity') },
    { icon: 'trophy', label: 'Campus score', onPress: () => navigation.navigate('CampusScore') },
    { icon: 'bookmark', label: 'Past papers & notes', onPress: () => navigation.navigate('Resources') },
    { icon: 'users', label: 'My clubs', onPress: () => navigation.getParent()?.navigate('Club') },
    { icon: 'chat', label: 'Messages', onPress: () => navigation.getParent()?.navigate('Post', { screen: 'ChatList' }) },
    { icon: 'bell', label: 'Settings', onPress: () => navigation.navigate('Feature', { step: '00', label: 'SETTINGS', headerTitle: 'Settings', title: 'Settings', subtitle: 'Notifications, privacy and account settings are coming soon.', bullets: ['NOTIFY', 'PRIVACY', 'ACCOUNT'] }) },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AmbientGlow />
      <ScrollView contentContainerStyle={{ paddingBottom: layout.tabBarSpace }}>
        {/* Identity card — avatar, name and stats read as one block */}
        <View style={styles.idCard}>
          <View style={styles.idRow}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <Avatar name={user?.name} size={62} gradient />
            )}

            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {user?.name}
                </Text>
                {user?.isVerified ? (
                  <Icon name="verified" size={15} color={t.accent} strokeWidth={2} />
                ) : null}
              </View>
              <Text style={styles.handle} numberOfLines={1}>
                @{handleOf(user?.name)}
              </Text>
              <View style={styles.metaRow}>
                <View style={styles.deptChip}>
                  <Text style={styles.deptText}>{user?.branch || 'No branch'}</Text>
                </View>
                {user?.semester ? <Text style={styles.sem}>Sem {user.semester}</Text> : null}
              </View>
            </View>

            <TouchableOpacity
              style={styles.editIcon}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.85}
            >
              <Icon name="edit" size={16} color={t.text} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          <View style={styles.statRow}>
            <Stat styles={styles} num={user?.campusScore ?? 0} label="Points" onPress={() => navigation.navigate('CampusScore')} />
            <View style={styles.statDivider} />
            <Stat styles={styles} num={counts.posts} label="Posts" />
            <View style={styles.statDivider} />
            <Stat styles={styles} num={counts.listings} label="Listings" />
            <View style={styles.statDivider} />
            <Stat styles={styles} num={counts.clubs} label="Clubs" />
          </View>
        </View>

        {/* Department details */}
        <Text style={styles.groupTitle}>Details</Text>
        <View style={styles.card}>
          <Detail styles={styles} label="Department" value={user?.branch || '—'} />
          <Detail styles={styles} label="Semester" value={user?.semester ? `Semester ${user.semester}` : '—'} />
          <Detail styles={styles} label="Email" value={user?.email} last />
        </View>

        {/* Skills — what teammates search for */}
        <Text style={styles.groupTitle}>Skills</Text>
        <View style={[styles.card, styles.skillsCard]}>
          {user?.skills?.length ? (
            <View style={styles.tags}>
              {user.skills.map((s) => (
                <View key={s} style={styles.tag}><Text style={styles.tagText}>{s}</Text></View>
              ))}
            </View>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.7}>
              <Text style={styles.addSkills}>Add your skills so teams can find you →</Text>
            </TouchableOpacity>
          )}
          {user?.learning?.length ? (
            <>
              <Text style={styles.learningLabel}>WANT TO LEARN</Text>
              <View style={styles.tags}>
                {user.learning.map((s) => (
                  <View key={s} style={[styles.tag, styles.tagLearn]}><Text style={[styles.tagText, styles.tagLearnText]}>{s}</Text></View>
                ))}
              </View>
            </>
          ) : null}
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

function Stat({ num, label, styles, onPress }) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap style={styles.stat} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.statNum}>{num}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Wrap>
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
    idCard: {
      marginHorizontal: 14,
      marginTop: 12,
      backgroundColor: t.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: t.borderSoft,
      paddingTop: 16,
      overflow: 'hidden',
      ...shadow.card,
    },
    idRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingBottom: 16 },
    avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: t.surfaceMuted },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { flexShrink: 1, fontSize: 19, fontWeight: '700', letterSpacing: -0.5, color: t.text },
    handle: { fontSize: 12.5, color: t.textMuted, marginTop: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    deptChip: { backgroundColor: t.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    deptText: { fontSize: 11.5, fontWeight: '600', color: t.text },
    sem: { fontFamily: monoFamily, fontSize: 9.5, fontWeight: '700', letterSpacing: 0.8, color: t.textMuted },
    editIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.field,
      borderWidth: 1,
      borderColor: t.borderSoft,
    },
    // Stats sit on the card's own footer band, like the feed card action bar.
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      backgroundColor: t.surfaceAlt,
      borderTopWidth: 1,
      borderTopColor: t.hairlineAlt,
    },
    stat: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 17, fontWeight: '700', letterSpacing: -0.4, color: t.text },
    statLabel: { fontFamily: monoFamily, fontSize: 8.5, fontWeight: '700', letterSpacing: 1.1, color: t.textMuted, marginTop: 4 },
    statDivider: { width: 1, height: 24, backgroundColor: t.hairline },
    groupTitle: { ...font.eyebrow, color: t.textMuted, marginTop: 24, marginBottom: 8, marginLeft: 18 },
    card: { marginHorizontal: 14, backgroundColor: t.surface, borderRadius: 20, borderWidth: 1, borderColor: t.border, ...shadow.card },
    skillsCard: { padding: 14 },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    tag: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: t.primary },
    tagText: { fontSize: 12.5, fontWeight: '600', color: t.onPrimary },
    tagLearn: { backgroundColor: t.accentSoft },
    tagLearnText: { color: t.accent },
    learningLabel: { fontFamily: monoFamily, fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: t.textMuted, marginTop: 12, marginBottom: 7 },
    addSkills: { fontSize: 14, fontWeight: '600', color: t.accent },
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
