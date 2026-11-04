import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { ModalProps, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { spacing } from '../../theme/tokens';

interface KeyboardAwareModalProps {
  visible: boolean;
  onRequestClose: () => void;
  animationType?: ModalProps['animationType'];
  overlayStyle?: StyleProp<ViewStyle>;
  /** Space kept between the focused input and the bottom of the sheet. */
  keyboardMargin?: number;
  children: React.ReactNode;
}

/**
 * Bottom-sheet style modal whose content is lifted above the software keyboard.
 *
 * `KeyboardAvoidingView` is not reliable inside a `Modal` on Android and does
 * nothing at all on edge-to-edge builds. Tracking the keyboard height and
 * adding it as bottom padding always keeps the form and the focused input
 * visible.
 *
 * The sheet is also capped to the free space left above the keyboard so a tall
 * form can never push its header off the top of the screen. Content that does
 * not fit becomes scrollable, and the focused input is scrolled into view with
 * a small margin above the keyboard.
 */
export function KeyboardAwareModal({
  visible,
  onRequestClose,
  animationType = 'slide',
  overlayStyle,
  keyboardMargin = 24,
  children,
}: KeyboardAwareModalProps) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scrollOffsetRef = useRef(0);
  const contentHeightRef = useRef(0);

  // Height the modal window had before the keyboard opened. Some Android
  // versions resize the dialog window for the IME (`adjustResize`) while
  // others (edge-to-edge) leave it untouched. Comparing the current height
  // with this baseline tells us how much padding the keyboard still needs.
  const [overlayHeight, setOverlayHeight] = useState(0);
  const [baseHeight, setBaseHeight] = useState(0);

  const keyboardOpen = keyboardHeight > 0;
  const resizedBy =
    keyboardOpen && baseHeight > 0 ? Math.max(0, baseHeight - overlayHeight) : 0;
  const keyboardOverlap = keyboardOpen
    ? Math.max(0, keyboardHeight - resizedBy)
    : 0;

  const topPadding = Math.max(insets.top, spacing.sm);
  const bottomPadding = keyboardOpen
    ? keyboardOverlap + spacing.sm
    : Math.max(insets.bottom, spacing.sm);
  const maxSheetHeight = Math.max(
    0,
    overlayHeight - topPadding - bottomPadding
  );

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      setOverlayHeight(height);

      // Remember the un-keyboarded window height so `resizedBy` can tell a
      // window resize apart from the keyboard simply overlaying the content.
      if (keyboardHeight === 0) {
        setBaseHeight(height);
      }
    },
    [keyboardHeight]
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
    },
    []
  );

  const handleContentSizeChange = useCallback((_width: number, height: number) => {
    contentHeightRef.current = height;
  }, []);

  // Keep the focused field comfortably above the keyboard. The scroll view is
  // already sized to end above the keyboard, so we only scroll when needed and
  // never center the field (which would leave it looking "too high").
  useEffect(() => {
    if (!visible || keyboardOverlap <= 0 || overlayHeight <= 0) return;

    const timer = setTimeout(
      () => {
        const scrollView = scrollRef.current;
        const focusedInput = TextInput.State.currentlyFocusedInput();
        if (
          !scrollView ||
          !focusedInput ||
          typeof focusedInput.measureInWindow !== 'function'
        ) {
          return;
        }

        scrollView.measureInWindow((_x, viewportY, _w, viewportHeight) => {
          focusedInput.measureInWindow(
            (_inputX, inputY, _inputWidth, inputHeight) => {
              const visibleBottom = viewportY + viewportHeight;
              const overflow =
                inputY + inputHeight + keyboardMargin - visibleBottom;
              const offset = scrollOffsetRef.current;
              const minOffset = offset + Math.max(0, overflow);

              // Reveal the bottom of the sheet too (usually the save button)
              // so the modal does not look cut off, as long as the focused
              // input itself stays comfortably on screen.
              const contentHeight = contentHeightRef.current;
              const bottomOffset = Math.max(0, contentHeight - viewportHeight);
              const maxOffsetKeepingInputVisible =
                offset + (inputY - viewportY) - keyboardMargin;
              const targetOffset = Math.max(
                minOffset,
                Math.min(bottomOffset, maxOffsetKeepingInputVisible)
              );

              if (targetOffset > offset + 1) {
                scrollView.scrollTo({ y: targetOffset, animated: true });
              }
            }
          );
        });
      },
      Platform.OS === 'ios' ? 260 : 140
    );

    return () => clearTimeout(timer);
  }, [visible, keyboardOverlap, overlayHeight, keyboardMargin]);

  // Start each opening at the top and restore the top of the sheet once the
  // keyboard closes so the title/header is visible again.
  useEffect(() => {
    if (!visible || keyboardOverlap <= 0) {
      scrollOffsetRef.current = 0;
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [visible, keyboardOverlap]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onRequestClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View
        onLayout={handleLayout}
        style={[
          styles.overlay,
          overlayStyle,
          {
            paddingTop: topPadding,
            paddingBottom: bottomPadding,
            paddingHorizontal: spacing.sm,
          },
        ]}
      >
        <ScrollView
          ref={scrollRef}
          style={[
            styles.scroll,
            maxSheetHeight > 0 && { maxHeight: maxSheetHeight },
          ]}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
          bounces={false}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          scrollEventThrottle={16}
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
  },
});
