import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '@/src/services/auth/authService';
import { userProfileService } from '@/src/services/firestore/userProfileService';
import { appEnvironment } from '@/src/utils/environment';
import { colors, spacing, typography } from '@/src/theme';

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const uid = await authService.getCurrentUid();
      if (!uid) {
        router.replace('/(auth)/phone');
        return;
      }
      try {
        if (!appEnvironment.usesFirebaseAuth) {
          const { firestoreService } = await import('@/src/services/firestore/firestoreService');
          const me = await firestoreService.getMe();
          router.replace(me.onboardingCompleted ? '/(tabs)/crushes' : '/(onboarding)/profile');
          return;
        }
        const me = await userProfileService.getCurrentUserProfile(uid)
          ?? await userProfileService.createUserProfileFromAuth();
        if (!me.onboardingCompleted) {
          router.replace('/(onboarding)/profile');
        } else {
          router.replace('/(tabs)/crushes');
        }
      } catch {
        router.replace('/(auth)/phone');
      }
    })();
  }, [router]);

  return (
    <View style={styles.container} testID="splash-screen">
      <Text style={styles.eyebrow}>k n o o k</Text>
      <Text style={styles.title}>Secrets, served at 6:30.</Text>
      <ActivityIndicator color={colors.knookYellow} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.knookPurple,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.knookYellow,
    letterSpacing: 8,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.display,
    color: colors.knookOffWhite,
    textAlign: 'center',
    fontSize: 36,
  },
  loader: { marginTop: spacing.xl },
});
