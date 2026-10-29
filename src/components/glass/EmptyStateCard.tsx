import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadow } from '../../theme/tokens';
import { fontFamilies } from '../../theme/typography';
import { AppIcon, IconName } from '../../theme/icons';

interface EmptyStateCardProps {
  icon?: IconName;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyStateCard({
  icon = 'search',
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
}: EmptyStateCardProps) {
  const handleActionPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onAction?.();
  };

  return (
    <View style={[styles.card, shadow.card, style]}>
      <View style={styles.iconBadge}>
        <AppIcon name={icon} size={28} color={colors.primary} strokeWidth={2} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={handleActionPress}
          style={({ pressed }) => [
            styles.actionBtn,
            pressed && styles.actionBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(129, 149, 229, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontFamily: fontFamilies.bold,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    color: colors.onSurfaceMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 270,
  },
  actionBtn: {
    marginTop: 14,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  actionBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: fontFamilies.semiBold,
    color: colors.onPrimary,
  },
});
