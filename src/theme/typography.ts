import { TextStyle } from 'react-native';
import { colors } from './tokens';

export const fontFamilies = {
  extraLight: 'PlusJakartaSans_200ExtraLight',
  light: 'PlusJakartaSans_300Light',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

export const typography: Record<string, TextStyle> = {
  displayLg: {
    fontFamily: fontFamilies.extraLight,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -1.08,
    color: colors.onSurface,
  },
  displayMd: {
    fontFamily: fontFamilies.light,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: colors.onSurface,
  },
  headlineMd: {
    fontFamily: fontFamilies.light,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: colors.onSurface,
  },
  headlineSm: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: colors.onSurface,
  },
  bodyMd: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.07,
    color: colors.onSurface,
  },
  bodySm: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0,
    color: colors.onSurfaceVariant,
  },
  labelMd: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.13,
    color: colors.onSurface,
  },
  labelUppercase: {
    fontFamily: fontFamilies.bold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.onSurfaceMuted,
  },
  caption: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0,
    color: colors.onSurfaceVariant,
  },
  tabLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.4,
    color: colors.onSurfaceMuted,
  },
};
