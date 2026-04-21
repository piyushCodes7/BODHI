// ─────────────────────────────────────────────────────────────
//  BODHI Design Tokens — extracted from Stitch HTML + DESIGN.md
// ─────────────────────────────────────────────────────────────

export const Colors = {
  // ── Core Brand ──────────────────────────────────────────────
  neonLime:        '#d1fc00',  // primary-fixed — CTAs, highlights
  neonLimeDim:     '#c4ec00',  // primary-fixed-dim
  neonLimeDark:    '#516200',  // primary — text on light
  electricViolet:  '#702ae1',  // secondary — gradient anchor
  hotPink:         '#f74b6d',  // error-container — gradient tail
  magenta:         '#a400a4',  // tertiary — gradient mid

  // ── Gradient (Signature Neon) ────────────────────────────────
  gradientStart:   '#702ae1',
  gradientMid:     '#a400a4',
  gradientEnd:     '#f74b6d',

  // ── Surfaces (Light Mode) ───────────────────────────────────
  surface:         '#f6f6fb',  // page background
  surfaceLow:      '#f0f0f6',  // cards / pods
  surfaceHigh:     '#e1e2e8',
  surfaceHighest:  '#dbdde3',
  surfaceContainer:'#e7e8ee',
  surfaceWhite:    '#ffffff',
  surfaceDim:      '#d2d4db',

  // ── Surfaces (Dark Mode) ────────────────────────────────────
  darkBase:        '#0c0e12',  // inverse-surface / dark bg
  darkCard:        'rgba(255,255,255,0.04)',

  // ── Text ────────────────────────────────────────────────────
  textPrimary:     '#2d2f33',  // on-surface
  textSecondary:   '#5a5b60',  // on-surface-variant
  textMuted:       '#acadb1',  // outline-variant
  textOnNeon:      '#3c4a00',  // on-primary-fixed

  // ── Semantic ────────────────────────────────────────────────
  errorRed:        '#b41340',
  secondaryContainer: '#dcc9ff',
  onSecondaryContainer: '#5b00c7',

  // ── Glassmorphism ────────────────────────────────────────────
  glassLight:      'rgba(255,255,255,0.60)',
  glassDark:       'rgba(255,255,255,0.03)',
  glassBorder:     'rgba(255,255,255,0.10)',

  // ── Tab Bar ──────────────────────────────────────────────────
  tabInactive:     '#8a8c91',
  tabActive:       '#702ae1',
  tabDark:         '#9ca3af',  // slate-400 in dark screens

  // ── Missing Semantic & Background Colors ─────────────────────
  danger:          '#ff3b30',
  success:         '#34c759',
  bgSurface:       '#f6f6fb',
  bgCard:          '#ffffff',
  bgGlassBorder:   'rgba(255,255,255,0.10)',
  divider:         '#e1e2e8',
  textInverse:     '#ffffff',
  bgDeep:          '#05001F',
  neonLimeSubtle: '#eaff80',
  neonCyan: '#00f2fe',
} as const;

export const Fonts = {
  headline: 'SpaceGrotesk',       // Big numbers, hero text
  body:     'Manrope',            // Body copy, descriptions
  label:    'PlusJakartaSans',    // Micro labels, chips, tabs
} as const;

export const Radius = {
  sm:   8,
  md:   16,   // default
  lg:   24,   // cards — main card radius
  xl:   32,
  full: 9999,
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl: 32,
  px:  6,
} as const;

export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  26,
  xxxl: 34,
  hero: 44,
} as const;

export const Shadow = {
  neonLime: {
    shadowColor:   '#d1fc00',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius:  20,
    elevation:     12,
  },
  neonViolet: {
    shadowColor:   '#702ae1',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius:  24,
    elevation:     10,
  },
  card: {
    shadowColor:   '#2d2f33',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius:  40,
    elevation:     4,
  },
} as const;

// Gradient definitions (pass to LinearGradient)
export const Gradients = {
  signatureNeon: {
    colors: ['#702ae1', '#a400a4', '#f74b6d'],
    start:  { x: 0, y: 0 },
    end:    { x: 1, y: 1 },
  },
  neonLimeRadial: ['#d1fc00', '#465600'], // used in orb/AI brain
  darkAmbient: {
    colors: ['#0c0e12', '#12121e'],
    start:  { x: 0, y: 0 },
    end:    { x: 0, y: 1 },
  },
} as const;

