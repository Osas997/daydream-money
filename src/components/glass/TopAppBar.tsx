import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/tokens';
import { typography, fontFamilies } from '../../theme/typography';
import { ButtonIconGlass } from './ButtonIconGlass';
import { IconName } from '../../theme/icons';

interface TopAppBarProps {
  title?: string;
  eyebrow?: string;
  leftIcon?: IconName;
  onLeftPress?: () => void;
  rightIcon?: IconName;
  onRightPress?: () => void;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function TopAppBar({
  title,
  eyebrow,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
  rightElement,
  style,
}: TopAppBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: spacing.sm,
        },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.left}>
          {leftIcon && onLeftPress && (
            <ButtonIconGlass
              icon={leftIcon}
              onPress={onLeftPress}
              size={40}
              iconSize={20}
            />
          )}
        </View>

        <View style={styles.center}>
          {eyebrow && <Text style={typography.labelUppercase}>{eyebrow}</Text>}
          {title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>

        <View style={styles.right}>
          {rightIcon && onRightPress && (
            <ButtonIconGlass
              icon={rightIcon}
              onPress={onRightPress}
              size={40}
              iconSize={20}
            />
          )}
          {rightElement}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderSoft,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.onSurface,
    fontSize: 18,
    fontFamily: fontFamilies.semiBold,
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
  },
});
