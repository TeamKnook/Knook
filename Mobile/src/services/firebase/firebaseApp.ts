import { getApps } from '@react-native-firebase/app';
import { appEnvironment } from '@/src/utils/environment';
import { diagnostics } from '@/src/utils/diagnostics';

export function bootstrapFirebase(): void {
  if (!appEnvironment.usesFirebaseAuth) {
    diagnostics.log('firebase-bootstrap-skipped', { authProvider: appEnvironment.authProvider });
    return;
  }

  const apps = getApps();
  diagnostics.log('firebase-bootstrap', {
    appCount: apps.length,
    authTarget: appEnvironment.firebaseAuthTarget,
    firestoreTarget: appEnvironment.firestoreTarget,
    configPresent: appEnvironment.firebaseConfigPresent,
  });
}
