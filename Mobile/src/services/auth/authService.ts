/**
 * Auth service — wraps Firebase Phone Auth in production, mocks for preview.
 *
 * TODO(real-firebase): replace requestOtp/verifyOtp with
 * `auth().signInWithPhoneNumber(phone)` from @react-native-firebase/auth
 * and `confirmation.confirm(code)`.
 */
import { api, setSession, clearSession, getUid } from '../api';

export interface RequestOtpResult {
  verificationId: string;
  devCode: string; // only present in preview
}

export interface AuthResult {
  token: string;
  uid: string;
  onboardingCompleted: boolean;
}

export const authService = {
  requestOtp: (phone: string) =>
    api.post<RequestOtpResult>('/auth/request-otp', { phone }),

  async verifyOtp(phone: string, verificationId: string, code: string): Promise<AuthResult> {
    const res = await api.post<AuthResult>('/auth/verify-otp', { phone, verificationId, code });
    await setSession(res.token, res.uid);
    return res;
  },

  signOut: clearSession,

  async getCurrentUid() {
    return getUid();
  },
};
