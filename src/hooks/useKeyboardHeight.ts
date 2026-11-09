import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';
import type { KeyboardEvent } from 'react-native';

/**
 * Tracks how much of the window the software keyboard covers.
 *
 * Expo SDK 54+ ships Android apps with edge-to-edge enabled, so the system no
 * longer resizes the window when the IME opens (and `KeyboardAvoidingView` has
 * no effect). Screens and modals have to reserve room for the keyboard
 * themselves, which is what this hook provides.
 *
 * Returns `0` while the keyboard is hidden.
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleShow = (event: KeyboardEvent) => {
      const { height, screenY } = event.endCoordinates;
      const windowHeight = Dimensions.get('window').height;
      const distanceFromWindowBottom = windowHeight - screenY;

      // Android reports the IME height without the navigation bar, but with
      // edge-to-edge the app is drawn behind it. Use the keyboard's top edge
      // (screenY) to cover the whole area when it is available. iOS already
      // reports the full height.
      const coversNavigationBar =
        Platform.OS === 'android' &&
        screenY > 0 &&
        screenY < windowHeight &&
        distanceFromWindowBottom > 0;

      setKeyboardHeight(
        coversNavigationBar ? Math.max(distanceFromWindowBottom, height) : height
      );
    };
    const handleHide = () => setKeyboardHeight(0);

    const showSubscription = Keyboard.addListener(showEvent, handleShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardHeight;
}
