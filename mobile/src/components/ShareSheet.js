import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Modal, Pressable, Animated, TouchableOpacity, Share, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Text } from './Text';
import Avatar from './Avatar';
import { handleOf } from './ThreadPost';
import { useTheme, useStyles } from '../context/ThemeContext';

const CLOSE_DRAG = 90; // px of downward drag that dismisses
const CLOSE_VELOCITY = 900;

/**
 * Share bottom sheet: rises from the bottom on a spring, has a grab handle,
 * follows the finger when dragged down and dismisses past a threshold or
 * on a flick. Shows what is being shared and a row of actions.
 *
 *   <ShareSheet post={post} onClose={…} onMessage={…} />
 *
 * `post` is a feed item ({ text, body, owner, kind }); null hides the sheet.
 */
export default function ShareSheet({ post, onClose, onMessage }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const y = useRef(new Animated.Value(H)).current; // sheet offset from its resting place
  const sheetH = useRef(320);

  useEffect(() => {
    if (post) {
      setMounted(true);
      setCopied(false);
      y.setValue(H);
      Animated.spring(y, { toValue: 0, damping: 22, stiffness: 220, mass: 0.9, overshootClamping: true, useNativeDriver: true }).start();
    }
  }, [post, y, H]);

  function close(after) {
    Animated.timing(y, { toValue: H, duration: 220, useNativeDriver: true }).start(() => {
      setMounted(false);
      onClose();
      after?.();
    });
  }

  // Drag: the sheet follows the finger downwards (never up past rest).
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(8)
        .onUpdate((e) => y.setValue(Math.max(0, e.translationY)))
        .onEnd((e) => {
          if (e.translationY > CLOSE_DRAG || e.velocityY > CLOSE_VELOCITY) close();
          else Animated.spring(y, { toValue: 0, damping: 22, stiffness: 260, mass: 0.8, useNativeDriver: true }).start();
        })
        .runOnJS(true),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!mounted || !post) return null;

  const text = `${post.text}${post.body ? `\n\n${post.body}` : ''}\n\n— shared from Campus Bond`;
  const backdrop = y.interpolate({ inputRange: [0, H], outputRange: [1, 0], extrapolate: 'clamp' });

  async function copy() {
    await Clipboard.setStringAsync(text).catch(() => {});
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(true);
    setTimeout(() => close(), 600);
  }
  async function system() {
    close(async () => {
      try {
        await Share.share({ message: text });
      } catch {}
    });
  }

  const ACTIONS = [
    { key: 'copy', icon: copied ? 'checkmark' : 'link-outline', label: copied ? 'Copied' : 'Copy text', onPress: copy },
    { key: 'message', icon: 'chatbubble-outline', label: 'Message', onPress: () => close(onMessage) },
    { key: 'more', icon: 'share-outline', label: 'More…', onPress: system },
  ];

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => close()}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => close()}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdrop }]} />
      </Pressable>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[styles.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY: y }] }]}
          onLayout={(e) => { sheetH.current = e.nativeEvent.layout.height; }}
        >
          <View style={styles.handle} />

          {/* What is being shared */}
          <View style={styles.preview}>
            <Avatar name={post.owner?.name} size={40} neutral />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.previewTitle} numberOfLines={2}>{post.text}</Text>
              <Text style={styles.previewMeta} numberOfLines={1}>{handleOf(post.owner?.name)} · {post.label || 'Post'}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            {ACTIONS.map((a) => (
              <TouchableOpacity key={a.key} style={styles.action} onPress={a.onPress} activeOpacity={0.7}>
                <View style={[styles.actionIcon, a.key === 'copy' && copied && styles.actionIconDone]}>
                  <Ionicons name={a.icon} size={24} color={a.key === 'copy' && copied ? colors.onPrimary : colors.text} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancel} onPress={() => close()} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
}

const makeStyles = (colors, isDark) =>
  StyleSheet.create({
    backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 16,
      paddingTop: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: isDark ? 0.5 : 0.12,
      shadowRadius: 16,
      elevation: 20,
    },
    handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.surfaceHi, marginBottom: 14 },
    preview: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.surfaceMuted },
    previewTitle: { fontSize: 14.5, fontWeight: '700', color: colors.text, lineHeight: 19 },
    previewMeta: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
    actions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20 },
    action: { alignItems: 'center', gap: 8, width: 84 },
    actionIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
    actionIconDone: { backgroundColor: colors.primary },
    actionLabel: { fontSize: 12.5, fontWeight: '600', color: colors.text },
    cancel: { alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: colors.surfaceMuted },
    cancelText: { fontSize: 15, fontWeight: '700', color: colors.text },
  });
