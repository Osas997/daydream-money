import React from 'react';
import { Pressable, Text, StyleSheet, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadow } from '../../theme/tokens';
import { typography, fontFamilies } from '../../theme/typography';
import { AppIcon, IconName } from '../../theme/icons';

interface ButtonSecondaryProps {
  label: string;
  icon: IconName;
  onPress: () => void;
  iconBgColor?: string;
  iconColor?: string;
  style?: ViewStyle;
}

export function ButtonSecondary({
  label,
  icon,
  onPress,
  iconBgColor = 'rgba(129, 149, 229, 0.15)',
  iconColor = colors.primary,
  style,
}: ButtonSecondaryProps) {
  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.card, shadow.card]}>
        <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
          <AppIcon name={icon} size={22} color={iconColor} strokeWidth={2} />
        </View>
        <Text style={[typography.bodySm, styles.label]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    color: colors.onSurface,
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: -0.2,
    fontFamily: fontFamilies.medium,
  },
});
