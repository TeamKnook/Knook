import {
  connectAuthEmulator,
  getAuth,
  getIdToken,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  type ConfirmationResult,
} from '@react-native-firebase/auth';
import { clearSession, setSession } from '../api';
import { appEnvironment } from '@/src/utils/environment';
import { diagnostics } from '@/src/utils/diagnostics';
import type { AuthenticatedUser, AuthProvider, AuthStateListener, VerificationSession } from './authTypes';

const sessions = new Map<string, ConfirmationResult>();
let emulatorConnected = false;
let developmentVerificationConfigured = false;

function ensureAuthTarget() {
  const auth = getAuth();

  if (appEnvironment.canShowFirebaseTestHelpers && !developmentVerificationConfigured) {
    auth.settings.appVerificationDisabledForTesting = true;
    developmentVerificationConfigured = true;
    diagnostics.log('firebase-auth-test-verification-enabled');
  }

  if (!appEnvironment.usesFirebaseAuthEmulator || emulatorConnected) return;
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  emulatorConnected = true;
  diagnostics.log('firebase-auth-emulator-connected');
}

function mapError(error: unknown): Error {
  const message = error instanceof Error ? error.message : 'Authentication failed';
  if (message.includes('invalid-phone-number')) return new Error('Enter a valid phone number');
  if (message.includes('invalid-verification-code')) return new Error('Invalid verification code');
  if (message.includes('session-expired')) return new Error('Verification code expired');
  if (message.includes('too-many-requests')) return new Error('Too many attempts. Try again later.');
  if (message.includes('network')) return new Error('Network unavailable');
  return new Error(message);
}

export const firebaseAuthProvider: AuthProvider = {
  subscribe(listener: AuthStateListener) {
    ensureAuthTarget();
    return onAuthStateChanged(getAuth(), (user) => {
      listener(user ? { uid: user.uid, onboardingCompleted: false } : null);
    });
  },

  async sendVerificationCode(phoneNumber: string): Promise<VerificationSession> {
    try {
      ensureAuthTarget();
      const confirmation = await signInWithPhoneNumber(getAuth(), phoneNumber);
      const id = `${Date.now()}:${phoneNumber}`;
      sessions.set(id, confirmation);
      return { id, phoneNumber, provider: 'firebase' };
    } catch (error) {
      diagnostics.error('firebase-send-code-failed', error, {
        phoneSuffix: phoneNumber.slice(-4),
      });
      throw mapError(error);
    }
  },

  async confirmVerificationCode(
    session: VerificationSession,
    code: string,
  ): Promise<AuthenticatedUser> {
    try {
      const confirmation = sessions.get(session.id);
      if (!confirmation) throw new Error('Verification code expired');
      diagnostics.log('firebase-confirm-code-start', {
        phoneSuffix: session.phoneNumber.slice(-4),
      });
      const credential = await confirmation.confirm(code);
      diagnostics.log('firebase-confirm-code-success', {
        uid: credential.user.uid,
        phoneSuffix: session.phoneNumber.slice(-4),
      });
      sessions.delete(session.id);
      const user = credential.user;
      await setSession(null, user.uid);
      return { uid: user.uid, onboardingCompleted: false };
    } catch (error) {
      diagnostics.error('firebase-confirm-code-failed', error, {
        phoneSuffix: session.phoneNumber.slice(-4),
      });
      throw mapError(error);
    }
  },

  async getAccessToken(forceRefresh = false): Promise<string | null> {
    const user = getAuth().currentUser;
    return user ? getIdToken(user, forceRefresh) : null;
  },

  async getCurrentUid(): Promise<string | null> {
    return getAuth().currentUser?.uid ?? null;
  },

  async signOut(): Promise<void> {
    await firebaseSignOut(getAuth());
    await clearSession();
  },
};
