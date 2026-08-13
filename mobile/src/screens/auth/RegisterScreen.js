import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, font } from '../../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    branch: '',
    semester: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  async function onRegister() {
    setError('');
    if (!form.name || !form.email || !form.password) {
      setError('Name, email and password are required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        branch: form.branch.trim(),
        semester: form.semester ? Number(form.semester) : undefined,
      };
      await register(payload);
      // Move to OTP screen with the email so it can verify.
      navigation.navigate('Otp', { email: payload.email });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={font.h1}>Create account</Text>
          <Text style={[font.bodyMuted, { marginBottom: spacing.xl }]}>
            Use your college email — we'll send a verification code.
          </Text>

          <Field label="Full name" placeholder="Jitesh Jangir" value={form.name} onChangeText={set('name')} />
          <Field
            label="College email"
            placeholder="you@college.edu"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={set('email')}
          />
          <Field
            label="Password"
            placeholder="At least 6 characters"
            secureTextEntry
            value={form.password}
            onChangeText={set('password')}
          />

          <View style={styles.row}>
            <Field
              label="Branch"
              placeholder="CSE"
              autoCapitalize="characters"
              value={form.branch}
              onChangeText={set('branch')}
              style={{ flex: 1, marginRight: spacing.md }}
            />
            <Field
              label="Semester"
              placeholder="5"
              keyboardType="number-pad"
              value={form.semester}
              onChangeText={set('semester')}
              style={{ width: 110 }}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Send verification code" onPress={onRegister} loading={loading} />

          <TouchableOpacity style={styles.footer} onPress={() => navigation.navigate('Login')}>
            <Text style={font.bodyMuted}>Already have an account? </Text>
            <Text style={styles.link}>Log in</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl, flexGrow: 1, justifyContent: 'center' },
  row: { flexDirection: 'row' },
  error: { color: colors.danger, marginBottom: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  link: { color: colors.accent, fontWeight: '700' },
});
