import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Icon from '../../components/Icon';
import { Button, Field } from '../../components/ui';
import { ClubApi, CLUB_CATEGORIES } from '../../api/clubs';
import { colors, spacing, font, radius, layout } from '../../theme';

export default function CreateClubScreen({ navigation }) {
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.logoWrap} onPress={pickLogo} activeOpacity={0.85}>
            {image ? <Image source={{ uri: image.uri }} style={styles.logo} /> : (
              <View style={[styles.logo, styles.logoEmpty]}>
                <Icon name="image" size={26} color={colors.primary} strokeWidth={1.6} />
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
                  <Text style={[styles.pillText, { color: category === c.key ? colors.onPrimary : colors.primary }]}>{c.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Field label="About" placeholder="What's the club about?" value={form.description} onChangeText={set('description')}
            multiline inputStyle={{ height: 100, textAlignVertical: 'top', paddingTop: spacing.md }} style={{ marginTop: spacing.lg }} />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Create club" onPress={onSubmit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl, paddingBottom: layout.tabBarSpace },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xl, gap: 8 },
  logo: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  logoEmpty: { borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  logoText: { ...font.small, color: colors.primary, fontWeight: '600' },
  label: { ...font.label, marginBottom: spacing.sm },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  pill: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  pillActive: { backgroundColor: colors.primary },
  pillInactive: { backgroundColor: colors.surfaceAlt },
  pillText: { fontSize: 13, fontWeight: '600' },
  error: { color: colors.danger, marginBottom: spacing.md },
});
