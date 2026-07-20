import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AmbientLineBackground, PrimaryButton, ScreenContainer, TextInputField } from '@/src/components';
import { DATE_VIBES, GENDERS, INTERESTED_IN, LOVE_LANGUAGES } from '@/src/constants';
import { authService } from '@/src/services/auth/authService';
import { userProfileService } from '@/src/services/firestore/userProfileService';
import {
  displayInterestedIn,
  displayProfileGender,
  validateOnboardingInput,
} from '@/src/services/firestore/userProfileValidation';
import { colors, radius, spacing, typography } from '@/src/theme';

type OnboardingStep = 1 | 2 | 3;

function Chip({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function StepHeader({ step }: { step: OnboardingStep }) {
  return (
    <View style={styles.brandHeader}>
      <Text allowFontScaling={false} style={styles.wordmark}>knook</Text>
      <View style={styles.stepDots} accessibilityLabel={`Onboarding step ${step} of 3`}>
        {[1, 2, 3].map((value) => (
          <View key={value} style={[styles.stepDot, value <= step && styles.stepDotActive]} />
        ))}
      </View>
    </View>
  );
}

function ScreenHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.headingTitle}>{title}</Text>
      <Text style={styles.headingSubtitle}>{subtitle}</Text>
    </View>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewRow}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={styles.previewValue}>{value}</Text>
    </View>
  );
}

