import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer, SectionHeader, EmptyState, GhostButton, KnookIllustration } from '@/src/components';
import { useMatches } from '@/src/hooks/useMatches';
import { firestoreService } from '@/src/services/firestore/firestoreService';
import { colors, radius, spacing, typography } from '@/src/theme';
import { diagnostics } from '@/src/utils/diagnostics';
import { appEnvironment } from '@/src/utils/environment';

export default function ChatsScreen() {
  const router = useRouter();
  const { matches, loading, error, refresh } = useMatches();

  const triggerReveal = async () => {
    try {
      await firestoreService.triggerDailyReveal();
      await refresh();
    } catch (err) {
      diagnostics.error('dev-trigger-reveal-failed', err);
    }
  };

  return (
    <ScreenContainer testID="chats-screen">
      <View style={styles.headerWrap}>
        <SectionHeader
          eyebrow="Your matches"
          title="Chats"
          subtitle="Mystery matches stay anonymous until you both choose to reveal."
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <FlatList
        style={styles.listWrap}
        data={matches}
        keyExtractor={(m) => m.matchId}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.knookPurple} />}
        ListHeaderComponent={
          matches.length ? (
            <KnookIllustration state="hearts" size="medium" loop={false} testID="daily-reveal-illustration" />
          ) : null
        }
        ListHeaderComponentStyle={matches.length ? styles.revealIllustration : undefined}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="No matches yet"
              description="Matches appear here after 6:30 PM IST when two people crushed on each other."
              testID="chats-empty"
            >
              {appEnvironment.canUsePreviewTools ? (
                <GhostButton
                  testID="dev-trigger-reveal-button"
                  label="Trigger reveal now (demo)"
                  onPress={triggerReveal}
                />
              ) : null}
            </EmptyState>
          ) : null
        }
        renderItem={({ item }) => {
          const title = item.mutualReveal && item.otherName ? item.otherName : 'Mystery Match';
          return (
            <Pressable
              testID={`chat-row-${item.matchId}`}
              style={styles.row}
              onPress={() => router.push(`/chat/${item.matchId}`)}
            >
              <View style={styles.avatar}>
                <Ionicons
                  name={item.mutualReveal ? 'happy' : 'help'}
                  size={22}
                  color={colors.knookPurple}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessagePreview ?? 'Say hello anonymously…'}
                </Text>
              </View>
              {item.iRevealed ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>You revealed</Text>
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  listWrap: { flex: 1 },
  list: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  revealIllustration: { marginBottom: spacing.md },
  error: { ...typography.caption, color: '#B91C1C', marginTop: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, backgroundColor: colors.white,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.knookLightGrey,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.knookLightGrey,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { ...typography.body, color: colors.knookDark, fontWeight: '700' },
  preview: { ...typography.caption, color: colors.knookMidGrey },
  badge: {
    backgroundColor: colors.knookYellow, paddingHorizontal: spacing.sm,
    paddingVertical: 4, borderRadius: radius.pill,
  },
  badgeText: { ...typography.caption, color: colors.knookDark, fontWeight: '700' },
});
