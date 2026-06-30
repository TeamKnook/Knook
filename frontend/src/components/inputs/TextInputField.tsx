import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  testID?: string;
}

export function TextInputField({ label, error, testID, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        testID={testID}
        placeholderTextColor={colors.knookMidGrey}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, width: '100%' },
  label: { ...typography.eyebrow, color: colors.knookMidGrey, textTransform: 'uppercase' },
  input: {
    ...typography.bodyLg,
    color: colors.knookDark,
    backgroundColor: colors.knookOffWhite,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.knookLightGrey,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  inputError: { borderColor: '#B91C1C' },
  error: { ...typography.caption, color: '#B91C1C' },
});
