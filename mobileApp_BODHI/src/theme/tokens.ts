// ─────────────────────────────────────────────────────────────
//  BODHI Design Tokens — Premium Sports-Tech Luxury Theme
//  Cinematic · High-contrast · AMOLED Black · Warm Gradients
// ─────────────────────────────────────────────────────────────

export const Colors = {
  // ── Core Brand ──────────────────────────────────────────────
  neonLime:        '#FFE600',  // primary highlight — warm yellow
  neonLimeDim:     '#E6CF00',  // muted yellow
  neonLimeDark:    '#8B7700',  // text on light backgrounds
  electricViolet:  '#FF5A00',  // secondary — fiery orange (replaces violet)
  hotPink:         '#FF2D2D',  // error/danger — cinematic red
  magenta:         '#9B111E',  // deep crimson for gradient mids
  neonGreen:       '#FFB000',  // warm amber for specific CTAs

  // ── Gradient (Signature Cinematic) ──────────────────────────
  gradientStart:   '#2B0000',  // deep blood
  gradientMid:     '#8B0000',  // dark crimson
  gradientEnd:     '#FF4D00',  // fiery orange

  // ── Surfaces (Light Mode — preserved for potential light mode) ──
  surface:         '#f6f6fb',
  surfaceLow:      '#f0f0f6',
  surfaceHigh:     '#e1e2e8',
  surfaceHighest:  '#dbdde3',
  surfaceContainer:'#e7e8ee',
  surfaceWhite:    '#ffffff',
  surfaceDim:      '#d2d4db',

  // ── Surfaces (Dark Mode — Premium Black) ────────────────────
  darkBase:        '#050505',  // AMOLED-optimized true black
  darkCard:        'rgba(255,255,255,0.04)',

  // ── Text ────────────────────────────────────────────────────
  textPrimary:     '#FFFFFF',  // on-surface (dark mode primary)
  textSecondary:   'rgba(255,255,255,0.75)',
  textMuted:       'rgba(255,255,255,0.45)',
  textOnNeon:      '#000000',  // text on yellow/orange CTAs

  // ── Semantic ────────────────────────────────────────────────
  errorRed:        '#FF2D2D',
  green:           '#34c759',
  secondaryContainer: '#3A1500',
  onSecondaryContainer: '#FF6A00',

  // ── Glassmorphism ────────────────────────────────────────────
  glassLight:      'rgba(255,255,255,0.08)',
  glassDark:       'rgba(15,15,15,0.92)',
  glassBorder:     'rgba(255,255,255,0.08)',

  // ── Tab Bar ──────────────────────────────────────────────────
  tabInactive:     'rgba(255,255,255,0.35)',
  tabActive:       '#FF5A00',
  tabDark:         'rgba(255,255,255,0.45)',

  // ── Extended Palette ─────────────────────────────────────────
  danger:          '#FF2D2D',
  success:         '#34c759',
  bgSurface:       '#050505',
  bgCard:          'rgba(15,15,15,0.92)',
  bgGlassBorder:   'rgba(255,255,255,0.05)',
  divider:         'rgba(255,255,255,0.06)',
  textInverse:     '#000000',
  bgDeep:          '#000000',
  neonLimeSubtle:  '#FFE680',
  neonCyan:        '#FF6A00',  // orange accent (replaces cyan)

  // ── New Premium Colors ───────────────────────────────────────
  orange:          '#FF6A00',
  warmYellow:      '#FFE600',
  crimson:         '#9B111E',
  bloodRed:        '#8B0000',
  accentBlue:      '#3D4DFF',
  amber:           '#FFB000',
  cardBg:          'rgba(15,15,15,0.92)',
  cardBorder:      'rgba(255,255,255,0.05)',

  // ── Backwards compat aliases ────────────────────────────────
  purple:          '#FF5A00',  // remapped to orange
  bg:              '#000000',
} as const;

export const Fonts = {
  headline: 'SpaceGrotesk',       // Big numbers, hero text
  body:     'Manrope',            // Body copy, descriptions
  label:    'PlusJakartaSans',    // Micro labels, chips, tabs
} as const;

export const Radius = {
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  36,   // premium card radius
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
    shadowColor:   '#FFE600',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius:  20,
    elevation:     12,
  },
  neonViolet: {
    shadowColor:   '#FF5A00',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius:  24,
    elevation:     10,
  },
  card: {
    shadowColor:   '#FF5A00',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius:  40,
    elevation:     4,
  },
  warmGlow: {
    shadowColor:   '#FF5A00',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius:  30,
    elevation:     8,
  },
} as const;

// Gradient definitions (pass to LinearGradient)
export const Gradients = {
  signatureNeon: {
    colors: ['#2B0000', '#8B0000', '#FF4D00'],
    start:  { x: 0, y: 0 },
    end:    { x: 1, y: 1 },
  },
  neonLimeRadial: ['#FFE600', '#8B7700'], // warm yellow orb
  darkAmbient: {
    colors: ['#000000', '#1A0000', '#2B0000'],
    start:  { x: 0, y: 0 },
    end:    { x: 1, y: 1 },
  },
  darkVibrant: {
    colors: ['#000000', '#0A0000', '#1A0000'],
    start:  { x: 0, y: 0 },
    end:    { x: 1, y: 1 },
  },
  authCTA: {
    colors: ['#FF5A00', '#FFB000'],
    start:  { x: 0, y: 0 },
    end:    { x: 1, y: 0 },
  },
  heroWarm: {
    colors: ['#2B0000', '#8B0000', '#FF4D00', '#FFB000'],
    start:  { x: 0, y: 0 },
    end:    { x: 1, y: 1 },
  },
  premiumCard: {
    colors: ['rgba(255,90,0,0.15)', 'rgba(255,90,0,0.02)'],
    start:  { x: 0, y: 0 },
    end:    { x: 1, y: 1 },
  },
} as const;
