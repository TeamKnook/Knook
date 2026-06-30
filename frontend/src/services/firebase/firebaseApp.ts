/**
 * Firebase app bootstrap.
 *
 * TODO(real-firebase): wire @react-native-firebase/app once the project is
 * generated as an Expo Dev Build. Until then the preview routes everything
 * through src/services/firestore/firestoreService.ts which talks to the
 * MongoDB-backed adapter at $EXPO_PUBLIC_BACKEND_URL.
 *
 * Example for Dev Build:
 *   import { initializeApp, getApps } from '@react-native-firebase/app';
 *   if (!getApps().length) initializeApp(firebaseConfig);
 */
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';

export function bootstrapFirebase(): void {
  if (!isFirebaseConfigured) {
    // eslint-disable-next-line no-console
    console.log('[firebase] config absent — using preview adapter');
    return;
  }
  // TODO(real-firebase): initializeApp(firebaseConfig);
  void firebaseConfig;
}
