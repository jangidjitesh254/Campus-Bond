import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, TouchableOpacity, Keyboard, BackHandler, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, TextInput } from './Text';
import { SearchBody } from '../screens/SearchScreen';
import { useTheme, useStyles } from '../context/ThemeContext';

const SIDE = 16;
const BAR_H = 40;
const CANCEL_W = 64;

/**
 * In-place search for Home. The search pill in the feed doesn't jump to
 * another screen: it glides up to the top of the screen, a Cancel button
 * fades in beside it, the keyboard comes up and the results appear
 * underneath. Cancel (or Android back) glides it back into the feed.
 *
 *   <SearchOverlay open={open} from={pillRect} onClose={…} goTab={goTab} />
 *
 * `from` is the pill's frame as measured in the parent: { y, width }.
 */
export default function SearchOverlay({ open, from, onClose, goTab }) {
  const { t: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { width } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current; // native: the bar's position
  const widthAnim = useRef(new Animated.Value(0)).current; // JS: the bar's width, the sheet and result fades
  const [mounted, setMounted] = useState(false);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const topY = 8; // where the bar rests, inside the safe area
  const startY = from?.y ?? 120;
  const startW = from?.width ?? width - SIDE * 2;
  const endW = width - SIDE * 2 - CANCEL_W;

  useEffect(() => {
    const cfg = { duration: open ? 320 : 260, easing: Easing.out(Easing.cubic) };
    if (open) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(progress, { toValue: 1, ...cfg, useNativeDriver: true }),
        Animated.timing(widthAnim, { toValue: 1, ...cfg, useNativeDriver: false }),
      ]).start(() => inputRef.current?.focus());
    } else if (mounted) {
      Keyboard.dismiss();
      Animated.parallel([
        Animated.timing(progress, { toValue: 0, ...cfg, useNativeDriver: true }),
        Animated.timing(widthAnim, { toValue: 0, ...cfg, useNativeDriver: false }),
      ]).start(() => {
        setMounted(false);
        setQ('');
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Android back closes the search instead of leaving the screen.
  useEffect(() => {
    if (!open) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [open, onClose]);

  if (!mounted) return null;

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [startY - topY, 0] });
  const barWidth = widthAnim.interpolate({ inputRange: [0, 1], outputRange: [startW, endW] });
  // Fades run on the JS value: a native-only opacity on a plain View can be
  // flattened away on Android, which left the feed showing through the sheet.
  const sheetOpacity = widthAnim;
  const fade = widthAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Sheet that covers the feed */}
      <Animated.View style={[styles.sheet, { opacity: sheetOpacity }]} collapsable={false} />

      {/* Results, under the bar */}
      <Animated.View style={[styles.body, { opacity: fade }]} collapsable={false} pointerEvents={open ? 'auto' : 'none'}>
        <SearchBody q={q} goTab={(tab, params) => { onClose(); goTab(tab, params); }} onLoading={setLoading} />
      </Animated.View>

      {/* The bar itself — moves natively, its width animates on the JS side inside */}
      <Animated.View style={[styles.barRow, { transform: [{ translateY }] }]}>
        <Animated.View style={[styles.bar, { width: barWidth }]}>
          <Ionicons name="search" size={17} color={colors.textFaint} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search"
            placeholderTextColor={colors.textFaint}
            value={q}
            onChangeText={setQ}
            returnKeyType="search"
            autoCorrect={false}
          />
          {loading ? <ActivityIndicator size="small" color={colors.textMuted} /> : q ? (
            <TouchableOpacity onPress={() => { setQ(''); inputRef.current?.focus(); }} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={colors.textFaint} />
            </TouchableOpacity>
          ) : null}
        </Animated.View>
        <Animated.View style={{ opacity: fade }}>
          <TouchableOpacity style={styles.cancel} onPress={onClose} hitSlop={8}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    sheet: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.surface },
    body: { ...StyleSheet.absoluteFillObject, paddingTop: 8 + BAR_H + 8, backgroundColor: colors.surface },
    barRow: { position: 'absolute', top: 8, left: SIDE, right: SIDE, flexDirection: 'row', alignItems: 'center' },
    bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, height: BAR_H, borderRadius: 999, backgroundColor: colors.surfaceMuted },
    input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0 },
    cancel: { width: CANCEL_W, alignItems: 'flex-end', paddingVertical: 8 },
    cancelText: { fontSize: 15, fontWeight: '600', color: colors.text },
  });
