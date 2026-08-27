import React, { useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';
import { monoFamily } from '../theme';

/** Shared primitives, all following the Ink & copper branding. */
function useStyles() {
  const { t, isDark } = useTheme();
  return [useMemo(() => makeStyles(t, isDark), [t, isDark]), t];
}

/** Elevated surface card. */
export function Card({ style, children, onPress }) {
  const [styles] = useStyles();
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={[styles.card, style]} onPress={onPress} activeOpacity={onPress ? 0.96 : 1}>
      {children}
    </Wrapper>
  );
}

/** Pill button — primary / secondary / danger / ghost. */
export function Button({ title, onPress, loading, disabled, variant = 'primary', style, icon }) {
  const [styles, t] = useStyles();
  const isDisabled = disabled || loading;
  const variantStyle =
    variant === 'secondary'
      ? styles.btnSecondary
      : variant === 'danger'
      ? styles.btnDanger
      : variant === 'ghost'
      ? styles.btnGhost
      : styles.btnPrimary;
  const textColor = variant === 'primary' ? t.onPrimary : variant === 'danger' ? '#fff' : t.text;

  return (
    <TouchableOpacity
      style={[styles.btn, variantStyle, isDisabled && styles.btnDisabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.88}
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
  const [styles, t] = useStyles();
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error && styles.inputError, inputStyle]}
        placeholderTextColor={t.textFaint}
        selectionColor={t.primary}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

/** Small pill tag. */
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

/** Uppercase mono label — the TODAY / section rule type. */
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
        <View
          key={i}
          style={[styles.progressSeg, i === active && styles.progressActive, i < active && styles.progressDone]}
        />
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
          <Text style={styles.sectionActionText}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/** Feed-screen header: title left, circular action buttons right. */
export function ScreenHeader({ title, actions = [], style }) {
  const [styles, t] = useStyles();
  return (
    <View style={[styles.headerRow, style]}>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.headerActions}>
        {actions.map((a) => (
          <TouchableOpacity key={a.icon} style={styles.headerBtn} onPress={a.onPress} activeOpacity={0.8}>
            <Icon name={a.icon} size={16} color={t.primary} strokeWidth={1.7} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/** Filter chips matching the home feed exactly. */
export function FilterPills({ items, activeKey, onSelect }) {
  const [styles] = useStyles();
  return (
    <View style={styles.pillsRow}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContent}>
        {items.map((it) => {
          const active = activeKey === it.key;
          return (
            <TouchableOpacity
              key={it.label}
              onPress={() => onSelect(it.key)}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8 }}
            >
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
      <ActivityIndicator size="large" color={t.primary} />
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
    card: {
      backgroundColor: t.surface,
      borderRadius: 18,
      padding: 16,
      borderWidth: isDark ? 1 : 0,
      borderColor: t.hairline,
      shadowColor: '#171B1D',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 20,
      elevation: isDark ? 0 : 2,
    },

    btn: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, borderWidth: 1 },
    btnRow: { flexDirection: 'row', alignItems: 'center' },
    btnPrimary: { backgroundColor: t.primary, borderColor: t.primary },
    btnSecondary: { backgroundColor: t.surface, borderColor: t.borderSoft },
    btnDanger: { backgroundColor: t.danger, borderColor: t.danger },
    btnGhost: { backgroundColor: 'transparent', borderColor: 'transparent' },
    btnDisabled: { opacity: 0.45 },
    btnText: { fontSize: 14, fontWeight: '600', letterSpacing: -0.13 },

    fieldLabel: { fontSize: 12.5, fontWeight: '600', color: t.text, marginBottom: 8 },
    input: {
      minHeight: 48,
      backgroundColor: t.field,
      borderRadius: 14,
      paddingHorizontal: 15,
      fontSize: 15,
      color: t.text,
      borderWidth: 1,
      borderColor: t.borderSoft,
    },
    inputError: { borderColor: t.danger },
    fieldError: { color: t.danger, fontSize: 12, marginTop: 5 },

    chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, alignSelf: 'flex-start' },
    chipText: { fontFamily: monoFamily, fontSize: 9.5, fontWeight: '700', letterSpacing: 0.8 },

    mono: { fontFamily: monoFamily, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },

    progress: { flexDirection: 'row', gap: 8 },
    progressSeg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: t.hairline },
    progressActive: { backgroundColor: t.primary },
    progressDone: { backgroundColor: t.accent },

    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    section: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5, color: t.text },
    sectionActionText: { color: t.accent, fontWeight: '600', fontSize: 12.5 },

    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 14, minHeight: 48 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', letterSpacing: -0.7, color: t.text },
    headerActions: { flexDirection: 'row', gap: 9 },
    headerBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pillsRow: { paddingTop: 2, paddingBottom: 6 },
    pillsContent: { gap: 8, paddingHorizontal: 18 },
    pill: {
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 13,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderSoft,
    },
    pillOn: { backgroundColor: t.primary, borderColor: t.primary },
    pillLabel: { fontSize: 12.5, fontWeight: '600', letterSpacing: -0.2, color: t.textMuted },
    pillLabelOn: { color: t.onPrimary },

    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: t.page },
    loadingLabel: { fontSize: 13, color: t.textMuted, marginTop: 12 },

    empty: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 30 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: t.text, textAlign: 'center' },
    emptySub: { fontSize: 13, color: t.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  });
}
