import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Modal, Pressable, Animated, Easing, TouchableOpacity } from 'react-native';
import { Text } from './Text';
import { Ghost } from './Mascot';
import { shadow } from '../theme';
import { useTheme, useStyles } from '../context/ThemeContext';

/**
 * Themed confirm dialog (replaces Alert.alert for yes/no questions).
 *
 *   <Confirm
 *     visible={ask}
 *     title="Discard post?"
 *     message="Your draft will be lost."
 *     confirmText="Discard"
 *     destructive
 *     onConfirm={() => …}
 *     onCancel={() => setAsk(false)}
 *   />
 *
 * Pops in with a spring, the ghost pulls a face to match (`mood`).
 */
export default function Confirm({ visible, title, message, confirmText = 'OK', cancelText = 'Cancel', destructive, mood, onConfirm, onCancel }) {
  const styles = useStyles(makeStyles);
  const [mounted, setMounted] = useState(visible);
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      t.setValue(0);
      Animated.spring(t, { toValue: 1, friction: 7, tension: 120, useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(t, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => setMounted(false));
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null;
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: t }]} />
      </Pressable>

      <View style={styles.center} pointerEvents="box-none">
        <Animated.View style={[styles.card, { opacity: t, transform: [{ translateY }, { scale }] }]}>
          <View style={styles.mascot}>
            <Ghost width={44} variant={mood || (destructive ? 'sad' : 'surprised')} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.btnGhostText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, destructive ? styles.btnDanger : styles.btnPrimary]} onPress={onConfirm} activeOpacity={0.85}>
              <Text style={styles.btnText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors, isDark) => {
  return StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(22,36,28,0.32)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { width: '100%', maxWidth: 320, borderRadius: 24, backgroundColor: colors.surface, paddingTop: 22, paddingBottom: 16, paddingHorizontal: 18, alignItems: 'center', ...shadow.card, shadowOpacity: 0.18, shadowRadius: 24, elevation: 10 },
  mascot: { marginBottom: 10 },
  title: { fontSize: 17.5, fontWeight: '700', color: colors.text, textAlign: 'center' },
  message: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20, alignSelf: 'stretch' },
  btn: { flex: 1, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { backgroundColor: colors.surfaceMuted },
  btnGhostText: { fontSize: 15, fontWeight: '600', color: colors.text },
  btnPrimary: { backgroundColor: colors.primary },
  btnDanger: { backgroundColor: colors.danger },
  btnText: { fontSize: 15, fontWeight: '700', color: colors.onPrimary },
});
};
