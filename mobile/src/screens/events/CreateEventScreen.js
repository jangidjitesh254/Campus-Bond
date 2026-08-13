import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '../../components/ui';
import { EventsApi, CATEGORIES } from '../../api/events';
import { colors, spacing, font, radius, layout } from '../../theme';

export default function CreateEventScreen({ navigation }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'hackathon',
    skillsNeeded: '',
    teamSize: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit() {
    setError('');
    if (!form.title.trim() || !form.description.trim()) {
      setError('Please add a title and description.');
      return;
    }
    setLoading(true);
    try {
      await EventsApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        skillsNeeded: form.skillsNeeded,
        teamSize: form.teamSize ? Number(form.teamSize) : 1,
      });
      navigation.goBack();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[font.bodyMuted, { marginBottom: spacing.lg }]}>
            Tell students what you're building and who you need.
          </Text>

          <Field
            label="Title"
            placeholder="Need 2 devs for Smart India Hackathon"
            value={form.title}
            onChangeText={set('title')}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.cats}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c.key} onPress={() => set('category')(c.key)} activeOpacity={0.8}>
                <View style={[styles.cat, form.category === c.key && styles.catActive]}>
                  <Text style={[styles.catText, form.category === c.key && styles.catTextActive]}>
                    {c.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Field
            label="Description"
            placeholder="What's the project? What will the team do?"
            value={form.description}
            onChangeText={set('description')}
            multiline
            numberOfLines={4}
            style={{ marginTop: spacing.lg }}
            inputStyle={{ height: 110, textAlignVertical: 'top', paddingTop: spacing.md }}
          />

          <Field
            label="Skills needed (comma separated)"
            placeholder="React Native, Node, UI/UX"
            value={form.skillsNeeded}
            onChangeText={set('skillsNeeded')}
          />

          <Field
            label="Teammates needed"
            placeholder="2"
            keyboardType="number-pad"
            value={form.teamSize}
            onChangeText={set('teamSize')}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Post request" onPress={onSubmit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl, paddingBottom: layout.tabBarSpace },
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
