import React from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadow, spacing } from '../../theme/tokens';
import { typography, fontFamilies } from '../../theme/typography';
import { AppIcon, IconName } from '../../theme/icons';

interface ButtonPrimaryProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function ButtonPrimary({
  label,
  onPress,
  icon,
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonPrimaryProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <View style={[shadow.primary, style]}>
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} size="small" />
        ) : (
          <>
            {icon && (
              <AppIcon
                name={icon}
                size={18}
                color={colors.onPrimary}
                style={styles.icon}
              />
            )}
            <Text style={[typography.labelMd, styles.text, textStyle]}>{label}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
  },
});
