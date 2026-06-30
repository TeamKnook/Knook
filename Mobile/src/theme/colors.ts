/**
 * Knook design tokens (from product spec).
 * No gradients on dark — use solids and accents only.
 */
export const colors = {
  knookPurple: '#3B0764',
  knookYellow: '#EAB308',
  knookOffWhite: '#FAF8F5',
  knookDark: '#1A1A1A',
  knookMidGrey: '#4B4B4B',
  knookLightGrey: '#F3F0EC',
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;
