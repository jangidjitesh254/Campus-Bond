import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors, spacing, radius, font, shadow, monoFamily } from '../theme';

/** White elevated card. */
export function Card({ style, children, onPress }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={[styles.card, style]} onPress={onPress} activeOpacity={onPress ? 0.85 : 1}>
      {children}
    </Wrapper>
  );
}

/** Primary (green) / secondary / danger / ghost button. */
export function Button({ title, onPress, loading, disabled, variant = 'primary', style, icon }) {
  const isDisabled = disabled || loading;
  const variantStyle =
    variant === 'secondary'
      ? styles.btnSecondary
      : variant === 'danger'
      ? styles.btnDanger
      : variant === 'ghost'
      ? styles.btnGhost
      : styles.btnPrimary;
  const textColor =
    variant === 'primary' ? colors.onPrimary : variant === 'danger' ? '#fff' : colors.text;

  return (
    <TouchableOpacity
      style={[styles.btn, variantStyle, isDisabled && styles.btnDisabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.btnRow}>
          {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
          <Text style={[styles.btnText, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

/** Labeled text input. */
export function Field({ label, error, style, inputStyle, ...props }) {
  return (
    <View style={[{ marginBottom: spacing.lg }, style]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error && styles.inputError, inputStyle]}
        placeholderTextColor={colors.textFaint}
        selectionColor={colors.primary}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

/** Small pill tag. */
export function Chip({ label, tone = 'default', style }) {
  const tones = {
    default: { bg: colors.surfaceAlt, fg: colors.primaryDark },
    accent: { bg: colors.accentSoft, fg: colors.primaryDark },
    success: { bg: colors.successSoft, fg: colors.success },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    muted: { bg: colors.surfaceAlt, fg: colors.textMuted },
  };
  const t = tones[tone] || tones.default;
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.chipText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

/** Uppercase mono label. */
export function MonoLabel({ children, color = colors.textMuted, style }) {
  return <Text style={[styles.mono, { color }, style]}>{children}</Text>;
}

/** Segmented progress bar. */
export function ProgressBar({ steps = 4, active = 0, style }) {
  return (
    <View style={[styles.progress, style]}>
      {Array.from({ length: steps }).map((_, i) => (
        <View
          key={i}
          style={[styles.progressSeg, i === active && styles.progressActive, i < active && styles.progressDone]}
        />
      ))}
    </View>
  );
}

/** Bold section header with an optional "See all" action. */
export function SectionTitle({ children, action, onAction, style }) {
  return (
    <View style={[styles.sectionRow, style]}>
      <Text style={styles.section}>{children}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/** Full-screen centered loader. */
export function Loading({ label }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={[font.bodyMuted, { marginTop: spacing.md }]}>{label}</Text> : null}
    </View>
  );
}

/** Empty-state placeholder. */
export function EmptyState({ title, subtitle }) {
  return (
    <View style={styles.empty}>
      <Text style={[font.h3, { textAlign: 'center' }]}>{title}</Text>
      {subtitle ? (
        <Text style={[font.bodyMuted, { textAlign: 'center', marginTop: spacing.sm }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  btn: {
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnSecondary: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  btnDanger: { backgroundColor: colors.danger },
  btnGhost: { backgroundColor: 'transparent' },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: 16, fontWeight: '800' },
  fieldLabel: { ...font.label, marginBottom: spacing.sm },
  input: {
    minHeight: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: { borderColor: colors.danger },
  fieldError: { color: colors.danger, fontSize: 13, marginTop: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  mono: { fontFamily: monoFamily, fontSize: 12, letterSpacing: 1.5, fontWeight: '600' },
  progress: { flexDirection: 'row', gap: spacing.sm },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceHi },
  progressActive: { backgroundColor: colors.primary },
  progressDone: { backgroundColor: colors.primaryDark },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  section: { ...font.h2 },
  sectionAction: { flexDirection: 'row', alignItems: 'center' },
  sectionActionText: { color: colors.primaryDark, fontWeight: '700', fontSize: 14 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.bg },
  empty: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
});
