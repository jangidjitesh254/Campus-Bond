import React, { useMemo } from 'react';
import { View, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, TextInput } from './Text';
import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';
import { gradients, shadow, spacing, radius, monoFamily } from '../theme';

/** Shared primitives in the Grove design language. */
function useStyles() {
  const { t, isDark } = useTheme();
  return [useMemo(() => makeStyles(t, isDark), [t, isDark]), t];
}

/** White card with a hairline border and a soft shadow. */
export function Card({ style, children, onPress }) {
  const [styles] = useStyles();
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={[styles.card, style]} onPress={onPress} activeOpacity={onPress ? 0.96 : 1}>
      {children}
    </Wrapper>
  );
}

/**
 * Big, chunky tap targets (Swiggy / Zomato style). `primary` is the solid
 * green button; `accent` is the green gradient reserved for the one action a
 * screen is about; `secondary` is the soft tint; `danger` and `ghost` as named.
 */
export function Button({ title, onPress, loading, disabled, variant = 'primary', style, icon, iconRight }) {
  const [styles, t] = useStyles();
  const isDisabled = disabled || loading;
  const textColor =
    variant === 'primary' || variant === 'accent' || variant === 'danger' ? t.onPrimary : t.text;
  const inner = loading ? (
    <ActivityIndicator color={textColor} />
  ) : (
    <View style={styles.btnRow}>
      {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
      <Text style={[styles.btnText, { color: textColor }]}>{title}</Text>
      {iconRight ? <View style={{ marginLeft: 8 }}>{iconRight}</View> : null}
    </View>
  );

  if (variant === 'accent') {
    return (
      <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.88} style={[styles.btnShadow, isDisabled && styles.btnDisabled, style]}>
        <LinearGradient colors={gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.btn, shadow.glow]}>
          {inner}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyle =
    variant === 'secondary' ? styles.btnSecondary : variant === 'danger' ? styles.btnDanger : variant === 'ghost' ? styles.btnGhost : styles.btnPrimary;
  return (
    <TouchableOpacity style={[styles.btn, variantStyle, isDisabled && styles.btnDisabled, style]} onPress={onPress} disabled={isDisabled} activeOpacity={0.85}>
      {inner}
    </TouchableOpacity>
  );
}

/** Labeled text input. Forwards its ref to the TextInput so screens can chain focus. */
export const Field = React.forwardRef(function Field({ label, error, style, inputStyle, ...props }, ref) {
  const [styles, t] = useStyles();
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        ref={ref}
        style={[styles.input, error && styles.inputError, inputStyle]}
        placeholderTextColor={t.textFaint}
        selectionColor={t.accentFill}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
});

/** Small uppercase tag — the category label on a card. */
export function Chip({ label, tone = 'default', style }) {
  const [styles, t] = useStyles();
  const tones = {
    default: { bg: t.badgeTeamBg, fg: t.badgeTeamFg },
    accent: { bg: t.accentSoft, fg: t.accent },
    success: { bg: t.successSoft, fg: t.success },
    danger: { bg: t.dangerSoft, fg: t.danger },
    muted: { bg: t.field, fg: t.textMuted },
  };
  const c = tones[tone] || tones.default;
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }, style]}>
      <Text style={[styles.chipText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

/** Tracked uppercase eyebrow — the TODAY / section-rule type. */
export function MonoLabel({ children, color, style }) {
  const [styles, t] = useStyles();
  return <Text style={[styles.mono, { color: color || t.accent }, style]}>{children}</Text>;
}

/** Segmented progress bar. */
export function ProgressBar({ steps = 4, active = 0, style }) {
  const [styles] = useStyles();
  return (
    <View style={[styles.progress, style]}>
      {Array.from({ length: steps }).map((_, i) => (
        <View key={i} style={[styles.progressSeg, i === active && styles.progressActive, i < active && styles.progressDone]} />
      ))}
    </View>
  );
}

/** Bold section header with an optional action. */
export function SectionTitle({ children, action, onAction, style }) {
  const [styles] = useStyles();
  return (
    <View style={[styles.sectionRow, style]}>
      <Text style={styles.section}>{children}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.sectionActionText}>{action} ›</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/** Feed-screen header: title left, round action buttons right. */
export function ScreenHeader({ title, actions = [], style }) {
  const [styles, t] = useStyles();
  return (
    <View style={[styles.headerRow, style]}>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={styles.headerActions}>
        {actions.map((a) => (
          <TouchableOpacity key={a.icon} style={styles.headerBtn} onPress={a.onPress} activeOpacity={0.8}>
            <Icon name={a.icon} size={16} color={t.textMuted} strokeWidth={1.8} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/** Filter pills — solid for the active one, outlined for the rest. */
export function FilterPills({ items, activeKey, onSelect, style }) {
  const [styles] = useStyles();
  return (
    <View style={[styles.pillsRow, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContent}>
        {items.map((it) => {
          const active = activeKey === it.key;
          return (
            <TouchableOpacity key={it.label} onPress={() => onSelect(it.key)} activeOpacity={0.85} hitSlop={{ top: 8, bottom: 8 }}>
              <View style={[styles.pill, active && styles.pillOn]}>
                <Text style={[styles.pillLabel, active && styles.pillLabelOn]}>{it.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Full-screen centered loader. */
export function Loading({ label }) {
  const [styles, t] = useStyles();
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={t.accentFill} />
      {label ? <Text style={styles.loadingLabel}>{label}</Text> : null}
    </View>
  );
}

/** Empty-state placeholder. */
export function EmptyState({ title, subtitle }) {
  const [styles] = useStyles();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
    </View>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    card: { backgroundColor: t.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: t.border, ...(isDark ? {} : shadow.soft) },

    // Big, chunky tap targets (Swiggy / Zomato style).
    btn: { height: 60, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, borderWidth: 1.5, borderColor: 'transparent' },
    btnShadow: { borderRadius: radius.lg },
    btnRow: { flexDirection: 'row', alignItems: 'center' },
    btnPrimary: { backgroundColor: t.primary, borderColor: t.primary, ...(isDark ? {} : { ...shadow.card, shadowColor: t.primaryDark, shadowOpacity: 0.25 }) },
    btnSecondary: { backgroundColor: t.surfaceAlt, borderColor: t.border },
    btnDanger: { backgroundColor: t.danger, borderColor: t.danger, ...(isDark ? {} : { ...shadow.card, shadowColor: t.danger, shadowOpacity: 0.25 }) },
    btnGhost: { backgroundColor: 'transparent', borderColor: 'transparent' },
    btnDisabled: { opacity: 0.45 },
    btnText: { fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },

    fieldLabel: { fontSize: 14.5, fontWeight: '600', color: t.text, marginBottom: spacing.sm },
    input: { minHeight: 58, backgroundColor: t.surface, borderRadius: radius.lg, paddingHorizontal: spacing.lg, fontSize: 16, color: t.text, borderWidth: 1.5, borderColor: t.border },
    inputError: { borderColor: t.danger },
    fieldError: { color: t.danger, fontSize: 13, marginTop: spacing.xs },

    chip: { paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill, alignSelf: 'flex-start' },
    chipText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },

    mono: { fontFamily: monoFamily, fontSize: 12, letterSpacing: 1.5, fontWeight: '600' },

    progress: { flexDirection: 'row', gap: 8 },
    progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: t.surfaceHi },
    progressActive: { backgroundColor: t.primary },
    progressDone: { backgroundColor: t.primaryDark },

    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
    section: { fontSize: 20, fontWeight: '700', color: t.text },
    sectionActionText: { color: t.primaryDark, fontWeight: '700', fontSize: 14 },

    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, minHeight: 48 },
    headerTitle: { flex: 1, fontSize: 25, fontWeight: '800', color: t.text },
    headerActions: { flexDirection: 'row', gap: 10 },
    headerBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: t.surfaceAlt, alignItems: 'center', justifyContent: 'center' },

    pillsRow: { paddingTop: 2, paddingBottom: 6 },
    pillsContent: { gap: 8, paddingHorizontal: 20 },
    pill: { borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 18, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border },
    pillOn: { backgroundColor: t.primary, borderColor: t.primary },
    pillLabel: { fontSize: 13, fontWeight: '600', color: t.textFaint },
    pillLabelOn: { color: t.onPrimary, fontWeight: '700' },

    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: t.page },
    loadingLabel: { fontSize: 13, fontWeight: '600', color: t.textMuted, marginTop: 12 },

    empty: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 30 },
    emptyTitle: { fontSize: 15, fontWeight: '800', color: t.text, textAlign: 'center' },
    emptySub: { fontSize: 13, fontWeight: '600', color: t.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 19.5 },
  });
}
