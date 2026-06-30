import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/src/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  background?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenContainer({
  children,
  scroll = false,
  background = colors.knookOffWhite,
  style,
  contentStyle,
  testID,
  edges = ['top', 'left', 'right'],
}: Props) {
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.flex, { backgroundColor: background }, style]}
      testID={testID}
    >
      <StatusBar barStyle="dark-content" backgroundColor={background} />
      <Body
        style={styles.flex}
        contentContainerStyle={
          scroll
            ? [styles.scrollContent, { paddingBottom: insets.bottom + spacing.lg }, contentStyle]
            : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {!scroll ? <View style={[styles.content, contentStyle]}>{children}</View> : children}
      </Body>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
});
