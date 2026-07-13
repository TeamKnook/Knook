import { getAuth, type User as FirebaseAuthUser } from '@react-native-firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from '@react-native-firebase/firestore';
import { api } from '@/src/services/api';
import type { User } from '@/src/models';
import { diagnostics } from '@/src/utils/diagnostics';
import { sha256 } from '@/src/utils/sha256';
import { getKnookFirestore } from './firebaseFirestore';
import {
  USER_PROFILE_SCHEMA_VERSION,
  type CompleteOnboardingInput,
  type KnookUserProfile,
} from './userProfileTypes';
import {
  displayInterestedIn,
  displayProfileGender,
  sanitizeOnboardingInput,
} from './userProfileValidation';

type ProfileListener = (profile: KnookUserProfile | null) => void;

function profileRef(uid: string) {
  return doc(getKnookFirestore(), 'users', uid);
}

function currentFirebaseUser(): FirebaseAuthUser {
  const user = getAuth().currentUser;
  if (!user) throw new Error('Sign in before loading your profile');
  return user;
}

function assertOwnProfile(uid: string) {
  const current = currentFirebaseUser();
  if (current.uid !== uid) throw new Error('Cannot write another user profile');
  return current;
}

function phoneLast4(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '').slice(-4);
}

function fromSnapshotData(uid: string, data: Record<string, unknown> | undefined): KnookUserProfile | null {
  if (!data) return null;
  return {
    uid,
    phoneNumberE164: String(data.phoneNumberE164 ?? ''),
    phoneLast4: String(data.phoneLast4 ?? ''),
    phoneHash: String(data.phoneHash ?? ''),
    onboardingCompleted: Boolean(data.onboardingCompleted),
    onboardingCompletedAt: (data.onboardingCompletedAt ?? null) as KnookUserProfile['onboardingCompletedAt'],
    firstName: typeof data.firstName === 'string' ? data.firstName : null,
    age: typeof data.age === 'number' ? data.age : null,
    gender: (data.gender ?? null) as KnookUserProfile['gender'],
    interestedIn: (data.interestedIn ?? null) as KnookUserProfile['interestedIn'],
    vibeAnswers: (data.vibeAnswers ?? {}) as KnookUserProfile['vibeAnswers'],
    favouriteShow: typeof data.favouriteShow === 'string' ? data.favouriteShow : null,
    accountStatus: (data.accountStatus ?? 'active') as KnookUserProfile['accountStatus'],
    accessStatus: (data.accessStatus ?? 'development_allowed') as KnookUserProfile['accessStatus'],
    createdAt: (data.createdAt ?? null) as KnookUserProfile['createdAt'],
    updatedAt: (data.updatedAt ?? null) as KnookUserProfile['updatedAt'],
    lastSeenAt: (data.lastSeenAt ?? null) as KnookUserProfile['lastSeenAt'],
    schemaVersion: Number(data.schemaVersion ?? USER_PROFILE_SCHEMA_VERSION),
  };
}

export function mapProfileToUser(profile: KnookUserProfile): User {
  const gender = displayProfileGender(profile.gender);
  const interestedIn = displayInterestedIn(profile.interestedIn);
  return {
    uid: profile.uid,
    phoneHash: '',
    phoneLast4: profile.phoneLast4,
    name: profile.firstName ?? undefined,
    age: profile.age ?? undefined,
    gender,
    interestedIn: interestedIn ? [interestedIn] : [],
    dateVibe: profile.vibeAnswers.idealFirstDate?.[0],
    loveLanguage: profile.vibeAnswers.lookingFor?.[0],
    icebreaker: 'My favourite show is...',
    icebreakerAnswer: profile.favouriteShow ?? undefined,
    onboardingCompleted: profile.onboardingCompleted,
    relationshipStatus: 'single',
    createdAt: '',
    updatedAt: '',
  };
}

async function syncPreviewProfile(profile: KnookUserProfile): Promise<void> {
  const previewGender = displayProfileGender(profile.gender);
  const previewInterestedIn = displayInterestedIn(profile.interestedIn);
  await api.put<User>('/users/me', {
    name: profile.firstName ?? undefined,
    age: profile.age ?? undefined,
    gender: previewGender,
    interestedIn: previewInterestedIn ? [previewInterestedIn] : undefined,
    dateVibe: profile.vibeAnswers.idealFirstDate?.[0],
    loveLanguage: profile.vibeAnswers.lookingFor?.[0],
    icebreaker: 'My favourite show is...',
    icebreakerAnswer: profile.favouriteShow ?? undefined,
    onboardingCompleted: profile.onboardingCompleted,
  });
}

