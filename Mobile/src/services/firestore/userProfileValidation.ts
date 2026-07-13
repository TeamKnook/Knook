import type {
  CompleteOnboardingInput,
  ProfileGender,
  ProfileInterestedIn,
  VibeAnswers,
} from './userProfileTypes';

const genderMap: Record<string, ProfileGender> = {
  Woman: 'woman',
  Man: 'man',
  'Non-binary': 'non_binary',
};

const interestedMap: Record<string, ProfileInterestedIn> = {
  Men: 'men',
  Women: 'women',
  Everyone: 'everyone',
};

function trim(value?: string | null): string {
  return (value ?? '').trim();
}

export function normalizeProfileGender(value: string | null): ProfileGender | null {
  return value ? genderMap[value] ?? null : null;
}

export function normalizeInterestedIn(value: string | null): ProfileInterestedIn | null {
  return value ? interestedMap[value] ?? null : null;
}

export function displayProfileGender(value?: ProfileGender | null): string | undefined {
  if (value === 'woman') return 'Woman';
  if (value === 'man') return 'Man';
  if (value === 'non_binary') return 'Non-binary';
  return undefined;
}

export function displayInterestedIn(value?: ProfileInterestedIn | null): string | undefined {
  if (value === 'men') return 'Men';
  if (value === 'women') return 'Women';
  if (value === 'everyone') return 'Everyone';
  return undefined;
}

export function buildVibeAnswers(input: CompleteOnboardingInput): VibeAnswers {
  const idealFirstDate = trim(input.idealFirstDate);
  const loveLanguage = trim(input.loveLanguage);
  const favouriteShow = trim(input.favouriteShow);
  return {
    ...(idealFirstDate ? { idealFirstDate: [idealFirstDate] } : {}),
    ...(loveLanguage ? { lookingFor: [loveLanguage] } : {}),
    ...(favouriteShow ? { favouriteTVShow: [favouriteShow] } : {}),
  };
}

export function validateOnboardingInput(input: CompleteOnboardingInput): { ok: true } | { ok: false; error: string } {
  const firstName = trim(input.firstName);
  const age = Number(input.age);
  const gender = normalizeProfileGender(input.gender);
  const interestedIn = normalizeInterestedIn(input.interestedIn);
  const favouriteShow = trim(input.favouriteShow);
  const hasPersonalityEngagement = Boolean(trim(input.idealFirstDate) || trim(input.loveLanguage) || favouriteShow);

  if (!firstName) return { ok: false, error: 'First name is required' };
  if (!Number.isInteger(age) || age < 18 || age > 99) {
    return { ok: false, error: 'Enter an age between 18 and 99' };
  }
  if (!gender) return { ok: false, error: 'Select your gender' };
  if (!interestedIn) return { ok: false, error: 'Select who you are interested in' };
  if (!hasPersonalityEngagement) {
    return { ok: false, error: 'Answer at least one personality prompt' };
  }
  if (!favouriteShow) return { ok: false, error: 'Favourite show is required' };

  return { ok: true };
}

export function sanitizeOnboardingInput(input: CompleteOnboardingInput) {
  const validation = validateOnboardingInput(input);
  if (!validation.ok) throw new Error(validation.error);

  const firstName = trim(input.firstName);
  const age = Number(input.age);
  const gender = normalizeProfileGender(input.gender);
  const interestedIn = normalizeInterestedIn(input.interestedIn);
  const favouriteShow = trim(input.favouriteShow);

  if (!gender || !interestedIn) throw new Error('Profile selections are invalid');

  return {
    firstName,
    age,
    gender,
    interestedIn,
    vibeAnswers: buildVibeAnswers(input),
    favouriteShow,
  };
}
