import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius } from '../../theme/tokens';

export interface GlassViewProps {
  children?: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'default' | 'dark';
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  borderColor?: string;
  backgroundColor?: string;
}

export function GlassView({
  children,
  intensity = 40,
  tint = 'light',
  style,
  innerStyle,
  borderRadius = radius.xl,
  borderColor = colors.glass.border,
  backgroundColor = colors.glass.card,
}: GlassViewProps) {
  const isWeb = Platform.OS === 'web';
  const isAndroid = Platform.OS === 'android';

  // Android low-end fallback or Web: alpha container
  if (isWeb) {
    return (
      <View
        style={[
          styles.base,
          {
            borderRadius,
            borderColor,
            backgroundColor: backgroundColor || colors.glass.card,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          } as any,
          style,
        ]}
      >
        <View style={innerStyle}>{children}</View>
      </View>
    );
  }

  // On Android, use slightly higher opacity alpha card if blur is noisy
  if (isAndroid) {
    return (
      <View
        style={[
          styles.base,
          {
            borderRadius,
            borderColor,
            backgroundColor,
          },
          style,
        ]}
      >
        <View style={innerStyle}>{children}</View>
      </View>
    );
  }

  // iOS native glass
  return (
    <View style={[{ borderRadius, overflow: 'hidden' }, style]}>
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[
          styles.base,
          {
            borderRadius,
            borderColor,
          },
        ]}
      >
        <View
          style={[
            {
              backgroundColor,
              borderRadius,
            },
            innerStyle,
          ]}
        >
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
