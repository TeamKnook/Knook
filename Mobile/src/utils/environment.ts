import Constants from 'expo-constants';

type AppVariant = 'development' | 'preview' | 'production';
type AuthProvider = 'firebase' | 'preview';
type ProductDataProvider = 'firebase' | 'preview';
type FirebaseAuthTarget = 'development' | 'emulator';
type FirestoreTarget = 'development' | 'emulator';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  appVariant?: AppVariant;
  authProvider?: AuthProvider;
  productDataProvider?: ProductDataProvider;
  firebaseAuthTarget?: FirebaseAuthTarget;
  firestoreTarget?: FirestoreTarget;
  firebaseConfigPresent?: { ios?: boolean; android?: boolean };
};

export const appEnvironment = {
  variant: extra.appVariant ?? 'production',
  authProvider: extra.authProvider ?? 'preview',
  productDataProvider: extra.productDataProvider ?? (extra.authProvider === 'firebase' ? 'firebase' : 'preview'),
  firebaseAuthTarget: extra.firebaseAuthTarget ?? 'development',
  firestoreTarget: extra.firestoreTarget ?? 'development',
  firebaseConfigPresent: extra.firebaseConfigPresent ?? {},
  isDevelopmentBuild: extra.appVariant === 'development',
  isPreviewBuild: extra.appVariant === 'preview',
  isProductionBuild: extra.appVariant === 'production',
  usesFirebaseAuth: extra.authProvider === 'firebase',
  usesPreviewAuth: (extra.authProvider ?? 'preview') === 'preview',
  usesFirebaseProductData: (extra.productDataProvider ?? (extra.authProvider === 'firebase' ? 'firebase' : 'preview')) === 'firebase',
  usesPreviewProductData: (extra.productDataProvider ?? (extra.authProvider === 'firebase' ? 'firebase' : 'preview')) === 'preview',
  usesFirebaseAuthEmulator: extra.firebaseAuthTarget === 'emulator' && extra.appVariant === 'development',
  usesFirestoreEmulator: extra.firestoreTarget === 'emulator' && extra.appVariant === 'development',
  isDemoMode: process.env.EXPO_PUBLIC_DEMO_MODE === 'true',
  get canUsePreviewTools() {
    return this.isDevelopmentBuild && this.isDemoMode;
  },
  get canShowFirebaseTestHelpers() {
    return this.isDevelopmentBuild && this.usesFirebaseAuth && this.isDemoMode;
  },
};