export default function ProfileSetup() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(1);
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

  const onboardingInput = {
    firstName: name,
    age,
    gender,
    interestedIn: interested,
    idealFirstDate: icebreakerAnswer.trim() || vibe,
    loveLanguage: love,
    favouriteShow,
  };

  const goToPersonality = () => {
    setError(null);
    const numericAge = Number(age);
    if (!name.trim()) return setError('First name is required');
    if (!Number.isInteger(numericAge) || numericAge < 18 || numericAge > 99) {
      return setError('Enter an age between 18 and 99');
    }
    if (!gender) return setError('Select your gender');
    if (!interested) return setError('Select who you are interested in');
    setStep(2);
  };

  const goToPreview = () => {
    setError(null);
    const validation = validateOnboardingInput(onboardingInput);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setStep(3);
  };

  const onSave = async () => {
    setError(null);
    const validation = validateOnboardingInput(onboardingInput);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    try {
      setSubmitting(true);
      const uid = await authService.getCurrentUid();
      if (!uid) throw new Error('Sign in before saving your profile');
      await userProfileService.completeOnboarding(uid, onboardingInput);
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
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={value === option}
            onPress={() => set(option)}
            testID={`${prefix}-${option.toLowerCase().replace(/\s+/g, '-')}-chip`}
          />
        ))}
      </View>
    </View>
  );

  return (
    <ScreenContainer testID="profile-setup-screen">
      <AmbientLineBackground variant="onboarding" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <StepHeader step={step} />

          {step > 1 ? (
            <Pressable
              testID="onboarding-back-button"
              onPress={() => {
                setError(null);
                setStep((step - 1) as OnboardingStep);
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={18} color={colors.knookPurple} />
              <Text style={styles.backLabel}>Back</Text>
            </Pressable>
          ) : null}

          {step === 1 ? (
            <View style={styles.stepContent} testID="onboarding-basics-step">
              <ScreenHeading title="first, the basics" subtitle="we promise this is the hardest part" />
              <TextInputField
                testID="name-input"
                label="First name"
                placeholder="What should we call you?"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
              <TextInputField
                testID="age-input"
                label="Age"
                placeholder="18+"
                value={age}
                onChangeText={(text) => setAge(text.replace(/\D/g, '').slice(0, 2))}
                keyboardType="number-pad"
                style={styles.input}
              />
              {renderChips('I am', GENDERS, gender, setGender, 'gender')}
              {renderChips('Interested in', INTERESTED_IN, interested, setInterested, 'interest')}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton testID="onboarding-basics-next" label="next" onPress={goToPersonality} style={styles.action} />
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.stepContent} testID="onboarding-personality-step">
              <ScreenHeading title="make it feel like you" subtitle="pick what sounds most like your kind of night" />
              {renderChips('Ideal first date', DATE_VIBES, vibe, setVibe, 'vibe')}
              <TextInputField
                testID="icebreaker-input"
                label="Or write your own"
                placeholder="Something else entirely..."
                value={icebreakerAnswer}
                onChangeText={setIcebreakerAnswer}
                multiline
                style={[styles.input, styles.textarea]}
              />
              {renderChips('Love language', LOVE_LANGUAGES, love, setLove, 'love')}
              <TextInputField
                testID="favourite-show-input"
                label="Favourite TV show"
                placeholder="The show you always go back to"
                value={favouriteShow}
                onChangeText={setFavouriteShow}
                style={styles.input}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton testID="onboarding-personality-next" label="review my profile" onPress={goToPreview} style={styles.action} />
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.stepContent} testID="onboarding-preview-step">
              <ScreenHeading title="looking good." subtitle="one last check before you enter Knook" />
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <View>
                    <Text style={styles.previewName}>{name.trim()}</Text>
                    <Text style={styles.previewAge}>{age} years old</Text>
                  </View>
                  <Pressable testID="onboarding-edit-profile" onPress={() => setStep(1)} style={styles.editButton}>
                    <Ionicons name="pencil" size={18} color={colors.knookPurple} />
                  </Pressable>
                </View>
                <View style={styles.previewDivider} />
                <PreviewRow label="I am" value={gender ?? ''} />
                <PreviewRow label="Interested in" value={interested ?? ''} />
                <PreviewRow label="Ideal date" value={icebreakerAnswer.trim() || vibe || ''} />
                <PreviewRow label="Love language" value={love ?? 'Not set'} />
                <View style={styles.showPill}>
                  <Ionicons name="tv-outline" size={16} color={colors.knookDark} />
                  <Text style={styles.showText}>{favouriteShow.trim()}</Text>
                </View>
              </View>
              <Text style={styles.confirmationNote}>Nothing is saved until you confirm.</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton testID="profile-save-button" label="i'm ready" onPress={onSave} loading={submitting} style={styles.action} />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  brandHeader: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  wordmark: { fontFamily: 'Outfit_900Black', fontSize: 30, lineHeight: 36, color: colors.knookDark },
  stepDots: { flexDirection: 'row', gap: 6 },
  stepDot: { width: 22, height: 4, borderRadius: 2, backgroundColor: colors.knookLightGrey },
  stepDotActive: { backgroundColor: colors.knookYellow },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
  backLabel: { ...typography.caption, color: colors.knookPurple, fontWeight: '700' },
  stepContent: { flex: 1, gap: spacing.lg, paddingTop: spacing.sm },
  heading: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  headingTitle: { ...typography.h1, color: colors.knookDark, textAlign: 'center' },
  headingSubtitle: { ...typography.body, color: colors.knookMidGrey, textAlign: 'center' },
  input: { backgroundColor: colors.white },
  section: { gap: spacing.sm },
  label: { ...typography.eyebrow, color: colors.knookMidGrey, textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.knookLightGrey,
    backgroundColor: colors.white,
  },
  chipSelected: { backgroundColor: colors.knookPurple, borderColor: colors.knookPurple },
  chipLabel: { ...typography.body, color: colors.knookDark },
  chipLabelSelected: { color: colors.white, fontWeight: '700' },
  pressed: { opacity: 0.78 },
  textarea: { minHeight: 86, textAlignVertical: 'top' },
  action: { marginTop: spacing.sm },
  error: { ...typography.caption, color: '#B91C1C', textAlign: 'center' },
  previewCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 7, 100, 0.14)',
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  previewName: { ...typography.h2, color: colors.knookDark },
  previewAge: { ...typography.caption, color: colors.knookMidGrey, marginTop: 2 },
  editButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.knookLightGrey, alignItems: 'center', justifyContent: 'center' },
  previewDivider: { height: 1, backgroundColor: colors.knookLightGrey },
  previewRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  previewLabel: { ...typography.caption, color: colors.knookMidGrey },
  previewValue: { ...typography.body, color: colors.knookDark, fontWeight: '700', textAlign: 'right', flex: 1 },
  showPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.knookYellow },
  showText: { ...typography.caption, color: colors.knookDark, fontWeight: '800' },
  confirmationNote: { ...typography.caption, color: colors.knookMidGrey, textAlign: 'center' },
});
