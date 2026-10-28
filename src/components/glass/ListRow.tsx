import React from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radius, shadow } from '../../theme/tokens';
import { typography, fontFamilies } from '../../theme/typography';
import { AppIcon, IconName } from '../../theme/icons';

interface ListRowProps {
  title: string;
  subtitle?: string;
  nominal?: string;
  nominalType?: 'expense' | 'income' | 'neutral';
  icon?: IconName | string;
  iconBgColor?: string;
  iconColor?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  badge?: string;
}

export function ListRow({
  title,
  subtitle,
  nominal,
  nominalType = 'neutral',
  icon,
  iconBgColor = 'rgba(129, 149, 229, 0.15)',
  iconColor = colors.primary,
  rightElement,
  onPress,
  style,
  titleStyle,
  subtitleStyle,
  badge,
}: ListRowProps) {
  const getNominalColor = () => {
    switch (nominalType) {
      case 'income':
        return colors.primary;
      case 'expense':
        return colors.onSurface;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const content = (
    <View style={[styles.row, shadow.card, style]}>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <AppIcon name={icon} size={22} color={iconColor} strokeWidth={1.8} />
        </View>
      )}

      <View style={styles.centerCol}>
        <View style={styles.titleRow}>
          <Text style={[typography.bodyMd, styles.title, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
          {Boolean(badge && badge.trim()) && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText} numberOfLines={1}>
                {badge!.trim()}
              </Text>
            </View>
          )}
        </View>
        {subtitle ? (
          <Text
            style={[typography.caption, styles.subtitle, subtitleStyle]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightCol}>
        {nominal ? (
          <Text
            style={[
              styles.nominalText,
              { color: getNominalColor() },
              nominalType === 'income' && styles.incomeText,
            ]}
          >
            {nominal}
          </Text>
        ) : null}
        {rightElement}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  centerCol: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: colors.onSurface,
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
    flexShrink: 1,
  },
  subtitle: {
    color: colors.onSurfaceMuted,
    fontFamily: fontFamilies.regular,
    marginTop: 2,
    fontSize: 12,
  },
  badgeContainer: {
    backgroundColor: '#EEF2FD',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    flexShrink: 0,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    color: colors.primary,
    fontFamily: fontFamilies.medium,
    includeFontPadding: false,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  nominalText: {
    fontSize: 15,
    fontFamily: fontFamilies.bold,
  },
  incomeText: {
    fontFamily: fontFamilies.bold,
  },
});
