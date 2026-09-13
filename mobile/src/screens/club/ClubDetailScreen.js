import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../../components/Icon';
import ClubDoodle from '../../components/ClubDoodle';
import { Button } from '../../components/ui';
import { handleOf } from '../../components/ThreadPost';
import { ClubApi } from '../../api/clubs';
import { useTheme } from '../../context/ThemeContext';
import { layout, monoFamily } from '../../theme';
import AmbientGlow from '../../components/AmbientGlow';

const CAT = {
  tech: 'TECH', cultural: 'CULTURAL', sports: 'SPORTS',
  academic: 'ACADEMIC', arts: 'ARTS', social: 'SOCIAL', other: 'GENERAL',
};

function monogram(name) {
  return (name || '?').split(' ').filter(Boolean).map((w) => w.charAt(0)).slice(0, 2).join('').toUpperCase();
}

export default function ClubDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const { t, clubs, isDark } = useTheme();
  const c = clubs[club?.category] || clubs.other;
  const styles = useMemo(() => makeStyles(t, c, isDark), [t, c, isDark]);

  const load = useCallback(async () => {
    try { setClub(await ClubApi.get(id)); }
    catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <ActivityIndicator size="large" color={t.primary} style={styles.loading} />;
  if (!club) {
    return (
      <SafeAreaView style={styles.safe}>
        <AmbientGlow />
        <Text style={styles.blank}>Not found.</Text>
      </SafeAreaView>
    );
  }

  const members = club.members || [];
  const pending = (club.requests || []).filter((r) => r.status === 'pending');

  async function review(userId, status) {
    setBusy(true);
    try { setClub(await ClubApi.reviewRequest(id, userId, status)); }
    catch (e) { Alert.alert('Error', e.message); }
    finally { setBusy(false); }
  }

  function leave() {
    Alert.alert('Leave club', `Leave ${club.name}? You would need to apply again to rejoin.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => ClubApi.leave(id).then(load).catch((e) => Alert.alert('Error', e.message)),
      },
    ]);
  }

  function remove() {
    Alert.alert('Delete club', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => ClubApi.remove(id).then(() => navigation.goBack()).catch((e) => Alert.alert('Error', e.message)),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: layout.tabBarSpace }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ClubDoodle category={club.category} color={c.fg} size={120} style={styles.doodle} />
          <View style={styles.crest}>
            <Text style={styles.crestText}>{monogram(club.name)}</Text>
          </View>
          <Text style={styles.cat}>{CAT[club.category] || 'CLUB'}</Text>
          <Text style={styles.name}>{club.name}</Text>
          <Text style={styles.meta}>
            {members.length} {members.length === 1 ? 'member' : 'members'} · led by {handleOf(club.createdBy?.name)}
          </Text>
          {club.description ? <Text style={styles.desc}>{club.description}</Text> : null}
        </View>

        {/* President: applications waiting on you */}
        {club.isAdmin ? (
          <View style={styles.block}>
            <View style={styles.blockHead}>
              <Text style={styles.blockTitle}>Join requests</Text>
              <Text style={styles.blockCount}>{pending.length}</Text>
            </View>

            {pending.length === 0 ? (
              <Text style={styles.none}>No requests waiting.</Text>
            ) : (
              pending.map((r) => (
                <View key={r._id} style={styles.req}>
                  <View style={styles.reqHead}>
                    <View style={styles.reqAva}>
                      <Text style={styles.reqAvaText}>{monogram(r.user?.name)}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.reqName}>{handleOf(r.user?.name)}</Text>
                      <Text style={styles.reqSub}>
                        {r.branch || r.user?.branch || 'Campus'}{r.semester ? ` · Sem ${r.semester}` : ''}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.reqWhy}>{r.why}</Text>
                  {r.skills ? <Text style={styles.reqSkills}>Skills · {r.skills}</Text> : null}
                  {r.consent ? (
                    <View style={styles.consented}>
                      <Icon name="check" size={10} color={t.success} strokeWidth={3} />
                      <Text style={styles.consentedText}>Consent given</Text>
                    </View>
                  ) : null}

                  <View style={styles.reqBtns}>
                    <TouchableOpacity style={styles.accept} disabled={busy} onPress={() => review(r.user?._id || r.user, 'approved')} activeOpacity={0.85}>
                      <Text style={styles.acceptText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.decline} disabled={busy} onPress={() => review(r.user?._id || r.user, 'rejected')} activeOpacity={0.85}>
                      <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {/* Members */}
        <View style={styles.block}>
          <View style={styles.blockHead}>
            <Text style={styles.blockTitle}>Members</Text>
            <Text style={styles.blockCount}>{members.length}</Text>
          </View>
          {members.map((m) => {
            const isPresident = String(m._id) === String(club.createdBy?._id || club.createdBy);
            return (
              <View key={m._id} style={styles.member}>
                <View style={styles.memberAva}>
                  <Text style={styles.memberAvaText}>{monogram(m.name)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.memberName}>{handleOf(m.name)}</Text>
                  <Text style={styles.memberSub}>
                    {m.branch || 'Student'}{m.semester ? ` · Sem ${m.semester}` : ''}
                  </Text>
                </View>
                {isPresident ? (
                  <View style={styles.roleTag}><Text style={styles.roleText}>PRESIDENT</Text></View>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
          {club.isAdmin ? (
            <Button title="Delete club" variant="danger" onPress={remove} />
          ) : club.isMember ? (
            <Button title="Leave club" variant="secondary" onPress={leave} />
          ) : club.myRequest === 'pending' ? (
            <View style={styles.waiting}>
              <Text style={styles.waitingText}>Request sent — waiting for the president</Text>
            </View>
          ) : (
            <Button
              title="Request to join"
              onPress={() => navigation.navigate('JoinClub', { id, name: club.name, category: club.category })}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(t, c, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.page },
    loading: { flex: 1, backgroundColor: t.page },
    blank: { padding: 24, color: t.textMuted },

    hero: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 24 },
    doodle: { position: 'absolute', right: 10, top: 0, opacity: isDark ? 0.14 : 0.1 },
    crest: {
      width: 66,
      height: 66,
      borderRadius: 33,
      backgroundColor: c.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    crestText: { fontFamily: monoFamily, fontSize: 22, fontWeight: '700', color: c.fg },
    cat: { fontFamily: monoFamily, fontSize: 9, fontWeight: '700', letterSpacing: 1.4, color: c.fg, marginTop: 12 },
    name: { fontSize: 22, fontWeight: '700', letterSpacing: -0.7, color: t.text, marginTop: 4 },
    meta: { fontSize: 12.5, color: t.textMuted, marginTop: 5 },
    desc: { fontSize: 13.5, lineHeight: 20, color: t.text, marginTop: 14, textAlign: 'center' },

    block: { marginTop: 26, marginHorizontal: 18 },
    blockHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    blockTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3, color: t.text },
    blockCount: { fontFamily: monoFamily, fontSize: 10, fontWeight: '500', color: t.textDim },
    none: { fontSize: 12.5, color: t.textMuted },

    req: {
      backgroundColor: t.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.borderSoft,
      padding: 14,
      marginBottom: 10,
    },
    reqHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    reqAva: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' },
    reqAvaText: { fontFamily: monoFamily, fontSize: 11, fontWeight: '700', color: c.fg },
    reqName: { fontSize: 13, fontWeight: '600', color: t.text },
    reqSub: { fontSize: 11.5, color: t.textMuted, marginTop: 2 },
    reqWhy: { fontSize: 13, lineHeight: 19, color: t.text, marginTop: 11 },
    reqSkills: { fontSize: 11.5, color: t.textMuted, marginTop: 6 },
    consented: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
    consentedText: { fontFamily: monoFamily, fontSize: 8.5, fontWeight: '700', letterSpacing: 0.8, color: t.success },
    reqBtns: { flexDirection: 'row', gap: 8, marginTop: 13 },
    accept: { backgroundColor: t.primary, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 9 },
    acceptText: { fontSize: 12.5, fontWeight: '700', color: t.onPrimary },
    decline: { borderWidth: 1, borderColor: t.borderSoft, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 9 },
    declineText: { fontSize: 12.5, fontWeight: '600', color: t.textMuted },

    member: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.hairline },
    memberAva: { width: 34, height: 34, borderRadius: 17, backgroundColor: t.field, alignItems: 'center', justifyContent: 'center' },
    memberAvaText: { fontFamily: monoFamily, fontSize: 11, fontWeight: '700', color: t.textMuted },
    memberName: { fontSize: 13, fontWeight: '600', color: t.text },
    memberSub: { fontSize: 11.5, color: t.textMuted, marginTop: 2 },
    roleTag: { backgroundColor: c.bg, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
    roleText: { fontFamily: monoFamily, fontSize: 8, fontWeight: '700', letterSpacing: 0.8, color: c.fg },

    actions: { marginTop: 26, marginHorizontal: 18 },
    waiting: { borderRadius: 999, backgroundColor: t.field, paddingVertical: 14, alignItems: 'center' },
    waitingText: { fontSize: 12.5, fontWeight: '600', color: t.textMuted },
  });
}
