import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../../components/Icon';
import { Button, Loading } from '../../components/ui';
import { handleOf } from '../../components/ThreadPost';
import { MarketApi, imageUrl } from '../../api/market';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, font, radius, layout } from '../../theme';

const CONDITION = { new: 'New', 'like-new': 'Like new', good: 'Good', fair: 'Fair' };
const CAT = { books: 'Books', notes: 'Notes', kit: 'Drawing Kit', electronics: 'Electronics', instruments: 'Instruments', furniture: 'Furniture', other: 'Other' };

export default function SellDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setItem(await MarketApi.get(id)); } catch (e) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Loading />;
  if (!item) return <SafeAreaView style={styles.safe}><Text style={[font.bodyMuted, { padding: 24 }]}>Not found.</Text></SafeAreaView>;

  const seller = item.seller || {};
  const isOwner = String(seller._id || item.seller) === String(user?._id);
  const uri = imageUrl(item.image);

  function contact() {
    const c = item.contact?.trim();
    if (c && /^[+\d][\d\s-]{6,}$/.test(c)) Linking.openURL(`tel:${c.replace(/\s/g, '')}`).catch(() => {});
    else Alert.alert('Contact', c || 'No contact provided by the seller.');
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

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: layout.tabBarSpace }}>
        {uri ? <Image source={{ uri }} style={styles.image} resizeMode="cover" /> : <View style={[styles.image, styles.imgEmpty]}><Icon name="tag" size={44} color={colors.mediaStroke} strokeWidth={1.4} /></View>}

        <View style={styles.body}>
          <Text style={styles.price}>₹{item.price}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.tags}>
            <View style={styles.tag}><Text style={styles.tagText}>{CONDITION[item.condition] || 'Good'}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>{CAT[item.category] || 'Other'}</Text></View>
            {item.status === 'sold' ? <View style={[styles.tag, { backgroundColor: colors.dangerSoft }]}><Text style={[styles.tagText, { color: colors.danger }]}>SOLD</Text></View> : null}
          </View>

          {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}

          <View style={styles.sellerRow}>
            <Icon name="user" size={18} color={colors.primary} strokeWidth={1.7} />
            <Text style={styles.seller}>Sold by {handleOf(seller.name)}{seller.branch ? ` · ${seller.branch}` : ''}</Text>
          </View>

          {isOwner ? (
            <View style={{ marginTop: spacing.lg }}>
              <Button title={item.status === 'available' ? 'Mark as sold' : 'Relist'} onPress={toggleSold} />
              <Button title="Delete listing" variant="danger" onPress={onDelete} style={{ marginTop: spacing.md }} />
            </View>
          ) : (
            <Button
              title="Contact seller"
              onPress={contact}
              style={{ marginTop: spacing.lg }}
              icon={<Icon name="chat" size={18} color={colors.onPrimary} strokeWidth={1.8} />}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  image: { width: '100%', height: 300, backgroundColor: colors.surfaceMuted },
  imgEmpty: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.xl },
  price: { fontSize: 26, fontWeight: '900', color: colors.primary },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 4 },
  tags: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tag: { backgroundColor: colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { fontSize: 12.5, fontWeight: '600', color: colors.primary },
  desc: { ...font.body, lineHeight: 22, marginTop: 16 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  seller: { fontSize: 14, color: colors.textMuted },
});
