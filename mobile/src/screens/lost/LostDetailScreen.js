import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, Linking } from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Chip, Loading } from '../../components/ui';
import { LostApi, imageUrl } from '../../api/lostfound';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, font, radius, layout } from '../../theme';
import AmbientGlow from '../../components/AmbientGlow';

export default function LostDetailScreen({ route, navigation }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const { id } = route.params;
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setItem(await LostApi.get(id));
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) return <Loading label="Loading…" />;
  if (!item)
    return (
      <SafeAreaView style={styles.safe}>
        <AmbientGlow />
        <Text style={[font.bodyMuted, { color: t.textMuted }, { padding: spacing.xl }]}>Item not found.</Text>
      </SafeAreaView>
    );

  const isOwner = String(item.createdBy?._id || item.createdBy) === String(user?._id);
  const isLost = item.type === 'lost';
  const uri = imageUrl(item.image);
  const owner = item.createdBy || {};

  async function toggleResolved() {
    try {
      const updated = await LostApi.setStatus(id, item.status === 'open' ? 'resolved' : 'open');
      setItem({ ...item, status: updated.status });
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  function onDelete() {
    Alert.alert('Delete post', 'This cannot be undone. Delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await LostApi.remove(id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  }

  async function toggleInterest() {
    setBusy(true);
    try {
      const res = await LostApi.interest(id);
      setItem((it) => ({ ...it, isInterested: res.isInterested, interestCount: res.interestCount }));
    } catch (e) {
      Alert.alert('Oops', e.message);
    } finally {
      setBusy(false);
    }
  }

  function contact() {
    const c = item.contact?.trim();
    if (!c) return;
    if (/^[+\d][\d\s-]{6,}$/.test(c)) Linking.openURL(`tel:${c.replace(/\s/g, '')}`).catch(() => {});
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imageEmpty]}>
            <Ionicons name="image-outline" size={44} color={t.textFaint} />
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.topRow}>
            <Chip label={isLost ? 'LOST' : 'FOUND'} tone={isLost ? 'danger' : 'success'} />
            <Chip label={item.status === 'open' ? 'Open' : 'Resolved'} tone={item.status === 'open' ? 'accent' : 'muted'} />
          </View>

          <Text style={styles.title}>{item.title}</Text>

          {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}

          <View style={styles.info}>
            {item.location ? <InfoRow styles={styles} t={t} icon="location-outline" label="Location" value={item.location} /> : null}
            <InfoRow styles={styles} t={t} icon="pricetag-outline" label="Category" value={item.category} />
            <InfoRow
              styles={styles}
              t={t}
              icon="hand-left-outline"
              label="Interested"
              value={`${item.interestCount || 0} ${item.interestCount === 1 ? 'person' : 'people'}`}
            />
            <InfoRow styles={styles} t={t}               icon="person-outline"
              label="Posted by"
              value={`${owner.name || 'Student'}${owner.branch ? ` · ${owner.branch}` : ''}`}
            />
            {item.contact ? <InfoRow styles={styles} t={t} icon="call-outline" label="Contact" value={item.contact} /> : null}
          </View>

          {isOwner ? (
            <View style={{ marginTop: spacing.lg }}>
              <Button
                title={item.status === 'open' ? 'Mark as resolved' : 'Reopen'}
                onPress={toggleResolved}
              />
              <Button title="Delete post" variant="danger" onPress={onDelete} style={{ marginTop: spacing.md }} />
            </View>
          ) : (
            <View style={{ marginTop: spacing.lg }}>
              <Button
                title={item.isInterested ? 'Interested ✓ — tap to withdraw' : "I'm interested"}
                variant={item.isInterested ? 'secondary' : 'primary'}
                onPress={toggleInterest}
                loading={busy}
              />
              {/* The number is only revealed once you have shown interest. */}
              {item.isInterested ? (
                item.contact ? (
                  <Button
                    title={`Call ${owner.name?.split(' ')[0] || 'poster'}`}
                    variant="secondary"
                    onPress={contact}
                    style={{ marginTop: spacing.md }}
                    icon={<Ionicons name="call" size={18} color={t.text} />}
                  />
                ) : (
                  <Text style={[font.bodyMuted, { color: t.textMuted }, { marginTop: spacing.md }]}>
                    The poster did not leave a number. They can see your interest.
                  </Text>
                )
              ) : (
                <Text style={[font.bodyMuted, { color: t.textMuted }, { marginTop: spacing.md }]}>
                  Tap interested to see how to reach the poster.
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, styles, t}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={t.primaryDark} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    container: { paddingBottom: layout.tabBarSpace },
    image: { width: '100%', height: 280, backgroundColor: t.surfaceAlt },
    imageEmpty: { alignItems: 'center', justifyContent: 'center' },
    body: { padding: spacing.xl },
    topRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    title: { ...font.h1, color: t.text, fontSize: 26 },
    desc: { ...font.body, color: t.text, lineHeight: 22, marginTop: spacing.sm },
    info: {
      marginTop: spacing.lg,
      backgroundColor: t.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: t.border,
      paddingHorizontal: spacing.lg,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    infoLabel: { ...font.small, color: t.textMuted, marginLeft: spacing.md, width: 82 },
    infoValue: { ...font.label, color: t.text, flex: 1, textAlign: 'right' },
    });
  }
