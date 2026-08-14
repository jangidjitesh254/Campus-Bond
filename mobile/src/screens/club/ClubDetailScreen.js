import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from '../../components/Avatar';
import Icon from '../../components/Icon';
import { Button, Loading } from '../../components/ui';
import { handleOf } from '../../components/ThreadPost';
import { ClubApi, imageUrl } from '../../api/clubs';
import { colors, spacing, font, radius, layout } from '../../theme';

const CAT = { tech: 'Tech', cultural: 'Cultural', sports: 'Sports', academic: 'Academic', arts: 'Arts', social: 'Social', other: 'General' };

export default function ClubDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setClub(await ClubApi.get(id)); } catch (e) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Loading />;
  if (!club) return <SafeAreaView style={styles.safe}><Text style={[font.bodyMuted, { padding: 24 }]}>Not found.</Text></SafeAreaView>;

  const uri = imageUrl(club.image);

  async function toggle() {
    setBusy(true);
    try {
      const res = club.isMember ? await ClubApi.leave(id) : await ClubApi.join(id);
      setClub({ ...club, isMember: res.isMember, memberCount: res.memberCount });
      load();
    } catch (e) { Alert.alert('Error', e.message); } finally { setBusy(false); }
  }
  function onDelete() {
    Alert.alert('Delete club', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => ClubApi.remove(id).then(() => navigation.goBack()).catch((e) => Alert.alert('Error', e.message)) },
    ]);
  }

  const members = club.members || [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: layout.tabBarSpace }}>
        <View style={styles.hero}>
          {uri ? <Image source={{ uri }} style={styles.logo} /> : <Avatar name={club.name} size={84} />}
          <Text style={styles.name}>{club.name}</Text>
          <Text style={styles.meta}>{CAT[club.category] || 'Club'} · {club.memberCount || 0} members</Text>
        </View>

        {club.description ? <Text style={styles.desc}>{club.description}</Text> : null}

        <Button
          title={club.isMember ? 'Leave club' : 'Join club'}
          variant={club.isMember ? 'secondary' : 'primary'}
          onPress={toggle}
          loading={busy}
          style={{ marginTop: spacing.lg }}
        />
        {club.isAdmin ? <Button title="Delete club" variant="danger" onPress={onDelete} style={{ marginTop: spacing.md }} /> : null}

        <Text style={styles.section}>Members ({members.length})</Text>
        {members.map((m) => (
          <View key={m._id} style={styles.member}>
            <Avatar name={m.name} size={38} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.mName}>{handleOf(m.name)}</Text>
              <Text style={styles.mSub}>{m.branch || 'Student'}{m.semester ? ` · Sem ${m.semester}` : ''}</Text>
            </View>
            {String(m._id) === String(club.createdBy?._id || club.createdBy) ? (
              <View style={styles.adminTag}><Text style={styles.adminText}>ADMIN</Text></View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  hero: { alignItems: 'center', gap: 6 },
  logo: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.surfaceMuted },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 6 },
  meta: { fontSize: 13.5, color: colors.primary, fontWeight: '500' },
  desc: { ...font.body, lineHeight: 22, marginTop: 16, textAlign: 'center' },
  section: { ...font.h3, marginTop: 28, marginBottom: 8 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  mName: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  mSub: { fontSize: 12.5, color: colors.textMuted, marginTop: 1 },
  adminTag: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  adminText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
});
