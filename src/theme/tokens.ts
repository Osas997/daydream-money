export const colors = {
  primary: '#8195E5',
  onPrimary: '#FFFFFF',
  surface: '#F4F5FB',
  card: '#FFFFFF',
  onSurface: '#1E2A3D',
  onSurfaceVariant: '#6B7789',
  onSurfaceMuted: '#8E98A8',
  secondary: '#E8DFD5',
  accent: '#DFE5F8',
  error: '#EB6B78',
  success: '#56C898',
  warning: '#FDB654',
  glass: {
    card: '#FFFFFF',
    chip: '#FFFFFF',
    floating: '#FFFFFF',
    header: 'rgba(255, 255, 255, 0.85)',
    surfaceSubtle: '#F4F5FB',
    borderSoft: 'rgba(226, 232, 245, 0.8)',
    border: 'rgba(226, 232, 245, 0.95)',
    borderStrong: '#E2E8F5',
  },
} as const;

export const radius = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 28,
  xl: 36,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 28,
  gutter: 20,
  section: 32,
} as const;

export const shadow = {
  card: {
    shadowColor: '#1A2433',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#1A2433',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  primary: {
    shadowColor: '#8195E5',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
} as const;

export const pageGradient = {
  colors: ['#F4F5FB', '#F4F5FB', '#F4F5FB'] as const,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
} as const;
