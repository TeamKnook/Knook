import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/src/theme';

interface Props {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  testID?: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon = 'heart-outline', illustration, title, description, testID, children }: Props) {
  return (
    <View style={styles.wrap} testID={testID}>
      {illustration ?? (
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={28} color={colors.knookPurple} />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.knookLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.h3, color: colors.knookDark, textAlign: 'center' },
  description: {
    ...typography.body,
    color: colors.knookMidGrey,
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: { width: '100%', marginTop: spacing.md, gap: spacing.sm },
});
