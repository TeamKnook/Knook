import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/src/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function KnookCard({ children, style, testID }: Props) {
  return (
    <View testID={testID} style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.knookLightGrey,
  },
});
