import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, PrimaryButton, GhostButton, KnookCard } from '@/src/components';
import { firestoreService } from '@/src/services/firestore/firestoreService';
import type { Match } from '@/src/models';
import { colors, radius, spacing, typography } from '@/src/theme';

export default function RevealScreen() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    if (!matchId) return;
    setMatch(await firestoreService.getMatch(matchId));
  };

  useEffect(() => {
    void refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const onReveal = async () => {
    if (!matchId) return;
    try {
      setSubmitting(true);
      const updated = await firestoreService.reveal(matchId);
      setMatch(updated);
    } finally {
      setSubmitting(false);
    }
  };

  if (!match) {
    return (
      <ScreenContainer testID="reveal-screen-loading">
        <Text style={styles.loading}>Loading…</Text>
      </ScreenContainer>
    );
  }

  const otherRevealed = (match.revealedBy || []).some((u) => u !== (match.otherUid ? match.userA : match.userB));
  // simpler: count of other-side reveals
  const iRevealed = !!match.iRevealed;
  const theyRevealed = (match.revealedBy || []).length > (iRevealed ? 1 : 0);
  const mutual = !!match.mutualReveal;

  let state: 'neither' | 'me' | 'them' | 'both';
  if (mutual) state = 'both';
  else if (iRevealed) state = 'me';
  else if (theyRevealed) state = 'them';
  else state = 'neither';

  return (
    <ScreenContainer testID="reveal-screen" scroll>
      <View style={styles.heroWrap}>
        <View style={styles.heroIcon}>
          <Ionicons name="sparkles" size={28} color={colors.knookYellow} />
        </View>
        <Text style={styles.heroTitle}>
          {state === 'both' ? 'You both revealed.' :
           state === 'me'   ? 'You revealed.' :
           state === 'them' ? 'They revealed first.' :
                              'Want to drop the mask?'}
        </Text>
        <Text style={styles.heroSub}>
          {state === 'both'
            ? `Say hi to ${match.otherName || 'them'}.`
            : 'Real names show only when you both reveal.'}
        </Text>
      </View>

      <KnookCard testID="reveal-state-card" style={styles.card}>
        <StateRow label="You revealed" on={iRevealed} />
        <StateRow label="They revealed" on={theyRevealed || mutual} />
        <StateRow label="Mutual reveal" on={mutual} highlight />
        {void otherRevealed}
      </KnookCard>

      <View style={styles.actions}>
        {!iRevealed ? (
          <PrimaryButton
            testID="reveal-confirm-button"
            label="Reveal me"
            loading={submitting}
            onPress={onReveal}
          />
        ) : (
          <GhostButton
            testID="reveal-waiting-button"
            label={mutual ? 'All revealed' : 'Waiting on them…'}
            disabled
          />
        )}
        <GhostButton
          testID="reveal-back-button"
          label="Back to chat"
          onPress={() => router.back()}
        />
      </View>
    </ScreenContainer>
  );
}

function StateRow({ label, on, highlight }: { label: string; on: boolean; highlight?: boolean }) {
  return (
    <View style={styles.stateRow}>
      <View style={[styles.dot, on ? styles.dotOn : styles.dotOff, highlight && on && styles.dotHighlight]} />
      <Text style={styles.stateLabel}>{label}</Text>
      <Text style={[styles.stateValue, on && styles.stateValueOn]}>{on ? 'Yes' : 'Not yet'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { ...typography.body, color: colors.knookMidGrey, paddingTop: spacing.xl, textAlign: 'center' },
  heroWrap: { alignItems: 'center', paddingTop: spacing.xl, gap: spacing.sm },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.knookPurple, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroTitle: { ...typography.h1, color: colors.knookDark, textAlign: 'center' },
  heroSub: { ...typography.bodyLg, color: colors.knookMidGrey, textAlign: 'center', paddingHorizontal: spacing.lg },
  card: { marginTop: spacing.xl, gap: spacing.sm },
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  dot: { width: 14, height: 14, borderRadius: 7 },
  dotOff: { backgroundColor: colors.knookLightGrey },
  dotOn: { backgroundColor: colors.knookPurple },
  dotHighlight: { backgroundColor: colors.knookYellow },
  stateLabel: { ...typography.body, color: colors.knookDark, flex: 1 },
  stateValue: { ...typography.caption, color: colors.knookMidGrey, textTransform: 'uppercase' },
  stateValueOn: { color: colors.knookPurple, fontWeight: '700' },
  actions: { gap: spacing.sm, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  _unused: { borderRadius: radius.lg },
});
