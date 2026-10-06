import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Ember & Oak design tokens. Every screen pulls colours, type, spacing, radii
 * and shadows from here — no ad-hoc values in components.
 */

export const colors = {
  // Brand
  cream: '#F8F4EE',
  warmWhite: '#FFF8F0',
  white: '#FFFFFF',
  espresso: '#1F1A17',
  caramel: '#C68B59',
  beige: '#DDB892',
  gold: '#B98D57',

  // Text
  text: '#2C2420',
  textMuted: '#6F6158',
  textSubtle: '#9A8B80',
  textOnDark: '#FFF8F0',
  textOnDarkMuted: 'rgba(255, 248, 240, 0.72)',
  /** Accessible caramel for small text on cream (≥4.5:1). */
  accentText: '#8A5A33',

  // Surfaces & lines
  background: '#F8F4EE',
  surface: '#FFFFFF',
  surfaceAlt: '#F1EAE0',
  border: '#E8DED2',
  borderStrong: '#D6C7B6',
  overlay: 'rgba(31, 26, 23, 0.45)',

  // States
  success: '#3F7D58',
  successBg: '#E6F1EA',
  danger: '#B4483C',
  dangerBg: '#F8E7E4',
  warning: '#B7791F',
  warningBg: '#FBF0DC',
  veg: '#2E7D32',
  nonVeg: '#A33A2B',
  skeleton: '#EDE4D8',
  skeletonHighlight: '#F7F1E9',
} as const;

export const fonts = {
  serif: 'CormorantGaramond_600SemiBold',
  serifBold: 'CormorantGaramond_700Bold',
  serifItalic: 'CormorantGaramond_500Medium_Italic',
  sans: 'Manrope_500Medium',
  sansRegular: 'Manrope_400Regular',
  sansSemiBold: 'Manrope_600SemiBold',
  sansBold: 'Manrope_700Bold',
  sansExtraBold: 'Manrope_800ExtraBold',
} as const;

export const typography = {
  display: { fontFamily: fonts.serifBold, fontSize: 40, lineHeight: 42, letterSpacing: -0.5 },
  h1: { fontFamily: fonts.serifBold, fontSize: 32, lineHeight: 36, letterSpacing: -0.3 },
  h2: { fontFamily: fonts.serifBold, fontSize: 26, lineHeight: 30 },
  h3: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 25 },
  title: { fontFamily: fonts.sansBold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
  bodySm: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19 },
  caption: { fontFamily: fonts.sansSemiBold, fontSize: 12, lineHeight: 16 },
  overline: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  price: { fontFamily: fonts.sansExtraBold, fontSize: 16, lineHeight: 22 },
  priceLg: { fontFamily: fonts.sansExtraBold, fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  button: { fontFamily: fonts.sansBold, fontSize: 15, lineHeight: 20, letterSpacing: 0.2 },
  serifItalic: { fontFamily: fonts.serifItalic, fontSize: 18, lineHeight: 24 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

/** Horizontal page gutter. */
export const gutter = spacing.xl;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

const shadow = (elevation: number, opacity: number, blur: number, y: number): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.espresso,
      shadowOpacity: opacity,
      shadowRadius: blur,
      shadowOffset: { width: 0, height: y },
    },
    default: { elevation },
  }) ?? {};

export const shadows = {
  sm: shadow(2, 0.06, 6, 2),
  md: shadow(5, 0.1, 14, 6),
  lg: shadow(10, 0.16, 24, 12),
} as const;

export const motion = {
  fast: 160,
  base: 240,
  slow: 420,
  spring: { damping: 18, stiffness: 220, mass: 0.8 },
  pressScale: 0.97,
} as const;

/** Minimum accessible touch target. */
export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;
export const TOUCH_TARGET = 44;
