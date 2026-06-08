// Paleta Horus — light y dark (basada en horus-guardian oklch values)
export const LIGHT = {
  BG:       '#F9F6ED',
  CARD:     '#FFFFFF',
  PRIMARY:  '#1A1512',
  MUTED:    '#8C7F6E',
  MUTED_BG: '#F3EFE7',
  BORDER:   '#E8E2D8',
  // colores de acento — igual en ambos modos
  GREEN:    '#96C979',
  GREEN_FG: '#1A3D0A',
  YELLOW:   '#FAD957',
  YELLOW_FG:'#3D2C00',
  BLUE:     '#A5CCF4',
  BLUE_FG:  '#1A3A5C',
  PINK:     '#FAB2D3',
  PINK_FG:  '#7A1A3A',
  RED:      '#C0392B',
  RED_BG:   '#FDECEA',
};

export const DARK = {
  BG:       '#1A1510',
  CARD:     '#252018',
  PRIMARY:  '#F5EFE6',
  MUTED:    '#A89880',
  MUTED_BG: '#302820',
  BORDER:   '#3A3028',
  // colores de acento — igual en ambos modos
  GREEN:    '#96C979',
  GREEN_FG: '#1A3D0A',
  YELLOW:   '#FAD957',
  YELLOW_FG:'#3D2C00',
  BLUE:     '#A5CCF4',
  BLUE_FG:  '#1A3A5C',
  PINK:     '#FAB2D3',
  PINK_FG:  '#7A1A3A',
  RED:      '#E05050',
  RED_BG:   '#3D1A1A',
};

export type AppTheme = typeof LIGHT;
