import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, KeyboardAvoidingView, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../../components/ui';
import { Ghost } from '../../components/Mascot';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, font, radius } from '../../theme';

const CELLS = 6;

// Haptics are best-effort: they throw on web / simulators without an engine.
const haptic = {
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  select: () => Haptics.selectionAsync().catch(() => {}),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
};

export default function OtpScreen({ route }) {
  const { email } = route.params;
  const { verifyOtp, resendOtp, celebrate } = useAuth();
  const [digits, setDigits] = useState(Array(CELLS).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false); // true once the code is accepted (celebration playing)
  const inputs = useRef([]);
  const submittedCode = useRef(''); // prevents double auto-submit of the same code

  // Shake the cells on a wrong code.
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function runShake() {
    shake.setValue(0);
    Animated.sequence(
      [10, -10, 8, -8, 5, -5, 0].map((x) => Animated.timing(shake, { toValue: x, duration: 45, useNativeDriver: true }))
    ).start();
  }

  const onVerify = useCallback(
    async (codeArg) => {
      const code = codeArg ?? digits.join('');
      setError('');
      if (code.length !== CELLS) {
        setError('Enter the 6-digit code.');
        return;
      }
      if (loading || submittedCode.current === code) return;
      submittedCode.current = code;
      Keyboard.dismiss();
      setLoading(true);
      try {
        // Keep the auth stack mounted while the success animation plays;
        // `finish()` swaps the app to the logged-in tabs afterwards.
        const { user, finish } = await verifyOtp(email, code, { autoLogin: false });
        setVerified(true);
        celebrate({ title: `You're in, ${user.name.split(' ')[0]}!`, finish });
      } catch (e) {
        submittedCode.current = '';
        haptic.error();
        runShake();
        setError(e.message);
        setDigits(Array(CELLS).fill(''));
        inputs.current[0]?.focus();
      } finally {
        setLoading(false);
      }
    },
    [digits, email, loading, verifyOtp] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Auto-submit as soon as all six digits are in.
  useEffect(() => {
    const code = digits.join('');
    if (code.length === CELLS && digits.every(Boolean)) onVerify(code);
  }, [digits]); // eslint-disable-line react-hooks/exhaustive-deps

  function onChange(text, index) {
    const clean = text.replace(/[^0-9]/g, '');
    const next = [...digits];

    if (clean.length > 1) {
      // Handle paste of the whole code.
      const chars = clean.slice(0, CELLS).split('');
      chars.forEach((ch, i) => (next[i] = ch));
      setDigits(next);
      haptic.select();
      inputs.current[Math.min(chars.length, CELLS - 1)]?.focus();
      return;
    }

    next[index] = clean;
    setDigits(next);
    if (clean) {
      haptic.tap();
      if (index < CELLS - 1) inputs.current[index + 1]?.focus();
    }
  }

  function onKeyPress(e, index) {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function onResend() {
    if (cooldown > 0) return;
    setError('');
    setInfo('');
    haptic.select();
    try {
      const res = await resendOtp(email);
      setInfo(res.message || 'A new code was sent.');
      setCooldown(30);
      submittedCode.current = '';
      setDigits(Array(CELLS).fill(''));
      inputs.current[0]?.focus();
    } catch (e) {
      haptic.error();
      setError(e.message);
    }
  }

  const filled = digits.every(Boolean);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          {/* reading glasses while it waits, happy once all six are in */}
          <Ghost width={96} variant={error ? 'sad' : filled ? 'happy' : 'glasses'} />
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={{ fontWeight: '700', color: colors.text }}>{email}</Text>
          </Text>
        </View>

        <Animated.View style={[styles.cells, { transform: [{ translateX: shake }] }]}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              style={[styles.cell, d && styles.cellFilled, error && styles.cellError]}
              keyboardType="number-pad"
              maxLength={CELLS} // allow paste
              value={d}
              onChangeText={(t) => onChange(t, i)}
              onKeyPress={(e) => onKeyPress(e, i)}
              autoFocus={i === 0}
              editable={!loading && !verified}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
            />
          ))}
        </Animated.View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}
        {loading ? <Text style={styles.checking}>Checking…</Text> : null}
      </View>

      {/* Pinned to the bottom of the screen */}
      <View style={styles.bottom}>
        <Button title="Verify & continue" onPress={() => onVerify()} loading={loading} disabled={verified} />

        <TouchableOpacity style={styles.resend} onPress={onResend} disabled={cooldown > 0}>
          <Text style={[font.bodyMuted]}>Didn't get it? </Text>
          <Text style={[styles.link, cooldown > 0 && { color: colors.textFaint }]}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.xl, paddingTop: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: spacing.lg },
  subtitle: { ...font.bodyMuted, marginTop: 6, textAlign: 'center', lineHeight: 22 },
  cells: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.lg },
  cell: {
    width: 48,
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  cellFilled: { borderColor: colors.primary, backgroundColor: colors.bg },
  cellError: { borderColor: colors.danger },
  error: { color: colors.danger, marginBottom: spacing.sm, textAlign: 'center' },
  info: { color: colors.success, marginBottom: spacing.sm, textAlign: 'center' },
  checking: { ...font.small, textAlign: 'center', color: colors.textMuted },
  bottom: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg },
  resend: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  link: { color: colors.accent, fontWeight: '700' },
});
