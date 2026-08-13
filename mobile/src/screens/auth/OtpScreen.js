import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, font, radius } from '../../theme';

const CELLS = 6;

export default function OtpScreen({ route }) {
  const { email } = route.params;
  const { verifyOtp, resendOtp } = useAuth();
  const [digits, setDigits] = useState(Array(CELLS).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function onChange(text, index) {
    const clean = text.replace(/[^0-9]/g, '');
    const next = [...digits];

    if (clean.length > 1) {
      // Handle paste of the whole code.
      const chars = clean.slice(0, CELLS).split('');
      chars.forEach((ch, i) => (next[i] = ch));
      setDigits(next);
      inputs.current[Math.min(chars.length, CELLS - 1)]?.focus();
      return;
    }

    next[index] = clean;
    setDigits(next);
    if (clean && index < CELLS - 1) inputs.current[index + 1]?.focus();
  }

  function onKeyPress(e, index) {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function onVerify() {
    setError('');
    const code = digits.join('');
    if (code.length !== CELLS) {
      setError('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, code);
      // Success → root navigator swaps to the app.
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (cooldown > 0) return;
    setError('');
    setInfo('');
    try {
      const res = await resendOtp(email);
      setInfo(res.message || 'A new code was sent.');
      setCooldown(30);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={font.h1}>Verify email</Text>
        <Text style={[font.bodyMuted, { marginBottom: spacing.xl }]}>
          Enter the 6-digit code we sent to{'\n'}
          <Text style={{ fontWeight: '700', color: colors.text }}>{email}</Text>
        </Text>

        <View style={styles.cells}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              style={[styles.cell, d && styles.cellFilled]}
              keyboardType="number-pad"
              maxLength={CELLS} // allow paste
              value={d}
              onChangeText={(t) => onChange(t, i)}
              onKeyPress={(e) => onKeyPress(e, i)}
              autoFocus={i === 0}
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <Button title="Verify & continue" onPress={onVerify} loading={loading} style={{ marginTop: spacing.lg }} />

        <TouchableOpacity style={styles.resend} onPress={onResend} disabled={cooldown > 0}>
          <Text style={[font.bodyMuted]}>Didn't get it? </Text>
          <Text style={[styles.link, cooldown > 0 && { color: colors.textFaint }]}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Tip: in development the code is printed in your backend server console.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  cells: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
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
  error: { color: colors.danger, marginBottom: spacing.sm },
  info: { color: colors.success, marginBottom: spacing.sm },
  resend: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  link: { color: colors.accent, fontWeight: '700' },
  hint: { ...font.small, textAlign: 'center', marginTop: spacing.xxl, color: colors.textFaint },
});
