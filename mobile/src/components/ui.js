import React, { useMemo } from 'react';
import { View, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, TextInput } from './Text';
import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';
import { gradients, shadow } from '../theme';

/** Shared primitives in the Ember design language. */
function useStyles() {
  const { t, isDark } = useTheme();
  return [useMemo(() => makeStyles(t, isDark), [t, isDark]), t];
}

/** Glass card — translucent surface over the glow, 26px corners. */
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
 * Pill button. `primary` is the solid ink/paper pill; `accent` is the coral
 * gradient reserved for the one action a screen is about; `secondary` is
 * outlined; `danger` and `ghost` as named.
 */
export function Button({ title, onPress, loading, disabled, variant = 'primary', style, icon }) {
  const [styles, t] = useStyles();
  const isDisabled = disabled || loading;
  const textColor =
    variant === 'primary' ? t.onPrimary : variant === 'accent' ? '#FFFFFF' : variant === 'danger' ? t.danger : t.text;
  const inner = loading ? (
    <ActivityIndicator color={textColor} />
  ) : (
    <View style={styles.btnRow}>
      {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
      <Text style={[styles.btnText, { color: textColor }]}>{title}</Text>
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
    <TouchableOpacity style={[styles.btn, variantStyle, isDisabled && styles.btnDisabled, style]} onPress={onPress} disabled={isDisabled} activeOpacity={0.88}>
      {inner}
    </TouchableOpacity>
  );
}

/** Labeled text input. */
export function Field({ label, error, style, inputStyle, ...props }) {
  const [styles, t] = useStyles();
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error && styles.inputError, inputStyle]}
        placeholderTextColor={t.textFaint}
        selectionColor={t.accentFill}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

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
    card: { backgroundColor: t.glass, borderRadius: 26, padding: 18, borderWidth: 1, borderColor: t.glassBorder, ...shadow.card },

    btn: { height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, borderWidth: 1.5, borderColor: 'transparent' },
    btnShadow: { borderRadius: 999 },
    btnRow: { flexDirection: 'row', alignItems: 'center' },
    btnPrimary: { backgroundColor: t.primary, borderColor: t.primary, ...(isDark ? {} : shadow.soft) },
    btnSecondary: { backgroundColor: 'transparent', borderColor: t.borderSoft },
    btnDanger: { backgroundColor: t.dangerSoft, borderColor: 'transparent' },
    btnGhost: { backgroundColor: 'transparent', borderColor: 'transparent' },
    btnDisabled: { opacity: 0.45 },
    btnText: { fontSize: 14, fontWeight: '800' },

    fieldLabel: { fontSize: 12.5, fontWeight: '700', color: t.text, marginBottom: 8 },
    input: { minHeight: 50, backgroundColor: t.field, borderRadius: 20, paddingHorizontal: 16, fontSize: 14.5, fontWeight: '600', color: t.text, borderWidth: 1, borderColor: t.borderSoft },
    inputError: { borderColor: t.danger },
    fieldError: { color: t.danger, fontSize: 12, fontWeight: '600', marginTop: 5 },

    chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
    chipText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },

    mono: { fontSize: 12, letterSpacing: 1.5, fontWeight: '800', textTransform: 'uppercase' },

    progress: { flexDirection: 'row', gap: 8 },
    progressSeg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: t.hairlineAlt },
    progressActive: { backgroundColor: t.accentFill },
    progressDone: { backgroundColor: t.primary },

    sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 },
    section: { fontSize: 18, fontWeight: '800', color: t.text },
    sectionActionText: { color: t.accent, fontWeight: '700', fontSize: 13 },

    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, minHeight: 48 },
    headerTitle: { flex: 1, fontSize: 25, fontWeight: '800', color: t.text },
    headerActions: { flexDirection: 'row', gap: 10 },
    headerBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: t.surfaceAlt, alignItems: 'center', justifyContent: 'center' },

    pillsRow: { paddingTop: 2, paddingBottom: 6 },
    pillsContent: { gap: 8, paddingHorizontal: 20 },
    pill: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 18, backgroundColor: 'transparent', borderWidth: 1, borderColor: t.borderSoft },
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
