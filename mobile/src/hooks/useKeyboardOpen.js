import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Is the software keyboard on screen?
 *
 * The tab bar is absolutely positioned over the bottom of every tab screen, so
 * once Android resizes the window for the keyboard it sits right on top of
 * whatever the student is typing into. Screens use this to get out of the way.
 */
export default function useKeyboardOpen() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // iOS gets the "will" events so the bar leaves in step with the keyboard.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, () => setOpen(true));
    const hide = Keyboard.addListener(hideEvent, () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return open;
}
