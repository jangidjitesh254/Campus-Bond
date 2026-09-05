import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import { Button, Field } from '../../components/ui';
import { ClubApi } from '../../api/clubs';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useKeyboardHeight } from '../../hooks/useKeyboardOpen';
import { layout, monoFamily } from '../../theme';

const STEPS = ['YOUR DETAILS', 'WHY YOU', 'CONSENT'];

/**
 * Applying to a club: review the details that will be shared, say why you want
 * in, agree to the club terms, then the request goes to the president. Nobody
 * is added to a club without that review.
 */
export default function JoinClubScreen({ navigation, route }) {
  const { id, name, category } = route.params;
  const { user } = useAuth();
  const { t, clubs, isDark } = useTheme();
  const c = clubs[category] || clubs.other;
  const styles = useMemo(() => makeStyles(t, c, isDark), [t, c, isDark]);
  const keyboardHeight = useKeyboardHeight();

  const [why, setWhy] = useState('');
  const [skills, setSkills] = useState('');
  const [branch, setBranch] = useState(user?.branch || '');
  const [semester, setSemester] = useState(user?.semester ? String(user.semester) : '');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (name) navigation.setOptions({ title: `Join ${name}` }); }, [navigation, name]);

  // which step the student is effectively on, for the progress strip
  const step = !why.trim() ? 1 : !consent ? 2 : 3;

  async function submit() {
    setError('');
    if (!why.trim()) return setError('Tell the club why you want to join.');
    if (!consent) return setError('Please agree to the club terms to continue.');

    setBusy(true);
    try {
      await ClubApi.request(id, {
        why: why.trim(),
        skills: skills.trim(),
        branch: branch.trim(),
        semester: semester ? Number(semester) : undefined,
        consent: true,
      });
      Alert.alert(
        'Request sent',
        `Your application is with the ${name} president. You will see it under My clubs once it is accepted.`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          {/* progress strip */}
          <View style={styles.steps}>
            {STEPS.map((label, i) => (
              <View key={label} style={styles.stepWrap}>
                <View style={[styles.stepBar, i < step && styles.stepBarOn]} />
                <Text style={[styles.stepText, i < step && styles.stepTextOn]}>{label}</Text>
              </View>
            ))}
          </View>

          {/* 1 — what the club will see */}
          <Text style={styles.section}>Shared with the club</Text>
          <View style={styles.card}>
            <Row styles={styles} label="Name" value={user?.name || '—'} />
            <Row styles={styles} label="Email" value={user?.email || '—'} last />
          </View>
          <Text style={styles.hint}>
            Check your branch and semester below — the president sees these with your request.
          </Text>

          <View style={styles.row}>
            <Field label="Branch" placeholder="CSE" autoCapitalize="characters" value={branch} onChangeText={setBranch} style={{ flex: 1 }} />
            <View style={{ width: 12 }} />
            <Field label="Semester" placeholder="5" keyboardType="number-pad" value={semester} onChangeText={setSemester} style={{ width: 108 }} />
          </View>

          {/* 2 — the pitch */}
          <Text style={styles.section}>Why you want to join</Text>
          <Field
            placeholder="What draws you to this club, and what would you like to work on?"
            value={why}
            onChangeText={setWhy}
            multiline
            inputStyle={{ height: 104, textAlignVertical: 'top', paddingTop: 12 }}
          />
          <Field
            label="Skills or interests (optional)"
            placeholder="Design, video editing, public speaking…"
            value={skills}
            onChangeText={setSkills}
          />

          {/* 3 — consent */}
          <Text style={styles.section}>Consent</Text>
          <TouchableOpacity style={[styles.consent, consent && styles.consentOn]} activeOpacity={0.85} onPress={() => setConsent((v) => !v)}>
            <View style={[styles.box, consent && styles.boxOn]}>
              {consent ? <Icon name="check" size={13} color={t.onPrimary} strokeWidth={3} /> : null}
            </View>
            <Text style={styles.consentText}>
              I agree to share these details with the club president, to follow the club rules, and to
              take part in its activities in good faith.
            </Text>
          </TouchableOpacity>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Send request to president" onPress={submit} loading={busy} style={{ marginTop: 8 }} />
          <Text style={styles.footNote}>
            You are not joining yet. The president reviews every request.
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, last, styles }) {
  return (
    <View style={[styles.detail, !last && styles.detailBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function makeStyles(t, c, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.page },
    container: { padding: 18, paddingBottom: layout.tabBarSpace },

    steps: { flexDirection: 'row', gap: 8, marginBottom: 22 },
    stepWrap: { flex: 1, gap: 6 },
    stepBar: { height: 3, borderRadius: 2, backgroundColor: t.hairline },
    stepBarOn: { backgroundColor: c.fg },
    stepText: { fontFamily: monoFamily, fontSize: 8, fontWeight: '700', letterSpacing: 0.9, color: t.textFaint },
    stepTextOn: { color: c.fg },

    section: { fontSize: 13, fontWeight: '700', letterSpacing: -0.2, color: t.text, marginBottom: 10, marginTop: 6 },
    card: {
      backgroundColor: t.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.borderSoft,
      paddingHorizontal: 14,
      marginBottom: 10,
    },
    detail: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 12 },
    detailBorder: { borderBottomWidth: 1, borderBottomColor: t.hairline },
    detailLabel: { fontSize: 12.5, color: t.textMuted },
    detailValue: { flexShrink: 1, fontSize: 12.5, fontWeight: '600', color: t.text, textAlign: 'right' },
    hint: { fontSize: 11.5, lineHeight: 16, color: t.textMuted, marginBottom: 16 },
    row: { flexDirection: 'row' },

    consent: {
      flexDirection: 'row',
      gap: 11,
      padding: 14,
      borderRadius: 14,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderSoft,
      marginBottom: 14,
    },
    consentOn: { borderColor: c.fg, backgroundColor: c.bg },
    box: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: t.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    boxOn: { backgroundColor: t.primary, borderColor: t.primary },
    consentText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: t.text },

    error: { color: t.danger, fontSize: 12.5, marginBottom: 10 },
    footNote: { fontSize: 11.5, color: t.textMuted, textAlign: 'center', marginTop: 12 },
  });
}
