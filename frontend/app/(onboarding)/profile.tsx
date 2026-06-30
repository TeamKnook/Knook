import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer, SectionHeader, PrimaryButton, TextInputField } from '@/src/components';
import { firestoreService } from '@/src/services/firestore/firestoreService';
import { colors, radius, spacing, typography } from '@/src/theme';
import { DATE_VIBES, GENDERS, INTERESTED_IN, LOVE_LANGUAGES } from '@/src/constants';

type Choice = { value: string; testID: string };

function Chip({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function ProfileSetup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [interested, setInterested] = useState<string | null>(null);
  const [vibe, setVibe] = useState<string | null>(null);
  const [love, setLove] = useState<string | null>(null);
  const [icebreakerAnswer, setIcebreakerAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setError(null);
    if (!name.trim() || !age || !gender || !interested) {
      setError('Please fill in name, age, gender and interest');
      return;
    }
    try {
      setSubmitting(true);
      await firestoreService.updateMe({
        name: name.trim(),
        age: Number(age),
        gender,
        interestedIn: [interested],
        dateVibe: vibe ?? undefined,
        loveLanguage: love ?? undefined,
        icebreaker: 'My ideal first date is…',
        icebreakerAnswer: icebreakerAnswer.trim() || undefined,
        onboardingCompleted: true,
      });
      router.replace('/(tabs)/crushes');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSubmitting(false);
    }
  };

  const renderChips = (label: string, options: string[], value: string | null, set: (v: string) => void, prefix: string) => (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={value === opt}
            onPress={() => set(opt)}
            testID={`${prefix}-${opt.toLowerCase().replace(/\s+/g, '-')}-chip`}
          />
        ))}
      </View>
    </View>
  );

  return (
    <ScreenContainer testID="profile-setup-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <SectionHeader
            eyebrow="One last thing"
            title="Tell us about you"
            subtitle="The basics for now — you can keep editing later."
          />

          <View style={styles.row}>
            <View style={styles.flex2}>
              <TextInputField testID="name-input" label="First name" value={name} onChangeText={setName} />
            </View>
            <View style={styles.flex1}>
              <TextInputField
                testID="age-input"
                label="Age"
                value={age}
                onChangeText={(t) => setAge(t.replace(/\D/g, '').slice(0, 2))}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {renderChips('I am', GENDERS, gender, setGender, 'gender')}
          {renderChips('Interested in', INTERESTED_IN, interested, setInterested, 'interest')}
          {renderChips('Date vibe', DATE_VIBES, vibe, setVibe, 'vibe')}
          {renderChips('Love language', LOVE_LANGUAGES, love, setLove, 'love')}

          <TextInputField
            testID="icebreaker-input"
            label="My ideal first date is…"
            value={icebreakerAnswer}
            onChangeText={setIcebreakerAnswer}
            multiline
            style={styles.textarea}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton testID="profile-save-button" label="Enter Knook" onPress={onSave} loading={submitting} />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  section: { gap: spacing.sm },
  label: { ...typography.eyebrow, color: colors.knookMidGrey, textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.knookLightGrey,
    backgroundColor: colors.white,
  },
  chipSelected: { backgroundColor: colors.knookPurple, borderColor: colors.knookPurple },
  chipLabel: { ...typography.body, color: colors.knookDark },
  chipLabelSelected: { color: colors.white, fontWeight: '700' },
  textarea: { minHeight: 96, textAlignVertical: 'top' },
  footer: { paddingTop: spacing.md, paddingBottom: spacing.lg },
  error: { ...typography.caption, color: '#B91C1C' },
});
