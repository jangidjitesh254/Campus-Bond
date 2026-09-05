import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,

  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useKeyboardHeight } from '../../hooks/useKeyboardOpen';
import { spacing, font } from '../../theme';

export default function LoginScreen({ navigation }) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const keyboardHeight = useKeyboardHeight();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onLogin() {
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      // On success, the root navigator swaps to the app automatically.
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <View style={styles.brand}>
            <Text style={styles.logo}>
              CAMPUS <Text style={{ color: t.primary }}>BOND</Text>
            </Text>
            <Text style={styles.tagline}>ONE CAMPUS · EVERY STUDENT · CONNECTED</Text>
          </View>

          <Text style={[font.h1, { color: t.text }, { color: t.text }]}>Welcome back 👋</Text>
          <Text style={[font.bodyMuted, { color: t.textMuted }, { marginBottom: spacing.xl }]}>
            Log in to your campus account.
          </Text>

          <Field
            label="VGU email"
            placeholder="enrollment@vgu.ac.in"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            label="Password"
            placeholder="Your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Log in" onPress={onLogin} loading={loading} />

          <TouchableOpacity
            style={styles.footer}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={[font.bodyMuted, { color: t.textMuted }, { color: t.textMuted }]}>New here? </Text>
            <Text style={styles.link}>Create an account</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    container: { padding: spacing.xl, flexGrow: 1, justifyContent: 'center' },
    brand: { alignItems: 'center', marginBottom: spacing.xxl },
    logo: { fontSize: 28, fontWeight: '900', color: t.text, letterSpacing: 1 },
    tagline: { ...font.mono, color: t.textMuted, marginTop: spacing.sm, fontSize: 10 },
    error: { color: t.danger, marginBottom: spacing.md },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
    link: { color: t.accent, fontWeight: '700' },
    });
  }
