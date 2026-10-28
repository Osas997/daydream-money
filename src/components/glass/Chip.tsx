import React from 'react';
import { Pressable, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadow } from '../../theme/tokens';
import { fontFamilies } from '../../theme/typography';
import { AppIcon, IconName } from '../../theme/icons';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, active = false, onPress, icon, style }: ChipProps) {
  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.chipActive : styles.chipInactive,
        active ? shadow.primary : shadow.card,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {icon && (
        <AppIcon
          name={icon}
          size={15}
          color={active ? colors.onPrimary : colors.onSurfaceVariant}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          active ? styles.labelActive : styles.labelInactive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    maxHeight: 38,
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  chipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 12,
  },
  labelInactive: {
    color: colors.onSurfaceVariant,
    fontFamily: fontFamilies.medium,
  },
  labelActive: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.semiBold,
  },
});
