import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme/tokens';

interface ButtonTextProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function ButtonText({ label, onPress, style, textStyle }: ButtonTextProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  text: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
});
