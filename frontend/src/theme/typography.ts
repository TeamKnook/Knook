import { Platform, TextStyle } from 'react-native';

// System font, heavy weights, editorial scale
const family = Platform.select({ ios: 'System', android: 'System', default: 'System' });

export const typography: Record<string, TextStyle> = {
  // Display — used sparingly on hero moments
  display: { fontFamily: family, fontSize: 44, lineHeight: 48, fontWeight: '800', letterSpacing: -1 },
  // Editorial titles
  h1: { fontFamily: family, fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontFamily: family, fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.2 },
  h3: { fontFamily: family, fontSize: 20, lineHeight: 26, fontWeight: '700' },
  // Body
  bodyLg: { fontFamily: family, fontSize: 17, lineHeight: 24, fontWeight: '400' },
  body: { fontFamily: family, fontSize: 15, lineHeight: 22, fontWeight: '400' },
  caption: { fontFamily: family, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  // Buttons
  buttonLg: { fontFamily: family, fontSize: 16, lineHeight: 20, fontWeight: '700' },
  // Eyebrow / labels
  eyebrow: { fontFamily: family, fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 1.5 },
};
