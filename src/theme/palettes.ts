/** Light + dark palettes — accent stays brand neon */
export const light = {
  bg: '#FFFFFF',
  bgGrouped: '#F2F2F7',
  fill: '#F2F2F7',
  fillSecondary: '#E5E5EA',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  textTertiary: '#AEAEB2',
  accent: '#B2FF24',
  accentSoft: '#EEFFC8',
  accentInk: '#0A0A0A',
  green: '#34C759',
  danger: '#C0392B',
  black: '#000000',
  white: '#FFFFFF',
  separator: '#E5E5EA',
} as const;

/** Softer dark — charcoal, not pure black (easier on eyes) */
export const dark = {
  bg: '#1C1C1E',
  bgGrouped: '#2C2C2E',
  fill: '#2C2C2E',
  fillSecondary: '#3A3A3C',
  card: '#3A3A3C',
  text: '#F5F5F7',
  textSecondary: '#AEAEB2',
  textTertiary: '#8E8E93',
  accent: '#B2FF24',
  accentSoft: '#243318',
  accentInk: '#0A0A0A',
  green: '#30D158',
  danger: '#FF453A',
  black: '#000000',
  white: '#FFFFFF',
  separator: '#48484A',
} as const;

export type Palette = {
  bg: string;
  bgGrouped: string;
  fill: string;
  fillSecondary: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentSoft: string;
  accentInk: string;
  green: string;
  danger: string;
  black: string;
  white: string;
  separator: string;
};
