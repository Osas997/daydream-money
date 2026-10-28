import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/tokens';
import { fontFamilies } from '../../theme/typography';
import { AppIcon } from '../../theme/icons';

interface CustomKeypadProps {
  onDigitPress: (digit: string) => void;
  onBackspacePress: () => void;
  onShortcutPress?: (suffix: string) => void;
  onClear?: () => void;
  variant?: 'money' | 'pin';
}

interface KeyProps {
  label?: string;
  onPress: () => void;
  isAction?: boolean;
  icon?: React.ReactNode;
}

function Key({ label, onPress, isAction = false, icon }: KeyProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.key,
        isAction && styles.actionKey,
        pressed && styles.keyPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label || 'key'}
    >
      {icon || (
        <Text style={[styles.keyText, isAction && styles.actionText]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function CustomKeypad({
  onDigitPress,
  onBackspacePress,
  onShortcutPress,
  onClear,
  variant = 'money',
}: CustomKeypadProps) {
  return (
    <View style={styles.container}>
      {variant === 'money' && (
        <View style={styles.row}>
          <Key label="rb" isAction onPress={() => onShortcutPress?.('rb')} />
          <Key label="jt" isAction onPress={() => onShortcutPress?.('jt')} />
          <Key label="k" isAction onPress={() => onShortcutPress?.('k')} />
          <Key
            label="C"
            isAction
            onPress={() => (onClear ? onClear() : onBackspacePress())}
          />
        </View>
      )}

      {/* Row 1: 1 2 3 */}
      <View style={styles.row}>
        <Key label="1" onPress={() => onDigitPress('1')} />
        <Key label="2" onPress={() => onDigitPress('2')} />
        <Key label="3" onPress={() => onDigitPress('3')} />
      </View>

      {/* Row 2: 4 5 6 */}
      <View style={styles.row}>
        <Key label="4" onPress={() => onDigitPress('4')} />
        <Key label="5" onPress={() => onDigitPress('5')} />
        <Key label="6" onPress={() => onDigitPress('6')} />
      </View>

      {/* Row 3: 7 8 9 */}
      <View style={styles.row}>
        <Key label="7" onPress={() => onDigitPress('7')} />
        <Key label="8" onPress={() => onDigitPress('8')} />
        <Key label="9" onPress={() => onDigitPress('9')} />
      </View>

      {/* Row 4: decimal / clear, 0, backspace */}
      <View style={styles.row}>
        {variant === 'money' ? (
          <Key label="," onPress={() => onDigitPress(',')} />
        ) : (
          <Key label="C" isAction onPress={() => onClear?.()} />
        )}
        <Key label="0" onPress={() => onDigitPress('0')} />
        <Key
          onPress={onBackspacePress}
          icon={<AppIcon name="close" size={20} color={colors.onSurface} strokeWidth={2} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  key: {
    flex: 1,
    height: 44,
    marginHorizontal: 3,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionKey: {
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DFE5F8',
    borderColor: 'rgba(215, 225, 250, 0.9)',
  },
  keyPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  keyText: {
    fontSize: 20,
    fontFamily: fontFamilies.regular,
    color: colors.onSurface,
  },
  actionText: {
    fontSize: 14,
    fontFamily: fontFamilies.semiBold,
    color: colors.primary,
  },
});
