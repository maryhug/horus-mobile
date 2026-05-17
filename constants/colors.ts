export const darkColors = {
  background: '#14151F',
  surface: '#2B2D42',
  surfaceElevated: '#363952',
  border: '#3E4160',
  borderLight: '#4A4E6A',

  spaceIndigo: '#2B2D42',
  lavenderGrey: '#8D99AE',
  platinum: '#EDF2F4',
  strawberryRed: '#EF233C',
  flagRed: '#D90429',

  textPrimary: '#EDF2F4',
  textSecondary: '#8D99AE',
  textMuted: '#5C6480',

  accent: '#EF233C',
  accentDark: '#D90429',
  accentLight: '#FF4D5E',
  accent10: 'rgba(239, 35, 60, 0.10)',
  accent20: 'rgba(239, 35, 60, 0.20)',

  grey10: 'rgba(141, 153, 174, 0.10)',
  grey20: 'rgba(141, 153, 174, 0.20)',

  success: '#4CAF50',
  warning: '#FFA726',
  danger: '#EF233C',

  // aliases
  cyan: '#EF233C',
  cyan10: 'rgba(239, 35, 60, 0.10)',
  cyan20: 'rgba(239, 35, 60, 0.20)',
  cyanDark: '#D90429',
  cyanMid: '#FF4D5E',
  cyanLight: '#FF8A96',
};

export const lightColors: typeof darkColors = {
  background: '#F0F2F5',
  surface: '#FFFFFF',
  surfaceElevated: '#F5F6FA',
  border: '#E0E4EF',
  borderLight: '#CDD2DE',

  spaceIndigo: '#2B2D42',
  lavenderGrey: '#8D99AE',
  platinum: '#EDF2F4',
  strawberryRed: '#EF233C',
  flagRed: '#D90429',

  textPrimary: '#2B2D42',
  textSecondary: '#5C6880',
  textMuted: '#9BA5BC',

  accent: '#EF233C',
  accentDark: '#D90429',
  accentLight: '#FF4D5E',
  accent10: 'rgba(239, 35, 60, 0.08)',
  accent20: 'rgba(239, 35, 60, 0.16)',

  grey10: 'rgba(43, 45, 66, 0.05)',
  grey20: 'rgba(43, 45, 66, 0.10)',

  success: '#388E3C',
  warning: '#F57C00',
  danger: '#EF233C',

  // aliases
  cyan: '#EF233C',
  cyan10: 'rgba(239, 35, 60, 0.08)',
  cyan20: 'rgba(239, 35, 60, 0.16)',
  cyanDark: '#D90429',
  cyanMid: '#FF4D5E',
  cyanLight: '#FF8A96',
};

export type AppColors = typeof darkColors;

// Static fallback for files that haven't migrated yet
export const Colors = darkColors;
