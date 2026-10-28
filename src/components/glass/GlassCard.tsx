import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../../theme/tokens';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  padding?: number;
}

export function GlassCard({
  children,
  style,
  innerStyle,
  borderRadius = radius.lg,
  padding = spacing.lg,
}: GlassCardProps) {
  return (
    <View style={[styles.card, { borderRadius }, shadow.card, style]}>
      <View style={[{ padding }, innerStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
    overflow: 'hidden',
  },
});
