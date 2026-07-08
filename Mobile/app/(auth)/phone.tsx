import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer, SectionHeader, PrimaryButton, TextInputField } from '@/src/components';
import { authService } from '@/src/services/auth/authService';
import { colors, spacing, typography } from '@/src/theme';
import { normalizePhone } from '@/src/utils/normalizePhone';

export default function PhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onContinue = async () => {
    if (submitting) return;
    setError(null);
    const normalized = normalizePhone(phone);
    if (normalized.replace(/\D/g, '').length < 8) {
      setError('Enter a valid phone number');
      return;
    }
    try {
      setSubmitting(true);
      const res = await authService.requestOtp(normalized);
      router.push({
        pathname: '/(auth)/otp',
        params: { phone: normalized, verificationId: res.verificationId, devCode: res.devCode },
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer testID="phone-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.body}>
          <SectionHeader
            eyebrow="Step 1 of 2"
            title="What's your number?"
            subtitle="We use it to match you anonymously with people from your contacts. Your number is never shown."
          />

          <TextInputField
            testID="phone-input"
            label="Phone number"
            placeholder="Include country code"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoFocus
            error={error}
          />

          <Text style={styles.privacy}>
            We hash your number locally. We never upload your contacts.
          </Text>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            testID="phone-continue-button"
            label="Send code"
            onPress={onContinue}
            loading={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { flex: 1, gap: spacing.lg, paddingTop: spacing.xl },
  privacy: { ...typography.caption, color: colors.knookMidGrey },
  footer: { paddingBottom: spacing.lg },
});
