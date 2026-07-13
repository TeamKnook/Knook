import { StyleSheet, Text, View } from 'react-native';

import { KnookIllustration } from './KnookIllustration';
import { colors, typography } from '@/src/theme';

export function KnookBrandSplash() {
  return (
    <View style={styles.wrap} testID="knook-brand-splash">
      <KnookIllustration state="sleepy" size="large" testID="splash-wordmark" />
      <Text style={styles.caption}>Wake up to possibility.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.knookOffWhite,
    gap: 12,
  },
  caption: {
    ...typography.caption,
    color: colors.knookPurple,
    opacity: 0.55,
  },
});
