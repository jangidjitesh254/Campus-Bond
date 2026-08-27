import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import { Button, Field } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { imageUrl } from '../api/market';
import { useTheme } from '../context/ThemeContext';
import { spacing, font, layout } from '../theme';

export default function EditProfileScreen({ navigation }) {
  const { t, kinds, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [branch, setBranch] = useState(user?.branch || '');
  const [semester, setSemester] = useState(user?.semester ? String(user.semester) : '');
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentAvatar = imageUrl(user?.avatar);

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow photo access to change your picture.');
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true, aspect: [1, 1], mediaTypes: ['images'] });
    if (!result.canceled && result.assets?.length) setAvatar(result.assets[0]);
  }

  async function onSave() {
    setError('');
    if (!name.trim()) return setError('Name is required.');
    setLoading(true);
    try {
      await updateProfile({ name: name.trim(), branch: branch.trim(), semester, avatar });
      navigation.goBack();
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} activeOpacity={0.85}>
            {avatar ? (
              <Image source={{ uri: avatar.uri }} style={styles.avatarImg} />
            ) : currentAvatar ? (
              <Image source={{ uri: currentAvatar }} style={styles.avatarImg} />
            ) : (
              <Avatar name={user?.name} size={100} />
            )}
            <View style={styles.camBadge}><Icon name="camera" size={16} color={t.onPrimary} strokeWidth={1.8} /></View>
          </TouchableOpacity>
          <Text style={styles.changeText}>Change photo</Text>

          <Field label="Name" placeholder="Your name" value={name} onChangeText={setName} />
          <Field label="Department / Branch" placeholder="CSE" autoCapitalize="characters" value={branch} onChangeText={setBranch} />
          <Field label="Semester" placeholder="5" keyboardType="number-pad" value={semester} onChangeText={setSemester} />

          <View style={styles.readonly}>
            <Text style={styles.roLabel}>Email</Text>
            <Text style={styles.roValue}>{user?.email}</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Save changes" onPress={onSave} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    container: { padding: spacing.xl, paddingBottom: layout.tabBarSpace },
    avatarWrap: { alignSelf: 'center', marginBottom: 6 },
    avatarImg: { width: 100, height: 100, borderRadius: 50, backgroundColor: t.surfaceMuted },
    camBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.bg },
    changeText: { ...font.small, color: t.textMuted, color: t.primary, fontWeight: '600', textAlign: 'center', marginBottom: spacing.xl },
    readonly: { marginBottom: spacing.lg },
    roLabel: { ...font.label, color: t.text, marginBottom: 6 },
    roValue: { fontSize: 15, color: t.textMuted, backgroundColor: t.surfaceMuted, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden' },
    error: { color: t.danger, marginBottom: spacing.md },
    });
  }
