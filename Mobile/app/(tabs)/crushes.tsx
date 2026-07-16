import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer, SectionHeader, EmptyState, PrimaryButton, KnookCard, KnookIllustration } from '@/src/components';
import { useCrushes } from '@/src/hooks/useCrushes';
import { colors, radius, spacing, typography } from '@/src/theme';
import { getCrushDisplayModel } from '@/src/utils/crushPrivacy';
import { formatCountdown, nextRevealAt } from '@/src/utils/timeUtils';

export default function CrushesScreen() {
  const router = useRouter();
  const { crushes, loading, error, refresh } = useCrushes();
  const [now, setNow] = useState(Date.now());

  const target = useMemo(() => nextRevealAt().getTime(), []);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const displayRows = useMemo(
    () => crushes.map((crush) => ({ crush, display: getCrushDisplayModel(crush) })),
    [crushes],
  );
  const activeCount = displayRows.filter((row) => row.display.isActive).length;

  return (
    <ScreenContainer testID="crushes-screen">
      <View style={styles.headerWrap}>
        <SectionHeader
          eyebrow="Your secrets"
          title="Crushes"
          subtitle="Tap them in. We'll only tell you if they tap back."
        />

        <KnookCard testID="reveal-countdown-card" style={styles.countdownCard}>
          <View style={styles.countdownRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.countdownEyebrow}>Next reveal · 6:30 PM IST</Text>
              <Text style={styles.countdownTime} testID="reveal-countdown-value">
                {formatCountdown(target, now)}
              </Text>
            </View>
            <Ionicons name="time-outline" size={28} color={colors.knookYellow} />
          </View>
        </KnookCard>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber} testID="stat-active-crushes">{activeCount}</Text>
            <Text style={styles.statLabel}>Active in your Private Circle</Text>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <FlatList
        style={styles.listWrap}
        data={displayRows}
        keyExtractor={(item) => item.crush.phoneHash}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.knookPurple} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              illustration={<KnookIllustration state="binoculars" size="medium" testID="crushes-empty-illustration" />}
              title="No crushes yet"
              description="Build your Private Circle from people you already know. Daily reveal is the only time a mutual match can appear."
              testID="crushes-empty"
            >
              <PrimaryButton
                testID="add-first-crush-button"
                label="Add your first crush"
                onPress={() => router.push('/add-crush')}
              />
            </EmptyState>
          ) : null
        }
        renderItem={({ item }) => {
          const { crush, display } = item;
          return (
            <View testID={`crush-row-${crush.phoneHash.slice(0, 6)}`} style={styles.row}>
              <View style={styles.avatar}>
                <Ionicons name="heart-outline" size={20} color={colors.knookPurple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{display.title}</Text>
                <Text style={styles.rowSubtitle}>{display.subtitle}</Text>
              </View>
              <Text style={styles.rowBadge}>{display.badge}</Text>
            </View>
          );
        }}
      />

      <Pressable
        testID="add-crush-fab"
        onPress={() => router.push('/add-crush')}
        style={styles.fab}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  listWrap: { flex: 1 },
  countdownCard: { backgroundColor: colors.knookPurple, borderColor: colors.knookPurple },
  countdownRow: { flexDirection: 'row', alignItems: 'center' },
  countdownEyebrow: { ...typography.eyebrow, color: colors.knookYellow, textTransform: 'uppercase' },
  countdownTime: { ...typography.h2, color: colors.white, fontVariant: ['tabular-nums'] },
  statsRow: { flexDirection: 'row', marginBottom: spacing.sm },
  stat: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.knookLightGrey,
  },
  statNumber: { ...typography.h1, color: colors.knookDark },
  statLabel: { ...typography.caption, color: colors.knookMidGrey, textTransform: 'uppercase' },
  error: { ...typography.caption, color: '#B91C1C' },
  listContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 120, gap: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.knookLightGrey,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.knookLightGrey,
    alignItems: 'center', justifyContent: 'center',
  },
  rowTitle: { ...typography.body, color: colors.knookDark, fontWeight: '700' },
  rowSubtitle: { ...typography.caption, color: colors.knookMidGrey },
  rowBadge: { ...typography.caption, color: colors.knookPurple, textTransform: 'uppercase' },
  fab: {
    position: 'absolute', right: spacing.lg, bottom: 80,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.knookPurple, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.knookDark, shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
