/**
 * Firebase config — READ FROM ENV ONLY.
 *
 * Populate these in your Expo Dev Build via:
 *   EXPO_PUBLIC_FB_API_KEY=...
 *   EXPO_PUBLIC_FB_AUTH_DOMAIN=...
 *   EXPO_PUBLIC_FB_PROJECT_ID=...
 *   EXPO_PUBLIC_FB_STORAGE_BUCKET=...
 *   EXPO_PUBLIC_FB_MESSAGING_SENDER_ID=...
 *   EXPO_PUBLIC_FB_APP_ID=...
 *
 * Never hardcode secrets here.
 */
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FB_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FB_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FB_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);
