import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

const SHOW = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

/**
 * Height of the software keyboard in dp, or 0 when it is closed.
 *
 * Screens pad their bottom by this so the focused input is docked just above
 * the keyboard. We do the arithmetic ourselves rather than using
 * KeyboardAvoidingView: since Expo SDK 54 turns on Android edge-to-edge, the
 * window no longer resizes for the keyboard and KeyboardAvoidingView ends up
 * applying nothing there, leaving the input buried.
 *
 * This assumes the keyboard OVERLAYS the app (true on iOS always, and on
 * Android under edge-to-edge). If a build ever goes back to a resizing window,
 * this padding would double up.
 */
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(SHOW, (e) => setHeight(e?.endCoordinates?.height ?? 0));
    const hide = Keyboard.addListener(HIDE, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}

/** Convenience wrapper for the places that only care whether it is up. */
export default function useKeyboardOpen() {
  return useKeyboardHeight() > 0;
}
