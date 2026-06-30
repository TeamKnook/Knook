import React from 'react';
import { Pressable, StyleSheet, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme';

interface Props {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, disabled, loading, testID, style }: Props) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.knookPurple,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    width: '100%',
  },
  label: { ...typography.buttonLg, color: colors.white },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
