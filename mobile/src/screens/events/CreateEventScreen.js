import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, Loading } from '../../components/ui';
import { EventsApi, CATEGORIES } from '../../api/events';
import { useTheme } from '../../context/ThemeContext';
import { useKeyboardHeight } from '../../hooks/useKeyboardOpen';
import { spacing, font, radius, layout } from '../../theme';
import AmbientGlow from '../../components/AmbientGlow';

/**
 * Turn the date + time boxes into a deadline.
 * Date accepts "25 May 2025" or "2025-05-25"; time accepts "18:00" or "6:00 pm".
 * An empty date means no deadline at all.
 */
function parseDeadline(dateStr, timeStr) {
  const date = (dateStr || '').trim();
  const time = (timeStr || '').trim();
  if (!date) return { ok: true, value: null };

  const when = new Date(date);
  if (isNaN(when.getTime())) return { ok: false, field: 'date' };

  if (time) {
    const m = time.match(/^(\d{1,2})[:.](\d{2})\s*(am|pm)?$/i);
    if (!m) return { ok: false, field: 'time' };
    let hours = Number(m[1]);
    const mins = Number(m[2]);
    const suffix = (m[3] || '').toLowerCase();
    if (suffix === 'pm' && hours < 12) hours += 12;
    if (suffix === 'am' && hours === 12) hours = 0;
    if (hours > 23 || mins > 59) return { ok: false, field: 'time' };
    when.setHours(hours, mins, 0, 0);
  } else {
    when.setHours(0, 0, 0, 0); // a bare date reads as "that day", no clock shown
  }
  return { ok: true, value: when };
}

/** Split a stored deadline back into the two text boxes. */
function splitDeadline(value) {
  if (!value) return { date: '', time: '' };
  const d = new Date(value);
  if (isNaN(d.getTime())) return { date: '', time: '' };
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const bare = d.getHours() === 0 && d.getMinutes() === 0;
  const time = bare ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { date, time };
}

export default function CreateEventScreen({ navigation, route }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const keyboardHeight = useKeyboardHeight();

  // `id` turns this into an edit screen; `category` preselects a kind when the
  // compose menu sends us here.
  const editId = route.params?.id;
  const preset = route.params?.category;

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: preset || 'hackathon',
    skillsNeeded: '',
    teamSize: '',
    date: '',
    time: '',
    venue: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);
  const [error, setError] = useState('');

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    navigation.setOptions({ title: editId ? 'Edit post' : 'New post' });
  }, [navigation, editId]);

  // Prefill when editing.
  useEffect(() => {
    if (!editId) return;
    let active = true;
    EventsApi.get(editId)
      .then((e) => {
        if (!active) return;
        const { date, time } = splitDeadline(e.deadline);
        setForm({
          title: e.title || '',
          description: e.description || '',
          category: e.category || 'hackathon',
          skillsNeeded: (e.skillsNeeded || []).join(', '),
          teamSize: e.teamSize ? String(e.teamSize) : '',
          date,
          time,
          venue: e.venue || '',
        });
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setFetching(false));
    return () => {
      active = false;
    };
  }, [editId]);

  async function onSubmit() {
    setError('');
    if (!form.title.trim() || !form.description.trim()) {
      setError('Please add a title and description.');
      return;
    }

    const deadline = parseDeadline(form.date, form.time);
    if (!deadline.ok) {
      setError(
        deadline.field === 'time'
          ? 'Time must look like "18:00" or "6:00 pm".'
          : 'Date must look like "25 May 2025" or "2025-05-25".'
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        skillsNeeded: form.skillsNeeded,
        teamSize: form.teamSize ? Number(form.teamSize) : 1,
        // '' clears an existing deadline on edit; undefined leaves it unset on create.
        deadline: deadline.value ? deadline.value.toISOString() : '',
        venue: form.venue.trim(),
      };
      if (editId) await EventsApi.update(editId, payload);
      else await EventsApi.create(payload);
      navigation.goBack();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <Loading label="Loading post…" />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <AmbientGlow />
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <Text style={[font.bodyMuted, { color: t.textMuted }, { marginBottom: spacing.lg }]}>
            {editId
              ? 'Update the details — everyone sees the changes straight away.'
              : "Tell students what you're building and who you need."}
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

          {/* Deadline — shown on the post so others know how long they have. */}
          <Text style={styles.label}>Deadline (optional)</Text>
          <View style={styles.row}>
            <Field
              placeholder="25 May 2025"
              value={form.date}
              onChangeText={set('date')}
              style={{ flex: 1, marginRight: spacing.md }}
            />
            <Field
              placeholder="18:00"
              value={form.time}
              onChangeText={set('time')}
              style={{ width: 110 }}
            />
          </View>
          <Text style={styles.hint}>Leave the date empty for no deadline. Time is optional.</Text>

          <Field label="Venue (optional)" placeholder="Auditorium, VGU" value={form.venue} onChangeText={set('venue')} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title={editId ? 'Save changes' : 'Post request'} onPress={onSubmit} loading={loading} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    container: { padding: spacing.xl, paddingBottom: layout.tabBarSpace },
    label: { ...font.label, color: t.text, marginBottom: spacing.sm },
    row: { flexDirection: 'row' },
    hint: { fontSize: 11.5, color: t.textMuted, marginTop: -8, marginBottom: spacing.lg },
    cats: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
    cat: {
      paddingHorizontal: spacing.lg,
      paddingVertical: 9,
      borderRadius: radius.pill,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
    },
    catActive: { backgroundColor: t.primary, borderColor: t.primary },
    catText: { fontSize: 13, fontWeight: '600', color: t.textMuted },
    catTextActive: { color: t.onPrimary },
    error: { color: t.danger, marginBottom: spacing.md },
  });
}
