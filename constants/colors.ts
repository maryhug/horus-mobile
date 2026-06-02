export const darkColors = {
  background: '#0E0F1A',
  surface: '#181928',
  surfaceElevated: '#1C1E32',
  border: '#252640',
  borderLight: '#303358',

  spaceIndigo: '#1A1B30',
  lavenderGrey: '#6B7299',
  platinum: '#EEF2FF',
  strawberryRed: '#FF6B9D',
  flagRed: '#D90429',

  textPrimary: '#EEF2FF',
  textSecondary: '#6B7299',
  textMuted: '#404468',

  // Accent (coral/pink as primary)
  accent: '#FF6B9D',
  accentDark: '#E0457F',
  accentLight: '#FF8DC7',
  accent10: 'rgba(255, 107, 157, 0.10)',
  accent20: 'rgba(255, 107, 157, 0.20)',

  grey10: 'rgba(107, 114, 153, 0.10)',
  grey20: 'rgba(107, 114, 153, 0.20)',

  success: '#34D399',
  warning: '#FCD34D',
  danger: '#FF6B9D',

  // Vibrant palette
  coral:     '#FF6B9D',
  ocean:     '#4B8EF0',
  tangerine: '#FF8C42',
  mint:      '#34D399',
  grape:     '#A78BFA',
  sunshine:  '#FCD34D',

  // Legacy aliases (keep for compatibility)
  cyan: '#4B8EF0',
  cyan10: 'rgba(75, 142, 240, 0.10)',
  cyan20: 'rgba(75, 142, 240, 0.20)',
  cyanDark: '#3072D6',
  cyanMid: '#6AA5F4',
  cyanLight: '#9EC4F8',
};

export const lightColors: typeof darkColors = {
  background: '#F7F8FF',
  surface: '#FFFFFF',
  surfaceElevated: '#F0F2FF',
  border: '#E8EAF6',
  borderLight: '#D8DBF0',

  spaceIndigo: '#1A1B30',
  lavenderGrey: '#8891B8',
  platinum: '#1A1B30',
  strawberryRed: '#FF6B9D',
  flagRed: '#D90429',

  textPrimary: '#1A1B30',
  textSecondary: '#5C6480',
  textMuted: '#9BA5C8',

  accent: '#FF6B9D',
  accentDark: '#E0457F',
  accentLight: '#FF8DC7',
  accent10: 'rgba(255, 107, 157, 0.08)',
  accent20: 'rgba(255, 107, 157, 0.16)',

  grey10: 'rgba(26, 27, 48, 0.05)',
  grey20: 'rgba(26, 27, 48, 0.10)',

  success: '#10B981',
  warning: '#D97706',
  danger: '#FF6B9D',

  // Vibrant palette
  coral:     '#FF6B9D',
  ocean:     '#4B8EF0',
  tangerine: '#FF8C42',
  mint:      '#10B981',
  grape:     '#8B5CF6',
  sunshine:  '#D97706',

  // Legacy aliases
  cyan: '#4B8EF0',
  cyan10: 'rgba(75, 142, 240, 0.08)',
  cyan20: 'rgba(75, 142, 240, 0.16)',
  cyanDark: '#3072D6',
  cyanMid: '#6AA5F4',
  cyanLight: '#9EC4F8',
};

export type AppColors = typeof darkColors;

export const Colors = darkColors;
