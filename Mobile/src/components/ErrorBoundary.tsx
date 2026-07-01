import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/src/theme';
import { diagnostics } from '@/src/utils/diagnostics';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    diagnostics.error('react-boundary', error, { componentStack: info.componentStack });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container} testID="runtime-error-boundary">
        <Text style={styles.title}>Something went wrong.</Text>
        <Text style={styles.body}>Restart the preview and try again.</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.knookOffWhite,
  },
  title: { ...typography.h2, color: colors.knookDark, textAlign: 'center' },
  body: { ...typography.body, color: colors.knookMidGrey, textAlign: 'center' },
});
