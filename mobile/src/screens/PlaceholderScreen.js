import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MonoLabel, ProgressBar } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, monoFamily } from '../theme';

/**
 * Editorial "coming soon" hero, styled after the dark-green reference:
 * a mono step label, a giant ghost number, a bold heading, muted body,
 * a lime progress bar, and a mono bullet line.
 */
export default function PlaceholderScreen({
  step = '00',
  label = 'COMING SOON',
  title = 'Coming soon',
  subtitle = "We're building this in an upcoming phase. Stay tuned!",
  bullets = [],
  icon,
}) {
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.wrap}>
        <View style={styles.card}>
          {/* Ghost number in the corner */}
          <Text style={styles.ghost}>{step}</Text>

          <MonoLabel color={t.primary}>{`STEP ${step} — ${label}`}</MonoLabel>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <ProgressBar steps={4} active={1} style={{ marginTop: spacing.xl }} />

          {bullets.length ? (
            <Text style={styles.bullets}>{bullets.join('  ·  ')}</Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    wrap: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
    card: {
      backgroundColor: t.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: t.border,
      padding: spacing.xl,
      overflow: 'hidden',
      minHeight: 320,
      justifyContent: 'center',
    },
    ghost: {
      position: 'absolute',
      top: -30,
      right: -6,
      fontSize: 190,
      fontWeight: '900',
      color: 'rgba(245,245,245,0.05)',
      letterSpacing: -6,
    },
    title: {
      fontSize: 38,
      fontWeight: '900',
      color: t.text,
      letterSpacing: -1,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    subtitle: { fontSize: 16, lineHeight: 24, color: t.textMuted },
    bullets: {
      fontFamily: monoFamily,
      fontSize: 12,
      letterSpacing: 1.5,
      color: t.textMuted,
      marginTop: spacing.xl,
    },
    });
  }
