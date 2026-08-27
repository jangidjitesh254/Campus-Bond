import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Share } from 'react-native';
import Icon from './Icon';
import { handleOf, timeAgo } from './ThreadPost';
import { imageUrl } from '../api/lostfound';
import { useTheme } from '../context/ThemeContext';
import { radius, shadow } from '../theme';

/** Lost/found item as a light card with LOST/FOUND label + Raise Hand / Message / Share. */
export default function LostCard({ item, onPress, style }) {
  const { t, kinds, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const uri = imageUrl(item.image);
  const owner = item.createdBy || {};
  const isLost = item.type === 'lost';

  async function onShare() {
    try { await Share.share({ message: `${isLost ? 'LOST' : 'FOUND'}: ${item.title}${item.location ? ` — ${item.location}` : ''}\n\n— Campus Bond` }); } catch {}
  }

  return (
    <TouchableOpacity style={[styles.card, style]} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.top}>
        <View style={[styles.kind, { backgroundColor: isLost ? t.amberSoft : t.primarySoft }]}>
          <Text style={[styles.kindText, { color: isLost ? t.amber : t.primary }]}>{isLost ? 'LOST' : 'FOUND'}</Text>
        </View>
        <View style={styles.thumb}>
          {uri ? <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" /> : <Icon name="image" size={18} color={t.mediaStroke} strokeWidth={1.6} />}
        </View>
      </View>

      <Text style={styles.body}>{item.title}</Text>

      {item.location ? (
        <View style={styles.metaRow}>
          <Icon name="location" size={14} color={t.textMuted} strokeWidth={1.7} />
          <Text style={styles.meta}>{item.location}</Text>
        </View>
      ) : null}
      <View style={styles.metaRow}>
        <Icon name="bell" size={13} color={t.textMuted} strokeWidth={1.7} />
        <Text style={styles.meta}>{timeAgo(item.createdAt)} · by {handleOf(owner.name)}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.raise} onPress={onPress}>
          <Icon name="hand" size={15} color={t.onPrimary} strokeWidth={1.8} />
          <Text style={styles.raiseText}>Raise Hand</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.msg} onPress={onPress}>
          <Icon name="chat" size={15} color={t.text} strokeWidth={1.7} />
          <Text style={styles.msgText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.share} onPress={onShare}>
          <Icon name="repost" size={16} color={t.textMuted} strokeWidth={1.7} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    card: { backgroundColor: t.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: t.border, marginHorizontal: 14, marginBottom: 12, padding: 14, ...shadow.soft },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    kind: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    kindText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8 },
    thumb: { width: 34, height: 34, borderRadius: 8, backgroundColor: t.surfaceMuted, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    thumbImg: { width: '100%', height: '100%' },
    body: { fontSize: 15.5, lineHeight: 22, color: t.text, fontWeight: '500' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    meta: { fontSize: 13, color: t.textMuted },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
    raise: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.primary, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
    raiseText: { fontSize: 13, fontWeight: '700', color: t.onPrimary },
    msg: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: t.border, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
    msgText: { fontSize: 13, fontWeight: '600', color: t.text },
    share: { width: 38, height: 38, borderRadius: 999, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' },
    });
  }