export const userProfileService = {
  async getCurrentUserProfile(uid: string): Promise<KnookUserProfile | null> {
    assertOwnProfile(uid);
    const snap = await getDoc(profileRef(uid));
    return fromSnapshotData(uid, snap.exists() ? snap.data() : undefined);
  },

  subscribeToCurrentUserProfile(uid: string, listener: ProfileListener): Unsubscribe {
    assertOwnProfile(uid);
    return onSnapshot(
      profileRef(uid),
      (snap) => listener(fromSnapshotData(uid, snap.exists() ? snap.data() : undefined)),
      (error) => {
        diagnostics.error('firestore-profile-subscription-failed', error, { uid });
        listener(null);
      },
    );
  },

  async createUserProfileFromAuth(firebaseUser?: FirebaseAuthUser): Promise<KnookUserProfile> {
    const user = firebaseUser ?? currentFirebaseUser();
    const existing = await this.getCurrentUserProfile(user.uid);

    const phoneNumber = user.phoneNumber;
    if (!phoneNumber) throw new Error('Firebase phone number is missing');
    const hash = sha256(phoneNumber);

    if (existing) {
      if (!existing.phoneHash) {
        await setDoc(
          profileRef(user.uid),
          { phoneHash: hash, updatedAt: serverTimestamp() },
          { merge: true },
        );
        const backfilled = await this.getCurrentUserProfile(user.uid);
        if (backfilled) return backfilled;
      }
      return existing;
    }

    await setDoc(profileRef(user.uid), {
      uid: user.uid,
      phoneNumberE164: phoneNumber,
      phoneLast4: phoneLast4(phoneNumber),
      phoneHash: hash,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      firstName: null,
      age: null,
      gender: null,
      interestedIn: null,
      vibeAnswers: {},
      favouriteShow: null,
      accountStatus: 'active',
      accessStatus: 'development_allowed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSeenAt: null,
      schemaVersion: USER_PROFILE_SCHEMA_VERSION,
    });

    const created = await this.getCurrentUserProfile(user.uid);
    if (!created) throw new Error('Could not create user profile');
    return created;
  },

  async completeOnboarding(uid: string, input: CompleteOnboardingInput): Promise<KnookUserProfile> {
    const user = assertOwnProfile(uid);
    const profileInput = sanitizeOnboardingInput(input);
    await this.createUserProfileFromAuth(user);
    await setDoc(
      profileRef(uid),
      {
        ...profileInput,
        onboardingCompleted: true,
        onboardingCompletedAt: serverTimestamp(),
        accountStatus: 'active',
        accessStatus: 'development_allowed',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    const profile = await this.getCurrentUserProfile(uid);
    if (!profile) throw new Error('Could not load saved profile');
    await syncPreviewProfile(profile);
    return profile;
  },

  async updateUserProfile(uid: string, patch: Partial<CompleteOnboardingInput>): Promise<KnookUserProfile> {
    assertOwnProfile(uid);
    const existing = await this.getCurrentUserProfile(uid);
    if (!existing) throw new Error('Create your profile before editing it');

    const mergedInput: CompleteOnboardingInput = {
      firstName: patch.firstName ?? existing.firstName ?? '',
      age: patch.age ?? existing.age ?? '',
      gender: patch.gender ?? displayProfileGender(existing.gender) ?? null,
      interestedIn: patch.interestedIn ?? displayInterestedIn(existing.interestedIn) ?? null,
      idealFirstDate: patch.idealFirstDate ?? existing.vibeAnswers.idealFirstDate?.[0] ?? null,
      loveLanguage: patch.loveLanguage ?? existing.vibeAnswers.lookingFor?.[0] ?? null,
      favouriteShow: patch.favouriteShow ?? existing.favouriteShow ?? null,
    };
    const profileInput = sanitizeOnboardingInput(mergedInput);
    await updateDoc(profileRef(uid), {
      ...profileInput,
      updatedAt: serverTimestamp(),
    });
    const profile = await this.getCurrentUserProfile(uid);
    if (!profile) throw new Error('Could not load updated profile');
    await syncPreviewProfile(profile);
    return profile;
  },

  async markLastSeen(uid: string): Promise<void> {
    assertOwnProfile(uid);
    await setDoc(profileRef(uid), { lastSeenAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
  },
};
