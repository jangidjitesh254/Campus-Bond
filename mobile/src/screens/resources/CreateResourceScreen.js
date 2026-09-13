import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Button, Field } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useKeyboardHeight } from '../../hooks/useKeyboardOpen';
import { ResourcesApi, RESOURCE_KINDS, formatSize } from '../../api/resources';
import { spacing, layout, monoFamily } from '../../theme';
import AmbientGlow from '../../components/AmbientGlow';

const ACCEPT = [
  'application/pdf',
  'image/*',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

export default function CreateResourceScreen({ navigation, route }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const keyboardHeight = useKeyboardHeight();
  const { user, refreshUser } = useAuth();

  const [file, setFile] = useState(null);
  const [kind, setKind] = useState(route.params?.kind || 'pyq');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [branch, setBranch] = useState(user?.branch || '');
  const [semester, setSemester] = useState(user?.semester ? String(user.semester) : '');
  const [year, setYear] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: ACCEPT, copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > 20 * 1024 * 1024) {
      return Alert.alert('Too large', 'Files must be under 20 MB.');
    }
    setFile(asset);
    // A sensible default title from the file name, editable.
    if (!title.trim()) setTitle((asset.name || '').replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim());
  }

  async function onSubmit() {
    setError('');
    if (!file) return setError('Choose the file you want to share.');
    if (!title.trim()) return setError('Give it a title.');
    if (!subject.trim()) return setError('Which subject is this for?');
    setLoading(true);
    try {
      await ResourcesApi.create({
        title: title.trim(),
        subject: subject.trim(),
        kind,
        branch: branch.trim(),
        semester,
        year: kind === 'pyq' ? year : '',
        description: description.trim(),
        file,
      });
      refreshUser().catch(() => {});
      Alert.alert('Shared', 'Thanks — that is +15 Campus Score.', [{ text: 'Done', onPress: () => navigation.goBack() }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <AmbientGlow />
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          {/* File picker */}
          <TouchableOpacity style={[styles.drop, file && styles.dropOn]} onPress={pickFile} activeOpacity={0.85}>
            <View style={styles.dropIcon}>
              <Ionicons name={file ? 'document-attach' : 'cloud-upload-outline'} size={24} color={file ? t.onPrimary : t.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.dropTitle} numberOfLines={1}>{file ? file.name : 'Choose a file'}</Text>
              <Text style={styles.dropSub} numberOfLines={1}>
                {file ? `${formatSize(file.size)} · tap to change` : 'PDF, Word, PowerPoint, text or a photo · up to 20 MB'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Kind */}
          <Text style={styles.label}>What is it?</Text>
          <View style={styles.kinds}>
            {RESOURCE_KINDS.map((k) => {
              const on = kind === k.key;
              return (
                <TouchableOpacity key={k.key} style={[styles.kind, on && styles.kindOn]} onPress={() => setKind(k.key)} activeOpacity={0.85}>
                  <Text style={[styles.kindText, on && styles.kindTextOn]}>{k.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Field label="Title" placeholder="e.g. DBMS end-sem paper" value={title} onChangeText={setTitle} />
          <Field label="Subject" placeholder="e.g. Database Management Systems" value={subject} onChangeText={setSubject} />

          <View style={styles.row}>
            <Field label="Branch" placeholder="CSE" autoCapitalize="characters" value={branch} onChangeText={setBranch} style={{ flex: 1 }} />
            <Field label="Semester" placeholder="5" keyboardType="number-pad" value={semester} onChangeText={setSemester} style={{ flex: 1 }} />
            {kind === 'pyq' ? (
              <Field label="Year" placeholder="2024" keyboardType="number-pad" value={year} onChangeText={setYear} style={{ flex: 1 }} />
            ) : null}
          </View>

          <Field
            label="Notes for others (optional)"
            placeholder="Which units it covers, who the professor was…"
            value={description}
            onChangeText={setDescription}
            multiline
            inputStyle={{ minHeight: 90, paddingTop: 12, textAlignVertical: 'top' }}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Share with campus" onPress={onSubmit} loading={loading} />
          <Text style={styles.hint}>SHARED FILES ARE VISIBLE TO EVERY VGU STUDENT</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    container: { padding: spacing.xl, paddingBottom: layout.tabBarSpace },
    drop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: t.borderSoft,
      backgroundColor: t.surface,
      marginBottom: spacing.xl,
    },
    dropOn: { borderStyle: 'solid', borderColor: t.primary },
    dropIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: t.primarySoft, alignItems: 'center', justifyContent: 'center' },
    dropTitle: { fontSize: 15, fontWeight: '700', color: t.text },
    dropSub: { fontSize: 12.5, color: t.textMuted, marginTop: 3 },
    label: { fontSize: 12.5, fontWeight: '600', color: t.text, marginBottom: 8 },
    kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    kind: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.borderSoft },
    kindOn: { backgroundColor: t.primary, borderColor: t.primary },
    kindText: { fontSize: 12.5, fontWeight: '600', color: t.textMuted },
    kindTextOn: { color: t.onPrimary },
    row: { flexDirection: 'row', gap: 10 },
    error: { color: t.danger, marginBottom: spacing.md },
    hint: { fontFamily: monoFamily, fontSize: 9, letterSpacing: 1, color: t.textFaint, textAlign: 'center', marginTop: 14 },
  });
}
