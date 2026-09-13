import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Animated, Easing, Dimensions } from 'react-native';

/**
 * Tracks the software keyboard.
 *   const { visible, height, progress } = useKeyboard();
 * `progress` is an Animated.Value that eases 0 → 1 as the keyboard opens, so
 * screens can collapse headers / shrink mascots in sync with it.
 */
export default function useKeyboard() {
  const [visible, setVisible] = useState(false);
  const [height, setHeight] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // iOS gives "will" events (animate alongside the keyboard); Android only "did".
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const animate = (to, duration) =>
      Animated.timing(progress, { toValue: to, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();

    const s = Keyboard.addListener(showEvt, (e) => {
      setVisible(true);
      setHeight(e.endCoordinates?.height ?? 0);
      animate(1, e.duration || 220);
    });
    const h = Keyboard.addListener(hideEvt, (e) => {
      setVisible(false);
      setHeight(0);
      animate(0, e?.duration || 200);
    });
    return () => {
      s.remove();
      h.remove();
    };
  }, [progress]);

  return { visible, height, progress };
}

/**
 * Scroll `scrollRef` (a ScrollView) so that `inputRef` (a TextInput) sits just
 * above the keyboard. `reserved` is the height of anything pinned between the
 * scroll area and the keyboard (e.g. a bottom button bar); `offset` is the
 * ScrollView's current scroll position.
 */
export function scrollInputAboveKeyboard({ inputRef, scrollRef, keyboardHeight, reserved = 0, offset = 0, gap = 12 }) {
  const input = inputRef?.current;
  const scroll = scrollRef?.current;
  if (!input || !scroll || !keyboardHeight) return;
  input.measureInWindow((_x, y, _w, h) => {
    const limit = Dimensions.get('window').height - keyboardHeight - reserved - gap;
    const overflow = y + h - limit;
    if (overflow > 0) scroll.scrollTo({ y: offset + overflow, animated: true });
  });
}
