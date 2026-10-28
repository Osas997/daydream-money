import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/tokens';
import { typography } from '../../theme/typography';

interface HeadingProps {
  eyebrow?: string;
  title: string;
  variant?: 'display' | 'headline' | 'small';
  style?: ViewStyle;
  rightAction?: React.ReactNode;
}

export function Heading({
  eyebrow,
  title,
  variant = 'headline',
  style,
  rightAction,
}: HeadingProps) {
  const getTitleStyle = () => {
    switch (variant) {
      case 'display':
        return typography.displayMd;
      case 'small':
        return typography.headlineSm;
      case 'headline':
      default:
        return styles.title;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        {eyebrow && <Text style={[typography.labelUppercase, styles.eyebrow]}>{eyebrow}</Text>}
        <Text style={[getTitleStyle(), styles.title]}>{title}</Text>
      </View>
      {rightAction && <View style={styles.actionContainer}>{rightAction}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  textContainer: {
    flex: 1,
  },
  eyebrow: {
    marginBottom: 4,
    color: colors.onSurfaceMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  title: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: '500',
  },
  actionContainer: {
    marginLeft: 12,
    marginBottom: 2,
  },
});
