import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from './Icon';
import { handleOf } from './ThreadPost';
import { imageUrl } from '../api/market';
import { useTheme } from '../context/ThemeContext';
import { monoFamily } from '../theme';

const CONDITION = { new: 'NEW', 'like-new': 'LIKE NEW', good: 'GOOD', fair: 'FAIR' };

export const CARD_WIDTH = 168;

/** The buy pill mirrors the "ADD" affordance on shopping cards. */
function buyState(item) {
  if (item.status === 'sold') return { label: 'SOLD', muted: true };
  if (item.myInterest === 'accepted') return { label: 'CHAT', filled: true };
  if (item.myInterest === 'pending') return { label: 'SENT', muted: true };
  if (item.myInterest === 'rejected') return { label: 'CLOSED', muted: true };
  return { label: 'BUY' };
}

/**
 * Campus Market listing card, in the shopping-app pattern: product photo with
 * a buy pill straddling its lower edge, then price, title and seller.
 * `wide` gives the full-width row used by list screens.
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
        <Icon name="tag" size={wide ? 22 : 28} color={t.mediaStroke} strokeWidth={1.5} />
      )}
      {sold ? (
        <View style={styles.soldVeil}>
          <Text style={styles.soldText}>SOLD</Text>
        </View>
      ) : null}
      {onLike ? (
        <TouchableOpacity style={styles.likeBtn} onPress={onLike} hitSlop={8} activeOpacity={0.8}>
          <Icon name="heart" size={14} color={item.isLiked ? t.like : t.textMuted} filled={item.isLiked} strokeWidth={1.8} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (wide) {
    return (
      <TouchableOpacity style={styles.wideCard} activeOpacity={0.96} onPress={onPress}>
        {photo}
        <View style={styles.wideBody}>
          {badge ? (
            <View style={[styles.badge, badge.tone === 'ok' && styles.badgeOk, badge.tone === 'off' && styles.badgeOff]}>
              <Text
                style={[
                  styles.badgeText,
                  badge.tone === 'ok' && { color: t.success },
                  badge.tone === 'off' && { color: t.textMuted },
                ]}
              >
                {badge.label}
              </Text>
            </View>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.price}</Text>
            <View style={styles.cond}><Text style={styles.condText}>{condition}</Text></View>
          </View>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.seller} numberOfLines={1}>by {handleOf(seller.name)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.96} onPress={onPress}>
      {photo}

      {/* straddles the photo's lower edge, like the shopping-card ADD button */}
      {onBuy ? (
        <TouchableOpacity
          style={[styles.buy, buy.filled && styles.buyFilled, buy.muted && styles.buyMuted]}
          onPress={buy.label === 'BUY' ? onBuy : onPress}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.buyText,
              buy.filled && { color: t.onPrimary },
              buy.muted && { color: t.textMuted },
            ]}
          >
            {buy.label}
          </Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.body}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.price}</Text>
          <View style={styles.cond}><Text style={styles.condText}>{condition}</Text></View>
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.footRow}>
          <Text style={styles.seller} numberOfLines={1}>by {handleOf(seller.name)}</Text>
          {item.likeCount ? (
            <View style={styles.likes}>
              <Icon name="heart" size={11} color={t.textMuted} filled strokeWidth={1.6} />
              <Text style={styles.likesText}>{item.likeCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(t, isDark) {
  const surface = {
    backgroundColor: t.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: t.borderSoft,
    shadowColor: '#171B1D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0 : 0.04,
    shadowRadius: 14,
    elevation: isDark ? 0 : 1,
  };
  return StyleSheet.create({
    // no overflow:hidden — the buy pill has to break the photo's edge
    card: { ...surface, width: CARD_WIDTH },
    img: {
      width: CARD_WIDTH - 2,
      height: 150,
      backgroundColor: t.field,
      borderTopLeftRadius: 13,
      borderTopRightRadius: 13,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    imgFill: { width: '100%', height: '100%' },

    buy: {
      position: 'absolute',
      right: 10,
      top: 150 - 14,
      minWidth: 62,
      alignItems: 'center',
      backgroundColor: t.surface,
      borderWidth: 1.4,
      borderColor: t.accent,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    buyFilled: { backgroundColor: t.primary, borderColor: t.primary },
    buyMuted: { backgroundColor: t.field, borderColor: t.borderSoft },
    buyText: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.4, color: t.accent },

    body: { paddingHorizontal: 11, paddingTop: 18, paddingBottom: 11, gap: 5 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    price: { fontSize: 16, fontWeight: '800', letterSpacing: -0.4, color: t.text },
    cond: { backgroundColor: t.field, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 },
    condText: { fontFamily: monoFamily, fontSize: 8.5, fontWeight: '700', letterSpacing: 0.5, color: t.textMuted },
    title: { fontSize: 13, lineHeight: 17.5, fontWeight: '600', letterSpacing: -0.2, color: t.text },
    footRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    seller: { flex: 1, fontSize: 11.5, color: t.textMuted },
    likes: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    likesText: { fontSize: 11, color: t.textMuted, fontWeight: '500' },

    wideCard: { ...surface, flexDirection: 'row', overflow: 'hidden', marginHorizontal: 18, marginBottom: 12 },
    wideImg: { width: 104, height: 116, backgroundColor: t.field, alignItems: 'center', justifyContent: 'center' },
    wideBody: { flex: 1, minWidth: 0, paddingHorizontal: 13, paddingVertical: 12, gap: 5, justifyContent: 'center' },
    badge: { alignSelf: 'flex-start', backgroundColor: t.accentSoft, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
    badgeOk: { backgroundColor: t.successSoft },
    badgeOff: { backgroundColor: t.field },
    badgeText: { fontFamily: monoFamily, fontSize: 8.5, fontWeight: '700', letterSpacing: 0.5, color: t.accent },

    soldVeil: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(23,27,29,0.55)', alignItems: 'center', justifyContent: 'center' },
    soldText: { fontFamily: monoFamily, fontSize: 12, fontWeight: '700', letterSpacing: 2, color: '#fff' },
    likeBtn: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: t.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
