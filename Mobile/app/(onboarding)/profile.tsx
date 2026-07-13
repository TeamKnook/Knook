import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer, SectionHeader, PrimaryButton, TextInputField } from '@/src/components';
import { colors, radius, spacing, typography } from '@/src/theme';
import { DATE_VIBES, GENDERS, INTERESTED_IN, LOVE_LANGUAGES } from '@/src/constants';
import { authService } from '@/src/services/auth/authService';
import { userProfileService } from '@/src/services/firestore/userProfileService';
import {
  displayInterestedIn,
  displayProfileGender,
  validateOnboardingInput,
} from '@/src/services/firestore/userProfileValidation';

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
  const [favouriteShow, setFavouriteShow] = useState('');
  const [icebreakerAnswer, setIcebreakerAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const uid = await authService.getCurrentUid();
      if (!uid) return;
      const profile = await userProfileService.getCurrentUserProfile(uid);
      if (!profile) return;
      setName(profile.firstName ?? '');
      setAge(profile.age ? String(profile.age) : '');
      setGender(displayProfileGender(profile.gender) ?? null);
      setInterested(displayInterestedIn(profile.interestedIn) ?? null);
      setVibe(profile.vibeAnswers.idealFirstDate?.[0] ?? null);
      setLove(profile.vibeAnswers.lookingFor?.[0] ?? null);
      setFavouriteShow(profile.favouriteShow ?? profile.vibeAnswers.favouriteTVShow?.[0] ?? '');
      setIcebreakerAnswer(profile.vibeAnswers.idealFirstDate?.[0] ?? '');
    })();
  }, []);

  const onSave = async () => {
    setError(null);
    const input = {
      firstName: name,
      age,
      gender,
      interestedIn: interested,
      idealFirstDate: icebreakerAnswer.trim() || vibe,
      loveLanguage: love,
      favouriteShow,
    };
    const validation = validateOnboardingInput(input);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    try {
      setSubmitting(true);
      const uid = await authService.getCurrentUid();
      if (!uid) throw new Error('Sign in before saving your profile');
      await userProfileService.completeOnboarding(uid, input);
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
        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          alwaysBounceVertical
          contentContainerStyle={styles.scroll}
        >
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

          <TextInputField
            testID="favourite-show-input"
            label="Favourite TV show"
            value={favouriteShow}
            onChangeText={setFavouriteShow}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton testID="profile-save-button" label="Enter Knook" onPress={onSave} loading={submitting} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingTop: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
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
  error: { ...typography.caption, color: '#B91C1C' },
});
