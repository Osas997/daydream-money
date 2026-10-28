import React from 'react';
import { StyleSheet, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { pageGradient } from '../theme/tokens';

interface PageGradientProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function PageGradient({ children, style }: PageGradientProps) {
  return (
    <LinearGradient
      colors={[pageGradient.colors[0], pageGradient.colors[1], pageGradient.colors[2]]}
      start={pageGradient.start}
      end={pageGradient.end}
      style={[
        styles.container,
        Platform.OS === 'web' ? ({ minHeight: '100vh' } as any) : undefined,
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
