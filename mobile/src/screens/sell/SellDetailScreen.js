import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, Share, TouchableOpacity } from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from '../../components/Avatar';
import Icon from '../../components/Icon';
import { Button, Loading } from '../../components/ui';
import { handleOf, timeAgo } from '../../components/ThreadPost';
import { MarketApi, imageUrl } from '../../api/market';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, font, layout } from '../../theme';
import AmbientGlow from '../../components/AmbientGlow';

const CONDITION = { new: 'New', 'like-new': 'Like new', good: 'Good', fair: 'Fair' };
const CAT = { books: 'Books', notes: 'Notes', kit: 'Drawing Kit', electronics: 'Electronics', instruments: 'Instruments', furniture: 'Furniture', other: 'Other' };

export default function SellDetailScreen({ route, navigation }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const { id } = route.params;
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setItem(await MarketApi.get(id)); } catch (e) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Loading />;
  if (!item) return <SafeAreaView style={styles.safe}><Text style={[font.bodyMuted, { color: t.textMuted }, { padding: 24 }]}>Not found.</Text></SafeAreaView>;

  const seller = item.seller || {};
  const isOwner = String(seller._id || item.seller) === String(user?._id);
  const uri = imageUrl(item.image);

  function openChatWith(otherId, name) {
    MarketApi.openChat(id, otherId)
      .then((c) => navigation.getParent()?.navigate('Post', { screen: 'Chat', params: { conversationId: c._id, title: name } }))
      .catch((e) => Alert.alert('Cannot open chat', e.message));
  }

  async function onInterest() {
    setBusy(true);
    try { await MarketApi.interest(id); await load(); Alert.alert('Interest sent', 'The seller will review your request. You can chat once they accept.'); }
    catch (e) { Alert.alert('Oops', e.message); } finally { setBusy(false); }
  }
  function onReview(userId, status) {
    MarketApi.reviewInterest(id, userId, status).then((res) => { setItem(res.item); if (status === 'accepted' && res.conversationId) { /* seller can message from the row */ } }).catch((e) => Alert.alert('Error', e.message));
  }
  async function onLike() {
    try { const res = await MarketApi.like(id); setItem((it) => ({ ...it, isLiked: res.isLiked, likeCount: res.likeCount })); } catch {}
  }
  async function onShare() {
    try { await Share.share({ message: `${item.title} — ₹${item.price}\n\nOn the Campus Bond marketplace.` }); } catch {}
  }
  function toggleSold() {
    MarketApi.setStatus(id, item.status === 'available' ? 'sold' : 'available').then((u) => setItem({ ...item, status: u.status })).catch((e) => Alert.alert('Error', e.message));
  }
  function onDelete() {
    Alert.alert('Delete listing', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => MarketApi.remove(id).then(() => navigation.goBack()).catch((e) => Alert.alert('Error', e.message)) },
    ]);
  }

  const interested = item.interested || [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <AmbientGlow />
      <ScrollView contentContainerStyle={{ paddingBottom: layout.tabBarSpace }}>
        {uri ? (
          <Image source={{ uri }} style={styles.hero} resizeMode="cover" />
        ) : (
          <View style={[styles.hero, styles.heroEmpty]}>
            <Icon name="tag" size={40} color={t.mediaStroke} strokeWidth={1.4} />
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.price}</Text>
            <View style={styles.social}>
              <TouchableOpacity style={styles.socialBtn} onPress={onLike}>
                <Icon name="heart" size={20} color={item.isLiked ? t.like : t.textMuted} filled={item.isLiked} strokeWidth={1.7} />
                {item.likeCount ? <Text style={[styles.socialCount, item.isLiked && { color: t.like }]}>{item.likeCount}</Text> : null}
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={onShare}>
                <Icon name="repost" size={20} color={t.textMuted} strokeWidth={1.7} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.tags}>
            <View style={styles.tag}><Text style={styles.tagText}>{CONDITION[item.condition] || 'Good'}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>{CAT[item.category] || 'Other'}</Text></View>
            {item.status === 'sold' ? <View style={[styles.tag, { backgroundColor: t.dangerSoft }]}><Text style={[styles.tagText, { color: t.danger }]}>SOLD</Text></View> : null}
          </View>

          {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}

          <View style={styles.sellerRow}>
            <Avatar name={seller.name} size={38} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.sellerName}>{handleOf(seller.name)}</Text>
              <Text style={styles.sellerSub}>{seller.branch || 'Student'} · listed {timeAgo(item.createdAt)}</Text>
            </View>
          </View>

          {/* ---- Owner: interested buyers ---- */}
          {isOwner ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interested buyers ({interested.length})</Text>
              {interested.length === 0 ? (
                <Text style={[font.bodyMuted, { color: t.textMuted }, { color: t.textMuted }]}>No one has shown interest yet.</Text>
              ) : (
                interested.map((b) => {
                  const u = b.user || {};
                  const accepted = b.status === 'accepted';
                  return (
                    <View key={b._id} style={styles.buyer}>
                      <Avatar name={u.name} size={36} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.buyerName}>{handleOf(u.name)}</Text>
                        {b.message ? <Text style={styles.buyerMsg}>“{b.message}”</Text> : null}
                        <View style={styles.buyerBtns}>
                          {accepted ? (
                            <TouchableOpacity style={styles.msgPill} onPress={() => openChatWith(u._id, u.name)}>
                              <Icon name="chat" size={14} color={t.primary} strokeWidth={1.8} />
                              <Text style={styles.msgText}>Message</Text>
                            </TouchableOpacity>
                          ) : b.status === 'rejected' ? (
                            <Text style={styles.rejected}>Declined</Text>
                          ) : (
                            <>
                              <TouchableOpacity style={styles.acceptPill} onPress={() => onReview(u._id, 'accepted')}>
                                <Text style={styles.acceptText}>Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.declinePill} onPress={() => onReview(u._id, 'rejected')}>
                                <Text style={styles.declineText}>Decline</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
              <Button title={item.status === 'available' ? 'Mark as sold' : 'Relist'} variant="secondary" onPress={toggleSold} style={{ marginTop: spacing.lg }} />
              <Button title="Delete listing" variant="danger" onPress={onDelete} style={{ marginTop: spacing.md }} />
            </View>
          ) : item.myInterest === 'accepted' ? (
            <Button title="Message seller" onPress={() => openChatWith(seller._id, seller.name)} style={{ marginTop: spacing.xl }} icon={<Icon name="chat" size={18} color={t.onPrimary} strokeWidth={1.8} />} />
          ) : item.myInterest === 'pending' ? (
            <View style={[styles.cta, styles.ctaMuted]}><Icon name="check" size={18} color={t.primary} strokeWidth={2} /><Text style={[styles.ctaText, { color: t.primary }]}>Interest sent — waiting for seller</Text></View>
          ) : item.myInterest === 'rejected' ? (
            <View style={[styles.cta, styles.ctaMuted]}><Text style={[styles.ctaText, { color: t.textMuted }]}>Not selected</Text></View>
          ) : item.status === 'sold' ? (
            <View style={[styles.cta, styles.ctaMuted]}><Text style={[styles.ctaText, { color: t.textMuted }]}>This item is sold</Text></View>
          ) : (
            <Button title="I'm interested — request to buy" onPress={onInterest} loading={busy} style={{ marginTop: spacing.xl }} icon={<Icon name="bag" size={18} color={t.onPrimary} strokeWidth={1.8} />} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    hero: { width: '100%', height: 260, backgroundColor: t.field },
    heroEmpty: { alignItems: 'center', justifyContent: 'center' },
    body: { padding: spacing.xl },
    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    price: { fontSize: 26, fontWeight: '900', color: t.primary },
    social: { flexDirection: 'row', gap: 16 },
    socialBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    socialCount: { fontSize: 14, color: t.textMuted, fontWeight: '600' },
    title: { fontSize: 20, fontWeight: '700', color: t.text, marginTop: 6 },
    tags: { flexDirection: 'row', gap: 8, marginTop: 12 },
    tag: { backgroundColor: t.surfaceAlt, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
    tagText: { fontSize: 12.5, fontWeight: '600', color: t.primary },
    desc: { ...font.body, color: t.text, lineHeight: 22, marginTop: 16 },
    sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
    sellerName: { fontSize: 15, fontWeight: '700', color: t.text },
    sellerSub: { fontSize: 12.5, color: t.textMuted, marginTop: 1 },
    section: { marginTop: 20, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 16, gap: 12 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: t.text },
    buyer: { flexDirection: 'row', gap: 12 },
    buyerName: { fontSize: 14.5, fontWeight: '600', color: t.text },
    buyerMsg: { fontSize: 13, color: t.textMuted, fontStyle: 'italic', marginTop: 2 },
    buyerBtns: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
    acceptPill: { backgroundColor: t.primary, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
    acceptText: { color: t.onPrimary, fontSize: 13, fontWeight: '700' },
    declinePill: { borderWidth: 1, borderColor: t.border, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
    declineText: { color: t.textMuted, fontSize: 13, fontWeight: '600' },
    rejected: { fontSize: 13, color: t.textFaint, fontWeight: '600' },
    msgPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.primarySoft, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
    msgText: { color: t.primary, fontSize: 13, fontWeight: '700' },
    cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 15, marginTop: spacing.xl },
    ctaMuted: { backgroundColor: t.surfaceMuted },
    ctaText: { fontSize: 15, fontWeight: '700' },
    });
  }
