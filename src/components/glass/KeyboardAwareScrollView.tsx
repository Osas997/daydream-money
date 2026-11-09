import React, { forwardRef, useCallback, useEffect, useRef } from 'react';
import { Dimensions, ScrollView, TextInput } from 'react-native';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewInstance,
  ScrollViewProps,
} from 'react-native';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';

export interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  /** Space kept between the focused input and the keyboard, in pixels. */
  keyboardMargin?: number;
}

/**
 * ScrollView that makes room for the software keyboard and scrolls the
 * focused input above it.
 *
 * Useful for full screen forms: edge-to-edge Android builds do not resize the
 * window when the keyboard opens, so the scroll content needs extra bottom
 * padding and an explicit scroll to the focused field.
 */
export const KeyboardAwareScrollView = forwardRef<
  ScrollViewInstance,
  KeyboardAwareScrollViewProps
>(function KeyboardAwareScrollView(
  {
    contentContainerStyle,
    keyboardShouldPersistTaps = 'handled',
    keyboardMargin = 24,
    onScroll,
    scrollEventThrottle = 16,
    ...props
  },
  forwardedRef
) {
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const offsetRef = useRef(0);

  const setRef = useCallback(
    (instance: ScrollViewInstance | null) => {
      scrollRef.current = instance;
      if (typeof forwardedRef === 'function') {
        forwardedRef(instance);
      } else if (forwardedRef) {
        forwardedRef.current = instance;
      }
    },
    [forwardedRef]
  );

  useEffect(() => {
    if (keyboardHeight <= 0) return;

    // Wait for the content padding to be applied before measuring.
    const timer = setTimeout(() => {
      const scrollView = scrollRef.current;
      const focusedInput = TextInput.State.currentlyFocusedInput();
      if (
        !scrollView ||
        !focusedInput ||
        typeof focusedInput.measureInWindow !== 'function'
      ) {
        return;
      }

      scrollView.measureInWindow((_x, viewportY, _width, viewportHeight) => {
        focusedInput.measureInWindow(
          (_inputX, inputY, _inputWidth, inputHeight) => {
            const windowHeight = Dimensions.get('window').height;
            const viewportBottom = viewportY + viewportHeight;
            const hiddenBehindKeyboard = Math.max(
              0,
              keyboardHeight - Math.max(0, windowHeight - viewportBottom)
            );
            const visibleBottom = viewportBottom - hiddenBehindKeyboard;
            const overflow = inputY + inputHeight + keyboardMargin - visibleBottom;

            if (overflow > 0) {
              scrollView.scrollTo({
                y: offsetRef.current + overflow,
                animated: true,
              });
            }
          }
        );
      });
    }, 80);

    return () => clearTimeout(timer);
  }, [keyboardHeight, keyboardMargin]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offsetRef.current = event.nativeEvent.contentOffset.y;
      onScroll?.(event);
    },
    [onScroll]
  );

  return (
    <ScrollView
      ref={setRef}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      onScroll={handleScroll}
      scrollEventThrottle={scrollEventThrottle}
      contentContainerStyle={[
        contentContainerStyle,
        keyboardHeight > 0 && { paddingBottom: keyboardHeight + keyboardMargin },
      ]}
      {...props}
    />
  );
});
