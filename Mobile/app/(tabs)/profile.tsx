import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer, SectionHeader, KnookCard, GhostButton, PrimaryButton, KnookIllustration } from '@/src/components';
import { useAuth } from '@/src/hooks/useAuth';
import { colors, spacing, typography } from '@/src/theme';

export default function ProfileTab() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <ScreenContainer testID="profile-screen" scroll>
      <SectionHeader eyebrow="You" title={user?.name || 'Your profile'} subtitle="Visible only after mutual reveal." />
      <KnookIllustration state="mirror" size="medium" testID="profile-illustration" />

      <KnookCard style={styles.card} testID="profile-summary-card">
        <Row label="Phone" value={user ? `•••• ${user.phoneLast4 || '—'}` : '—'} />
        <Row label="Age" value={user?.age ? `${user.age}` : '—'} />
        <Row label="Gender" value={user?.gender || '—'} />
        <Row label="Interested in" value={(user?.interestedIn || []).join(', ') || '—'} />
        <Row label="Date vibe" value={user?.dateVibe || '—'} />
        <Row label="Love language" value={user?.loveLanguage || '—'} />
      </KnookCard>

      <View style={styles.todoBlock} testID="profile-todo-block">
        <Text style={styles.todoTitle}>Coming soon</Text>
        <Text style={styles.todoLine}>· First Date Packages</Text>
        <Text style={styles.todoLine}>· Couples Shipping</Text>
        <Text style={styles.todoLine}>· Origin Story</Text>
        <Text style={styles.todoLine}>· Premium · powered by RevenueCat</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          testID="profile-edit-button"
          label="Edit profile"
          onPress={() => router.push('/(onboarding)/profile')}
        />
        <GhostButton
          testID="sign-out-button"
          label="Sign out"
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/phone');
          }}
        />
      </View>
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  rowLabel: { ...typography.caption, color: colors.knookMidGrey, textTransform: 'uppercase' },
  rowValue: { ...typography.body, color: colors.knookDark, fontWeight: '600' },
  todoBlock: {
    backgroundColor: colors.knookLightGrey, padding: spacing.md,
    borderRadius: 16, marginBottom: spacing.lg, gap: spacing.xs,
  },
  todoTitle: { ...typography.eyebrow, color: colors.knookPurple, textTransform: 'uppercase' },
  todoLine: { ...typography.body, color: colors.knookMidGrey },
  actions: { gap: spacing.sm, paddingBottom: spacing.xl },
});
