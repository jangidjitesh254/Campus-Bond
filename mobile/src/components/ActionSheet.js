import React, { useMemo, useRef, useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';

/**
 * Themed bottom sheet of actions, used for the long-press menu on a post.
 *
 * `options` is [{ key, label, icon, hint, tone }] where tone is 'default' or
 * 'danger'. `onSelect` receives the key; closing is left to the caller so it
 * can run a confirmation first.
 */
export default function ActionSheet({ visible, title, subtitle, options = [], onSelect, onClose }) {
  const insets = useSafeAreaInsets();
  const { t, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(t, isDark), [t, isDark]);
  const anim = useRef(new Animated.Value(0)).current;

  // The sheet springs up while the backdrop blurs in behind it.
  useEffect(() => {
    Animated.spring(anim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      friction: 9,
      tension: 80,
    }).start();
  }, [visible, anim]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        {/* Blurred, dimmed backdrop. The tint keeps contrast if blur is weak. */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim }]} pointerEvents="none">
          <BlurView intensity={24} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.tint]} />
        </Animated.View>

        {/* Tapping anywhere outside the sheet closes it. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 12) + 6 },
            {
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [70, 0] }) }],
            },
          ]}
        >
          <View style={styles.grabber} />

          {title ? (
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          ) : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={styles.list}>
            {options.map((o, i) => {
              const danger = o.tone === 'danger';
              return (
                <Pressable
                  key={o.key}
                  onPress={() => onSelect(o.key)}
                  style={({ pressed }) => [
                    styles.row,
                    i < options.length - 1 && styles.rowBorder,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <View style={[styles.iconWrap, danger && styles.iconWrapDanger]}>
                    <Icon name={o.icon} size={17} color={danger ? t.danger : t.primary} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.label, danger && { color: t.danger }]}>{o.label}</Text>
                    {o.hint ? <Text style={styles.hint}>{o.hint}</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function makeStyles(t, isDark) {
  return StyleSheet.create({
    tint: { backgroundColor: isDark ? 'rgba(0,0,0,0.42)' : 'rgba(23,27,29,0.22)' },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: t.page,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingHorizontal: 16,
      paddingTop: 10,
      borderTopWidth: isDark ? 1 : 0,
      borderTopColor: t.hairline,
    },
    grabber: {
      alignSelf: 'center',
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.borderSoft,
      marginBottom: 14,
    },
    title: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3, color: t.text, paddingHorizontal: 4 },
    subtitle: { fontSize: 12, color: t.textMuted, marginTop: 3, paddingHorizontal: 4 },

    list: {
      marginTop: 14,
      backgroundColor: t.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: t.borderSoft,
      overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 14, paddingVertical: 13 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: t.hairline },
    rowPressed: { backgroundColor: t.field },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: t.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapDanger: { backgroundColor: t.dangerSoft },
    label: { fontSize: 14.5, fontWeight: '600', letterSpacing: -0.2, color: t.text },
    hint: { fontSize: 11.5, color: t.textMuted, marginTop: 2 },

    cancel: {
      marginTop: 10,
      borderRadius: 999,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderSoft,
    },
    cancelText: { fontSize: 14, fontWeight: '600', color: t.textMuted },
  });
}
