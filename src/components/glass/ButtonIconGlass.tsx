import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, shadow } from '../../theme/tokens';
import { AppIcon, IconName } from '../../theme/icons';

interface ButtonIconGlassProps {
  icon: IconName;
  onPress: () => void;
  size?: number;
  iconSize?: number;
  iconColor?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function ButtonIconGlass({
  icon,
  onPress,
  size = 42,
  iconSize = 20,
  iconColor = colors.onSurface,
  style,
  accessibilityLabel,
}: ButtonIconGlassProps) {
  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.btn,
        shadow.card,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || icon}
    >
      <AppIcon name={icon} size={iconSize} color={iconColor} strokeWidth={1.8} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});
