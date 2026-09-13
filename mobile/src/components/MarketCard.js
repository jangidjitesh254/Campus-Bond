import React, { useMemo } from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './Text';
import Icon from './Icon';
import { handleOf } from './ThreadPost';
import { imageUrl } from '../api/market';
import { useTheme } from '../context/ThemeContext';

const CONDITION = { new: 'NEW', 'like-new': 'LIKE NEW', good: 'GOOD', fair: 'FAIR' };

/** The buy pill's state, mirrored from the listing. */
function buyState(item) {
  if (item.status === 'sold') return { label: 'SOLD', muted: true };
  if (item.myInterest === 'accepted') return { label: 'CHAT', filled: true };
  if (item.myInterest === 'pending') return { label: 'SENT', muted: true };
  if (item.myInterest === 'rejected') return { label: 'CLOSED', muted: true };
  return { label: 'BUY' };
}

/**
 * Market listing. Grid form: a square-ish photo with the heart top-right and
 * the BUY pill floating over its lower edge, then price + condition, title
 * and seller underneath with no card chrome. `wide` is the row form used in
 * lists and search results.
 */
export default function MarketCard({ item, onPress, onLike, onBuy, badge, wide }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);

  const uri = imageUrl(item.image);
  const seller = item.seller || {};
  const sold = item.status === 'sold';
  const condition = CONDITION[item.condition] || 'GOOD';
  const buy = buyState(item);

  const photo = (
    <View style={wide ? styles.wideImg : styles.img}>
      {uri ? (
        <Image source={{ uri }} style={styles.imgFill} resizeMode="cover" />
      ) : (
        <Icon name="tag" size={wide ? 22 : 30} color={t.mediaStroke} strokeWidth={1.5} />
      )}
      {sold ? (
        <View style={styles.soldVeil}><Text style={styles.soldText}>SOLD</Text></View>
      ) : null}
      {onLike ? (
        <TouchableOpacity style={styles.likeBtn} onPress={onLike} hitSlop={8} activeOpacity={0.8}>
          <Icon name="heart" size={13} color={item.isLiked ? t.accentFill : '#FFFFFF'} filled={item.isLiked} strokeWidth={1.8} />
        </TouchableOpacity>
      ) : null}
      {!wide && onBuy && !sold ? (
        <TouchableOpacity
          style={[styles.buy, buy.filled && styles.buyFilled, buy.muted && styles.buyMuted]}
          onPress={buy.label === 'BUY' ? onBuy : onPress}
          activeOpacity={0.85}
        >
          <Text style={[styles.buyText, buy.filled && { color: '#FFFFFF' }, buy.muted && { color: 'rgba(255,255,255,0.7)' }]}>{buy.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const priceRow = (
    <View style={styles.priceRow}>
      <Text style={styles.price}>₹{item.price}</Text>
      <View style={styles.cond}><Text style={styles.condText}>{condition}</Text></View>
    </View>
  );

  if (wide) {
    return (
      <TouchableOpacity style={styles.wideCard} activeOpacity={0.96} onPress={onPress}>
        {photo}
        <View style={styles.wideBody}>
          {badge ? (
            <View style={[styles.badge, badge.tone === 'ok' && styles.badgeOk, badge.tone === 'off' && styles.badgeOff]}>
              <Text style={[styles.badgeText, badge.tone === 'ok' && { color: t.success }, badge.tone === 'off' && { color: t.textMuted }]}>{badge.label}</Text>
            </View>
          ) : null}
          {priceRow}
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.seller} numberOfLines={1}>by {handleOf(seller.name)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.96} onPress={onPress}>
      {photo}
      {priceRow}
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      <View style={styles.footRow}>
        <Text style={styles.seller} numberOfLines={1}>by {handleOf(seller.name)}</Text>
        {item.likeCount ? (
          <View style={styles.likes}>
            <Icon name="heart" size={11} color={t.textDim} filled strokeWidth={1.6} />
            <Text style={styles.likesText}>{item.likeCount}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    card: { flex: 1, gap: 8 },
    img: { width: '100%', aspectRatio: 1 / 1.05, borderRadius: 16, backgroundColor: t.field, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    imgFill: { width: '100%', height: '100%' },

    likeBtn: {
      position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13,
      backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center', justifyContent: 'center',
    },
    buy: {
      position: 'absolute', bottom: 10, alignSelf: 'center',
      paddingHorizontal: 20, paddingVertical: 6, borderRadius: 16,
      borderWidth: 1.4, borderColor: '#FF8A93', backgroundColor: 'rgba(10,10,13,0.45)',
    },
    buyFilled: { backgroundColor: '#E23747', borderColor: '#E23747' },
    buyMuted: { borderColor: 'rgba(255,255,255,0.25)' },
    buyText: { fontSize: 12, fontWeight: '800', color: '#FF8A93' },

    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    price: { fontSize: 16, fontWeight: '800', color: t.text },
    cond: { backgroundColor: t.surfaceAlt, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    condText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.4, color: t.textMuted },
    title: { fontSize: 13.5, lineHeight: 17.5, fontWeight: '700', color: t.text },
    footRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    seller: { flex: 1, fontSize: 12, fontWeight: '600', color: t.textDim },
    likes: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    likesText: { fontSize: 11, fontWeight: '600', color: t.textDim },

    wideCard: { flexDirection: 'row', gap: 14, marginHorizontal: 20, marginBottom: 16 },
    wideImg: { width: 104, height: 110, borderRadius: 16, backgroundColor: t.field, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    wideBody: { flex: 1, minWidth: 0, gap: 6, justifyContent: 'center' },
    badge: { alignSelf: 'flex-start', backgroundColor: t.accentSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    badgeOk: { backgroundColor: t.successSoft },
    badgeOff: { backgroundColor: t.primarySoft },
    badgeText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: t.accent },

    soldVeil: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,13,0.6)', alignItems: 'center', justifyContent: 'center' },
    soldText: { fontSize: 12, fontWeight: '800', letterSpacing: 2, color: '#FFFFFF' },
  });
}
