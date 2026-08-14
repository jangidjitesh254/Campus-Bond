import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from './Icon';
import { handleOf, timeAgo } from './ThreadPost';
import { imageUrl } from '../api/market';
import { colors, radius, shadow } from '../theme';

const CONDITION = { new: 'New', 'like-new': 'Like new', good: 'Good', fair: 'Fair' };

/** A marketplace listing card. */
export default function MarketCard({ item, onPress }) {
  const uri = imageUrl(item.image);
  const seller = item.seller || {};
  const sold = item.status === 'sold';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.thumb}>
        {uri ? <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" /> : <Icon name="tag" size={24} color={colors.mediaStroke} strokeWidth={1.5} />}
        {sold ? <View style={styles.soldTag}><Text style={styles.soldText}>SOLD</Text></View> : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.price}>₹{item.price}</Text>
        <View style={styles.chips}>
          <View style={styles.chip}><Text style={styles.chipText}>{CONDITION[item.condition] || 'Good'}</Text></View>
        </View>
        <Text style={styles.seller}>{handleOf(seller.name)} · {timeAgo(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 14, backgroundColor: colors.surface, borderRadius: radius.lg, marginHorizontal: 14, marginBottom: 12, padding: 12, ...shadow.soft },
  thumb: { width: 84, height: 84, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  soldTag: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(22,36,28,0.82)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  soldText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  body: { flex: 1, minWidth: 0, justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: colors.text, lineHeight: 20 },
  price: { fontSize: 17, fontWeight: '800', color: colors.primary, marginTop: 3 },
  chips: { flexDirection: 'row', gap: 6, marginTop: 6 },
  chip: { backgroundColor: colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { fontSize: 11.5, fontWeight: '600', color: colors.primary },
  seller: { fontSize: 12.5, color: colors.textMuted, marginTop: 6 },
});
