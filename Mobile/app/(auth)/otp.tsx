import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer, SectionHeader, PrimaryButton, GhostButton, TextInputField } from '@/src/components';
import { authService } from '@/src/services/auth/authService';
import { firestoreService } from '@/src/services/firestore/firestoreService';
import { colors, spacing, typography } from '@/src/theme';
import { appEnvironment } from '@/src/utils/environment';

export default function OtpScreen() {
  const router = useRouter();
  const { phone, verificationId, devCode } = useLocalSearchParams<{
    phone: string;
    verificationId: string;
    devCode?: string;
  }>();

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onVerify = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code');
      return;
    }
    try {
      setSubmitting(true);
      const res = await authService.verifyOtp(phone, verificationId, code);
      if (res.onboardingCompleted) {
        router.replace('/(tabs)/crushes');
      } else {
        // ensure profile doc exists before onboarding screen reads it
        try { await firestoreService.getMe(); } catch { /* ignore */ }
        router.replace('/(onboarding)/profile');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not verify');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer testID="otp-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.body}>
          <SectionHeader
            eyebrow="Step 2 of 2"
            title="Enter the 6-digit code"
            subtitle={`Sent to ${phone}.`}
          />

          <TextInputField
            testID="otp-input"
            label="Verification code"
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            autoFocus
            maxLength={6}
            error={error}
          />

          {appEnvironment.canUsePreviewTools && devCode ? (
            <Text style={styles.devHint} testID="otp-dev-code">
              Dev code: {devCode}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            testID="otp-verify-button"
            label="Verify"
            onPress={onVerify}
            loading={submitting}
          />
          <GhostButton
            testID="otp-back-button"
            label="Change number"
            onPress={() => router.back()}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { flex: 1, gap: spacing.lg, paddingTop: spacing.xl },
  devHint: { ...typography.caption, color: colors.knookPurple },
  footer: { paddingBottom: spacing.lg, gap: spacing.sm },
});
