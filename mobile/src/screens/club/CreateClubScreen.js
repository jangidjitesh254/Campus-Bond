import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Icon from '../../components/Icon';
import { Button, Field } from '../../components/ui';
import { ClubApi, CLUB_CATEGORIES } from '../../api/clubs';
import { useTheme } from '../../context/ThemeContext';
import { useKeyboardHeight } from '../../hooks/useKeyboardOpen';
import { spacing, font, layout } from '../../theme';
import AmbientGlow from '../../components/AmbientGlow';

export default function CreateClubScreen({ navigation }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const keyboardHeight = useKeyboardHeight();
  const [form, setForm] = useState({ name: '', description: '' });
  const [category, setCategory] = useState('tech');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function pickLogo() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow photo access to add a logo.');
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true, aspect: [1, 1], mediaTypes: ['images'] });
    if (!result.canceled && result.assets?.length) setImage(result.assets[0]);
  }

  async function onSubmit() {
    setError('');
    if (!form.name.trim()) return setError('Please add a club name.');
    setLoading(true);
    try { await ClubApi.create({ ...form, name: form.name.trim(), category, image }); navigation.goBack(); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <AmbientGlow />
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <TouchableOpacity style={styles.logoWrap} onPress={pickLogo} activeOpacity={0.85}>
            {image ? <Image source={{ uri: image.uri }} style={styles.logo} /> : (
              <View style={[styles.logo, styles.logoEmpty]}>
                <Icon name="image" size={26} color={t.primary} strokeWidth={1.6} />
              </View>
            )}
            <Text style={styles.logoText}>Add a logo</Text>
          </TouchableOpacity>

          <Field label="Club name" placeholder="Coding Club" value={form.name} onChangeText={set('name')} />

          <Text style={styles.label}>Category</Text>
          <View style={styles.pills}>
            {CLUB_CATEGORIES.map((c) => (
              <TouchableOpacity key={c.key} onPress={() => setCategory(c.key)} activeOpacity={0.8}>
                <View style={[styles.pill, category === c.key ? styles.pillActive : styles.pillInactive]}>
                  <Text style={[styles.pillText, { color: category === c.key ? t.onPrimary : t.primary }]}>{c.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Field label="About" placeholder="What's the club about?" value={form.description} onChangeText={set('description')}
            multiline inputStyle={{ height: 100, textAlignVertical: 'top', paddingTop: spacing.md }} style={{ marginTop: spacing.lg }} />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Create club" onPress={onSubmit} loading={loading} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    container: { padding: spacing.xl, paddingBottom: layout.tabBarSpace },
    logoWrap: { alignItems: 'center', marginBottom: spacing.xl, gap: 8 },
    logo: { width: 90, height: 90, borderRadius: 45, backgroundColor: t.surface, borderWidth: 1.5, borderColor: t.border },
    logoEmpty: { borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
    logoText: { ...font.small, color: t.textMuted, color: t.primary, fontWeight: '600' },
    label: { ...font.label, color: t.text, marginBottom: spacing.sm },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
    pill: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    pillActive: { backgroundColor: t.primary },
    pillInactive: { backgroundColor: t.surfaceAlt },
    pillText: { fontSize: 13, fontWeight: '600' },
    error: { color: t.danger, marginBottom: spacing.md },
    });
  }
