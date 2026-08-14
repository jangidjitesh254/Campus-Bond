import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Button, Field } from '../../components/ui';
import { LostApi, LOST_CATEGORIES } from '../../api/lostfound';
import { colors, spacing, font, radius, layout } from '../../theme';

export default function CreateLostScreen({ navigation }) {
  const [type, setType] = useState('lost');
  const [form, setForm] = useState({ title: '', description: '', category: 'other', location: '', contact: '' });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  async function pickFrom(source) {
    try {
      const perm =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', `Please allow ${source} access to add a photo.`);
        return;
      }
      const opts = { quality: 0.6, allowsEditing: true, aspect: [4, 3] };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync({ ...opts, mediaTypes: ['images'] });

      if (!result.canceled && result.assets?.length) setImage(result.assets[0]);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  function choosePhoto() {
    Alert.alert('Add a photo', 'A clear photo helps others recognize the item.', [
      { text: 'Take photo', onPress: () => pickFrom('camera') },
      { text: 'Choose from gallery', onPress: () => pickFrom('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function onSubmit() {
    setError('');
    if (!form.title.trim()) {
      setError('Please add a short title.');
      return;
    }
    setLoading(true);
    try {
      await LostApi.create({ type, ...form, title: form.title.trim(), image });
      navigation.goBack();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Lost / Found toggle */}
          <View style={styles.toggle}>
            {['lost', 'found'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.toggleBtn, type === t && (t === 'lost' ? styles.toggleLost : styles.toggleFound)]}
                onPress={() => setType(t)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={t === 'lost' ? 'help-buoy-outline' : 'checkmark-circle-outline'}
                  size={18}
                  color={type === t ? '#fff' : colors.textMuted}
                />
                <Text style={[styles.toggleText, type === t && { color: '#fff' }]}>
                  I {t} this
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Photo picker */}
          <TouchableOpacity style={styles.photo} onPress={choosePhoto} activeOpacity={0.85}>
            {image ? (
              <>
                <Image source={{ uri: image.uri }} style={styles.photoImg} />
                <View style={styles.photoEdit}>
                  <Ionicons name="camera" size={16} color="#fff" />
                  <Text style={styles.photoEditText}>Change photo</Text>
                </View>
              </>
            ) : (
              <View style={styles.photoEmpty}>
                <Ionicons name="camera-outline" size={30} color={colors.primaryDark} />
                <Text style={styles.photoEmptyText}>Add a photo</Text>
                <Text style={styles.photoHint}>Camera or gallery · optional</Text>
              </View>
            )}
          </TouchableOpacity>

          <Field
            label="Title"
            placeholder={type === 'lost' ? 'Lost black wallet near library' : 'Found a set of keys'}
            value={form.title}
            onChangeText={set('title')}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.cats}>
            {LOST_CATEGORIES.map((c) => (
              <TouchableOpacity key={c.key} onPress={() => set('category')(c.key)} activeOpacity={0.8}>
                <View style={[styles.cat, form.category === c.key && styles.catActive]}>
                  <Text style={[styles.catText, form.category === c.key && styles.catTextActive]}>{c.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Field
            label="Description"
            placeholder="Colour, brand, any identifying marks…"
            value={form.description}
            onChangeText={set('description')}
            multiline
            inputStyle={{ height: 90, textAlignVertical: 'top', paddingTop: spacing.md }}
            style={{ marginTop: spacing.lg }}
          />
          <Field label="Location" placeholder="Where on campus?" value={form.location} onChangeText={set('location')} />
          <Field
            label="Contact (optional)"
            placeholder="Phone or social handle"
            value={form.contact}
            onChangeText={set('contact')}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Post item" onPress={onSubmit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl, paddingBottom: layout.tabBarSpace },
  toggle: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 4, marginBottom: spacing.lg },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radius.sm,
    gap: 6,
  },
  toggleLost: { backgroundColor: colors.danger },
  toggleFound: { backgroundColor: colors.success },
  toggleText: { fontWeight: '800', color: colors.textMuted, fontSize: 14 },
  photo: {
    height: 180,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  photoImg: { width: '100%', height: '100%' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoEmptyText: { ...font.label, color: colors.primaryDark, marginTop: spacing.sm },
  photoHint: { ...font.small, marginTop: 2 },
  photoEdit: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22,36,27,0.8)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    gap: 5,
  },
  photoEditText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  label: { ...font.label, marginBottom: spacing.sm },
  cats: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  cat: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  catActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  catTextActive: { color: colors.onPrimary },
  error: { color: colors.danger, marginBottom: spacing.md },
});
