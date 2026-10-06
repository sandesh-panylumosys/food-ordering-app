import { BRAND } from '@food/config';
import { registerSchema } from '@food/validation';
import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { type ScrollView, StyleSheet, View } from 'react-native';
import { Button, FormScrollView, Input, PressableScale, revealEnd, Screen, ScreenHeader, Text } from '@/components/ui';
import { colors, gutter, spacing } from '@/constants/theme';
import { useAuthSuccess } from '@/features/auth/useAuthSuccess';
import { useZodForm } from '@/features/auth/useZodForm';
import { friendlyMessage } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { register } from '@/services/auth.service';

export default function RegisterScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const form = useZodForm(registerSchema, { name: '', email: '', password: '', phone: undefined });
  const onSuccess = useAuthSuccess(returnTo);
  const scrollRef = useRef<ScrollView>(null);

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: async (auth) => {
      haptics.success();
      await onSuccess(auth);
    },
    onError: (error) => {
      haptics.error();
      form.applyApiError(error);
    },
  });

  const submit = () => {
    const data = form.validate();
    if (data) mutation.mutate(data);
  };

  const hasFieldErrors = Object.values(form.errors).some(Boolean);

  return (
    <Screen edges={['top', 'bottom']} background={colors.warmWhite}>
      <ScreenHeader back closeIcon />
      <FormScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.content}>
          <View style={styles.intro}>
            <Text variant="overline" color={colors.accentText}>
              Join {BRAND.name}
            </Text>
            <Text variant="display">Create account</Text>
            <Text variant="body" color={colors.textMuted}>
              Fresh food, a few taps away.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full name"
              icon="person-outline"
              placeholder="Asha Rao"
              autoComplete="name"
              textContentType="name"
              value={form.values.name}
              onChangeText={(t) => form.set('name', t)}
              error={form.errors.name}
            />
            <Input
              label="Email"
              icon="mail-outline"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              value={form.values.email}
              onChangeText={(t) => form.set('email', t)}
              error={form.errors.email}
            />
            <Input
              label="Phone (optional)"
              icon="call-outline"
              placeholder="98765 43210"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              value={form.values.phone ?? ''}
              onChangeText={(t) => form.set('phone', t.replace(/\s/g, '') || undefined)}
              error={form.errors.phone}
            />
            <Input
              onFocus={() => revealEnd(scrollRef)}
              label="Password"
              icon="lock-closed-outline"
              placeholder="At least 8 characters"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              value={form.values.password}
              onChangeText={(t) => form.set('password', t)}
              onSubmitEditing={submit}
              error={form.errors.password}
            />
            {mutation.error && !hasFieldErrors && (
              <Text variant="bodySm" color={colors.danger} accessibilityLiveRegion="polite">
                {friendlyMessage(mutation.error)}
              </Text>
            )}
            <Button label="Create Account" size="lg" fullWidth loading={mutation.isPending} onPress={submit} />
          </View>

          <PressableScale
            onPress={() => router.replace({ pathname: '/login', params: returnTo ? { returnTo } : {} })}
            accessibilityLabel="Sign in instead"
            style={styles.switch}
          >
            <Text variant="bodySm" color={colors.textMuted}>
              Already have an account?{' '}
              <Text variant="bodySm" color={colors.accentText} style={styles.link}>
                Sign in
              </Text>
            </Text>
          </PressableScale>
      </FormScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingBottom: spacing.xxxl, gap: spacing.xxl },
  intro: { gap: spacing.sm, paddingTop: spacing.lg },
  form: { gap: spacing.lg },
  switch: { alignItems: 'center', padding: spacing.md },
  link: { fontFamily: 'Manrope_700Bold' },
});
