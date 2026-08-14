import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Avatar from './Avatar';
import { imageUrl } from '../api/clubs';
import { colors, radius, shadow } from '../theme';

const CAT = { tech: 'Tech', cultural: 'Cultural', sports: 'Sports', academic: 'Academic', arts: 'Arts', social: 'Social', other: 'General' };

/** A club card with a Join / Leave toggle. */
export default function ClubCard({ club, onPress, onToggle, busy }) {
  const uri = imageUrl(club.image);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      {uri ? <Image source={{ uri }} style={styles.logo} /> : <Avatar name={club.name} size={52} />}

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{club.name}</Text>
        <Text style={styles.meta}>{CAT[club.category] || 'Club'} · {club.memberCount || 0} members</Text>
        {club.description ? <Text style={styles.desc} numberOfLines={1}>{club.description}</Text> : null}
      </View>

      <TouchableOpacity
        style={[styles.btn, club.isMember ? styles.btnJoined : styles.btnJoin]}
        onPress={onToggle}
        disabled={busy}
        activeOpacity={0.85}
      >
        <Text style={[styles.btnText, { color: club.isMember ? colors.textMuted : colors.onPrimary }]}>
          {club.isMember ? 'Joined' : 'Join'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, marginHorizontal: 14, marginBottom: 12, padding: 12, ...shadow.soft },
  logo: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surfaceMuted },
  body: { flex: 1, minWidth: 0 },
  name: { fontSize: 15.5, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12.5, color: colors.primary, marginTop: 2, fontWeight: '500' },
  desc: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  btn: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  btnJoin: { backgroundColor: colors.primary },
  btnJoined: { backgroundColor: colors.surfaceMuted },
  btnText: { fontSize: 13, fontWeight: '700' },
});
