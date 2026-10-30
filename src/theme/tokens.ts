/**
 * Fairpay design system
 * - Apple soft fills, no borders
 * - Accent neon: #b2ff24 (from logo.svg)
 * - Type: iOS SF Pro scale (Bold hierarchy)
 */
export const colors = {
  bg: '#FFFFFF',
  bgGrouped: '#F2F2F7',
  fill: '#F2F2F7',
  fillSecondary: '#E5E5EA',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  textTertiary: '#AEAEB2',
  /** Brand neon — matches src/logo.svg */
  accent: '#B2FF24',
  accentSoft: '#EEFFC8',
  accentInk: '#0A0A0A',
  green: '#34C759',
  black: '#000000',
  white: '#FFFFFF',
  separator: '#E5E5EA',
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 100,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** iOS Typography — sizes / lineHeights from SF Pro guide */
export const type = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700' as const,
    letterSpacing: -0.35,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: -0.4,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '500' as const,
    letterSpacing: 0.06,
  },
  hero: {
    fontSize: 52,
    lineHeight: 58,
    fontWeight: '700' as const,
    letterSpacing: -1.6,
  },
  heroCents: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
};
