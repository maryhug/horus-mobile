// ─────────────────────────────────────────────────────────────────────────────
// Horus Mobile — Design System Colors
// Primary accent: #7EC8D0 (teal)  — NOT the coral red
// Coral (#F55642) is reserved for danger/alerts only
// ─────────────────────────────────────────────────────────────────────────────

// ── Brand palette ──────────────────────────────────────────────────────────
export const PALETTE = {
  coral:       '#F55642',
  sage:        '#88AF6A',
  pink:        '#F7A7C3',
  teal:        '#7EC8D0',
  peach:       '#F8A97A',
  lavender:    '#CAA8D4',
  cream:       '#FAF7F0',
  slate:       '#A8C4D4',
  charcoal:    '#2E2E2E',
  mint:        '#ACD888',

  // derived
  coralDark:   '#D43E2C',
  tealDark:    '#5AB0B8',
  tealLight:   '#A8E2E8',
  sageDark:    '#6A924E',

  white:       '#FFFFFF',
  black:       '#000000',
};

// ── Per-tab identity colors (used in tab icons + section cards) ──────────
export const TAB_COLORS = {
  dashboard: { bg: '#D4F0F4', icon: '#5AB0B8' },   // teal
  monitor:   { bg: '#DFF0CC', icon: '#6A924E' },    // sage
  qr:        { bg: '#EDE0F4', icon: '#9060B8' },    // lavender
  assistant: { bg: '#FCE0EC', icon: '#C0507A' },    // pink
  files:     { bg: '#DAEAF4', icon: '#4A7898' },    // slate
  profile:   { bg: '#FDE8D4', icon: '#C0700A' },    // peach
} as const;

// ── Light theme ────────────────────────────────────────────────────────────
export const lightColors = {
  background:      PALETTE.cream,         // #FAF7F0 warm cream
  surface:         PALETTE.white,
  surfaceElevated: '#F3EEE6',

  border:      'rgba(46,46,46,0.07)',
  borderLight: 'rgba(46,46,46,0.04)',

  textPrimary:   PALETTE.charcoal,        // #2E2E2E
  textSecondary: '#5A5A6A',
  textMuted:     '#9A9AAA',

  // ── Primary accent: teal (NOT coral) ──
  accent:    PALETTE.teal,                // #7EC8D0
  accentDark: PALETTE.tealDark,
  accentLight: PALETTE.tealLight,
  accent10:  'rgba(126,200,208,0.12)',
  accent20:  'rgba(126,200,208,0.22)',

  // ── Semantic ──
  success: PALETTE.sage,                  // #88AF6A
  warning: PALETTE.peach,                 // #F8A97A
  danger:  PALETTE.coral,                 // #F55642  ← danger ONLY

  // ── Palette access ──
  coral:     PALETTE.coral,
  sage:      PALETTE.sage,
  pink:      PALETTE.pink,
  teal:      PALETTE.teal,
  peach:     PALETTE.peach,
  lavender:  PALETTE.lavender,
  slate:     PALETTE.slate,
  mint:      PALETTE.mint,

  // ── Legacy aliases (keep compatibility) ──
  spaceIndigo:    '#2B2D42',
  lavenderGrey:   '#8D99AE',
  platinum:       '#EDF2F4',
  strawberryRed:  PALETTE.coral,
  flagRed:        PALETTE.coralDark,

  grey10: 'rgba(46,46,46,0.06)',
  grey20: 'rgba(46,46,46,0.10)',

  cyan:     PALETTE.teal,
  cyan10:   'rgba(126,200,208,0.12)',
  cyan20:   'rgba(126,200,208,0.22)',
  cyanDark: PALETTE.tealDark,
  cyanMid:  PALETTE.teal,
  cyanLight: PALETTE.tealLight,
};

// ── Dark theme ─────────────────────────────────────────────────────────────
export const darkColors: typeof lightColors = {
  background:      '#18191E',
  surface:         '#22242C',
  surfaceElevated: '#2A2D38',

  border:      'rgba(255,255,255,0.07)',
  borderLight: 'rgba(255,255,255,0.04)',

  textPrimary:   '#EEEEF4',
  textSecondary: '#9090A8',
  textMuted:     '#5A5A72',

  accent:      PALETTE.teal,
  accentDark:  PALETTE.tealDark,
  accentLight: PALETTE.tealLight,
  accent10:    'rgba(126,200,208,0.14)',
  accent20:    'rgba(126,200,208,0.24)',

  success: '#7AAE60',
  warning: '#E09060',
  danger:  PALETTE.coral,

  coral:    PALETTE.coral,
  sage:     PALETTE.sage,
  pink:     PALETTE.pink,
  teal:     PALETTE.teal,
  peach:    PALETTE.peach,
  lavender: PALETTE.lavender,
  slate:    PALETTE.slate,
  mint:     PALETTE.mint,

  spaceIndigo:   '#2B2D42',
  lavenderGrey:  '#8D99AE',
  platinum:      '#EDF2F4',
  strawberryRed: PALETTE.coral,
  flagRed:       PALETTE.coralDark,

  grey10: 'rgba(180,180,200,0.08)',
  grey20: 'rgba(180,180,200,0.14)',

  cyan:     PALETTE.teal,
  cyan10:   'rgba(126,200,208,0.14)',
  cyan20:   'rgba(126,200,208,0.24)',
  cyanDark: PALETTE.tealDark,
  cyanMid:  PALETTE.teal,
  cyanLight: PALETTE.tealLight,
};

export type AppColors = typeof lightColors;

// Static fallback
export const Colors = darkColors;
