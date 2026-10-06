import { BRAND } from '@food/config';
import { loginSchema } from '@food/validation';
import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { type ScrollView, StyleSheet, type TextInput, View } from 'react-native';
import { Button, FormScrollView, Input, PressableScale, revealEnd, Screen, ScreenHeader, Text } from '@/components/ui';
import { colors, gutter, radius, spacing } from '@/constants/theme';
import { useAuthSuccess } from '@/features/auth/useAuthSuccess';
import { useZodForm } from '@/features/auth/useZodForm';
import { friendlyMessage } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { login } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

export default function LoginScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const form = useZodForm(loginSchema, { email: '', password: '' });
  const onSuccess = useAuthSuccess(returnTo);
  const passwordRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const mutation = useMutation({
    mutationFn: login,
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

  return (
    <Screen edges={['top', 'bottom']} background={colors.warmWhite}>
      <ScreenHeader back closeIcon />
      <FormScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.content}>
          <View style={styles.intro}>
            <Text variant="overline" color={colors.accentText}>
              {BRAND.name}
            </Text>
            <Text variant="display">Welcome back</Text>
            <Text variant="body" color={colors.textMuted}>
              Sign in to order, track deliveries and reorder your favourites.
            </Text>
          </View>

          {sessionExpired && (
            <View style={styles.notice}>
              <Text variant="bodySm">Your session expired. Please sign in again.</Text>
            </View>
          )}

          <View style={styles.form}>
            <Input
              label="Email"
              icon="mail-outline"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              value={form.values.email}
              onChangeText={(t) => form.set('email', t)}
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={form.errors.email}
            />
            <Input
              onFocus={() => revealEnd(scrollRef)}
              ref={passwordRef}
              label="Password"
              icon="lock-closed-outline"
              placeholder="Your password"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              value={form.values.password}
              onChangeText={(t) => form.set('password', t)}
              onSubmitEditing={submit}
              error={form.errors.password}
            />
            {mutation.error && !Object.keys(form.errors).some((k) => form.errors[k]) && (
              <Text variant="bodySm" color={colors.danger} accessibilityLiveRegion="polite">
                {friendlyMessage(mutation.error)}
              </Text>
            )}
            <Button label="Sign In" size="lg" fullWidth loading={mutation.isPending} onPress={submit} />
          </View>

          <PressableScale
            onPress={() => router.replace({ pathname: '/register', params: returnTo ? { returnTo } : {} })}
            accessibilityLabel="Create an account"
            style={styles.switch}
          >
            <Text variant="bodySm" color={colors.textMuted}>
              New to {BRAND.name}?{' '}
              <Text variant="bodySm" color={colors.accentText} style={styles.link}>
                Create an account
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
  notice: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.warningBg },
  form: { gap: spacing.lg },
  switch: { alignItems: 'center', padding: spacing.md },
  link: { fontFamily: 'Manrope_700Bold' },
});
