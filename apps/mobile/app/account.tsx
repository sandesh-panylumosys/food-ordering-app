import { updateProfileSchema } from '@food/validation';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { BottomBar, Button, FormScrollView, Input, KeyboardAvoider, Screen, ScreenHeader, Text, toast } from '@/components/ui';
import { colors, gutter, spacing } from '@/constants/theme';
import { friendlyMessage, isApiError } from '@/lib/errors';
import { updateMe } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

export default function AccountScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (u) => {
      setUser(u);
      toast.success('Profile updated');
      router.back();
    },
    onError: (e) => (isApiError(e) && Object.keys(e.fields).length ? setErrors(e.fields) : toast.error(friendlyMessage(e))),
  });

  const submit = () => {
    const parsed = updateProfileSchema.safeParse({ name, phone: phone.trim() ? phone.replace(/\s/g, '') : null });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0] ?? '_'), i.message])));
      return;
    }
    mutation.mutate(parsed.data);
  };

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="Account" />
      <KeyboardAvoider>
        <FormScrollView contentContainerStyle={styles.content}>
          <Input label="Full name" value={name} onChangeText={setName} error={errors.name} autoComplete="name" />
          <Input label="Phone" value={phone} onChangeText={setPhone} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" />
          <Input label="Email" value={user?.email ?? ''} editable={false} hint="Contact support to change your email." />
          <Text variant="caption" color={colors.textSubtle}>
            Your password is securely hashed — we never store or see it.
          </Text>
        </FormScrollView>
        <BottomBar>
          <Button label="Save changes" size="lg" fullWidth loading={mutation.isPending} onPress={submit} />
        </BottomBar>
      </KeyboardAvoider>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, paddingTop: spacing.sm, gap: spacing.lg },
});
