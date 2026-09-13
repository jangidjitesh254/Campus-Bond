import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Icon from '../../components/Icon';
import { Button, Field } from '../../components/ui';
import { MarketApi, MARKET_CATEGORIES, CONDITIONS } from '../../api/market';
import { useTheme } from '../../context/ThemeContext';
import { useKeyboardHeight } from '../../hooks/useKeyboardOpen';
import { spacing, font, radius, layout } from '../../theme';
import AmbientGlow from '../../components/AmbientGlow';

export default function CreateSellScreen({ navigation }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const keyboardHeight = useKeyboardHeight();
  const [form, setForm] = useState({ title: '', price: '', description: '', location: '', contact: '' });
  const [category, setCategory] = useState('books');
  const [condition, setCondition] = useState('good');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function pickFrom(source) {
    const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', `Allow ${source} access to add a photo.`);
    const opts = { quality: 0.6, allowsEditing: true, aspect: [4, 3] };
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync({ ...opts, mediaTypes: ['images'] });
    if (!result.canceled && result.assets?.length) setImage(result.assets[0]);
  }
  function choosePhoto() {
    Alert.alert('Add a photo', 'A clear photo sells faster.', [
      { text: 'Take photo', onPress: () => pickFrom('camera') },
      { text: 'Choose from gallery', onPress: () => pickFrom('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function onSubmit() {
    setError('');
    if (!form.title.trim()) return setError('Please add a title.');
    if (!form.price || Number.isNaN(Number(form.price))) return setError('Please add a valid price.');
    setLoading(true);
    try {
      await MarketApi.create({ ...form, title: form.title.trim(), price: Number(form.price), category, condition, image });
      navigation.goBack();
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <AmbientGlow />
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <TouchableOpacity style={styles.photo} onPress={choosePhoto} activeOpacity={0.85}>
            {image ? <Image source={{ uri: image.uri }} style={styles.photoImg} /> : (
              <View style={styles.photoEmpty}>
                <Icon name="image" size={28} color={t.primary} strokeWidth={1.6} />
                <Text style={styles.photoText}>Add a photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <Field label="Title" placeholder="Engineering drawing kit" value={form.title} onChangeText={set('title')} />
          <Field label="Price (₹)" placeholder="350" keyboardType="number-pad" value={form.price} onChangeText={set('price')} />

          <Text style={styles.label}>Category</Text>
          <View style={styles.pills}>
            {MARKET_CATEGORIES.map((c) => (
              <Pill styles={styles} t={t} key={c.key} active={category === c.key} onPress={() => setCategory(c.key)} label={c.label} />
            ))}
          </View>

          <Text style={styles.label}>Condition</Text>
          <View style={styles.pills}>
            {CONDITIONS.map((c) => (
              <Pill styles={styles} t={t} key={c.key} active={condition === c.key} onPress={() => setCondition(c.key)} label={c.label} />
            ))}
          </View>

          <Field label="Description" placeholder="Details, what's included…" value={form.description} onChangeText={set('description')}
            multiline inputStyle={{ height: 90, textAlignVertical: 'top', paddingTop: spacing.md }} style={{ marginTop: spacing.lg }} />
          <Field label="Contact (optional)" placeholder="Phone or social handle" value={form.contact} onChangeText={set('contact')} />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="List item" onPress={onSubmit} loading={loading} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Pill({ active, onPress, label, styles, t}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}>
        <Text style={[styles.pillText, { color: active ? t.onPrimary : t.primary }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    container: { padding: spacing.xl, paddingBottom: layout.tabBarSpace },
    photo: { height: 170, borderRadius: radius.lg, borderWidth: 1.5, borderColor: t.border, borderStyle: 'dashed', backgroundColor: t.surface, overflow: 'hidden', marginBottom: spacing.lg },
    photoImg: { width: '100%', height: '100%' },
    photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
    photoText: { ...font.label, color: t.text, color: t.primary },
    label: { ...font.label, color: t.text, marginBottom: spacing.sm },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
    pill: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    pillActive: { backgroundColor: t.primary },
    pillInactive: { backgroundColor: t.surfaceAlt },
    pillText: { fontSize: 13, fontWeight: '600' },
    error: { color: t.danger, marginBottom: spacing.md },
    });
  }
