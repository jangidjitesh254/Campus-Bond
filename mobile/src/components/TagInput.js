import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';
import { monoFamily } from '../theme';

/**
 * Chips + a text box. Type a tag and press return (or a comma) to add it;
 * tap the × on a chip to remove it. Used for skills on the profile.
 */
export default function TagInput({ label, value = [], onChange, placeholder, suggestions = [], max = 20, style }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const [draft, setDraft] = useState('');

  const has = (tag) => value.some((v) => v.toLowerCase() === tag.toLowerCase());

  function add(raw) {
    const tag = String(raw || '').trim().replace(/,+$/, '').slice(0, 40);
    if (!tag || has(tag) || value.length >= max) return setDraft('');
    onChange([...value, tag]);
    setDraft('');
  }

  function onChangeText(text) {
    // A comma commits the tag, like most tag fields do.
    if (text.endsWith(',')) add(text);
    else setDraft(text);
  }

  const remaining = suggestions.filter((s) => !has(s)).slice(0, 8);

  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.box}>
        {value.map((tag) => (
          <View key={tag} style={styles.chip}>
            <Text style={styles.chipText}>{tag}</Text>
            <TouchableOpacity onPress={() => onChange(value.filter((v) => v !== tag))} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
              <Icon name="plus" size={12} color={t.onPrimary} strokeWidth={2.4} style={{ transform: [{ rotate: '45deg' }] }} />
            </TouchableOpacity>
          </View>
        ))}
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={onChangeText}
          onSubmitEditing={() => add(draft)}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length ? 'Add another' : placeholder}
          placeholderTextColor={t.textFaint}
          selectionColor={t.primary}
          blurOnSubmit={false}
          returnKeyType="done"
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>
      {remaining.length ? (
        <View style={styles.suggestRow}>
          {remaining.map((s) => (
            <TouchableOpacity key={s} style={styles.suggest} onPress={() => add(s)} activeOpacity={0.8}>
              <Text style={styles.suggestText}>+ {s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    label: { fontSize: 12.5, fontWeight: '600', color: t.text, marginBottom: 8 },
    box: {
      minHeight: 48,
      backgroundColor: t.field,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.borderSoft,
      paddingHorizontal: 10,
      paddingVertical: 6,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: t.primary,
      borderRadius: 999,
      paddingLeft: 11,
      paddingRight: 8,
      paddingVertical: 6,
    },
    chipText: { color: t.onPrimary, fontSize: 12.5, fontWeight: '600' },
    input: { flexGrow: 1, minWidth: 110, fontSize: 15, color: t.text, paddingVertical: 6, paddingHorizontal: 4 },
    suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    suggest: { borderRadius: 999, borderWidth: 1, borderColor: t.borderSoft, backgroundColor: t.surface, paddingHorizontal: 10, paddingVertical: 5 },
    suggestText: { fontFamily: monoFamily, fontSize: 9.5, fontWeight: '700', letterSpacing: 0.6, color: t.textMuted },
  });
}
