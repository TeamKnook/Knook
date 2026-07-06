import Constants from 'expo-constants';

type AppVariant = 'development' | 'production';

const extra = (Constants.expoConfig?.extra ?? {}) as { appVariant?: AppVariant };

export const appEnvironment = {
  variant: extra.appVariant ?? 'production',
  isDevelopmentBuild: extra.appVariant === 'development',
  isDemoMode: process.env.EXPO_PUBLIC_DEMO_MODE === 'true',
  get canUsePreviewTools() {
    return this.isDevelopmentBuild && this.isDemoMode;
  },
};
