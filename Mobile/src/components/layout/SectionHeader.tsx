import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/src/theme';

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  testID?: string;
}

export function SectionHeader({ eyebrow, title, subtitle, testID }: Props) {
  return (
    <View style={styles.wrap} testID={testID}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, marginBottom: spacing.lg },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.knookPurple,
    textTransform: 'uppercase',
  },
  title: { ...typography.h1, color: colors.knookDark },
  subtitle: { ...typography.bodyLg, color: colors.knookMidGrey },
});
