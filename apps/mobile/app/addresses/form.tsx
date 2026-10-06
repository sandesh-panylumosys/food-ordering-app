import type { AddressInput } from '@food/validation';
import { addressSchema } from '@food/validation';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { BottomBar, Button, FormScrollView, Input, KeyboardAvoider, PressableScale, Screen, ScreenHeader, Text, toast } from '@/components/ui';
import { colors, gutter, radius, spacing } from '@/constants/theme';
import { useAddresses, useSaveAddress } from '@/features/addresses/hooks';
import { useZodForm } from '@/features/auth/useZodForm';
import { friendlyMessage } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { useAuthStore } from '@/store/auth.store';

const LABELS = ['Home', 'Work', 'Other'];

export default function AddressFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string; returnTo?: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: addresses } = useAddresses();
  const existing = addresses?.find((a) => a.id === id);
  const save = useSaveAddress();

  const initial: AddressInput = {
    label: 'Home',
    recipientName: user?.name ?? '',
    phone: user?.phone ?? '',
    line1: '',
    line2: null,
    landmark: null,
    city: '',
    state: '',
    postalCode: '',
    isDefault: !addresses?.length,
  };
  const form = useZodForm(addressSchema, initial);

  useEffect(() => {
    if (existing) {
      const { id: _id, createdAt: _c, ...fields } = existing;
      form.setValues(fields);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const submit = () => {
    const data = form.validate();
    if (!data) {
      haptics.error();
      return;
    }
    save.mutate(
      { id, input: data },
      {
        onSuccess: () => {
          haptics.success();
          toast.success(id ? 'Address updated' : 'Address saved');
          router.back();
        },
        onError: (e) => {
          if (!form.applyApiError(e)) toast.error(friendlyMessage(e));
        },
      },
    );
  };

  const field = (key: keyof AddressInput) => ({
    value: (form.values[key] as string | null | undefined) ?? '',
    onChangeText: (t: string) => form.set(key, t as never),
    error: form.errors[key],
  });

  return (
    <Screen edges={['top']}>
      <ScreenHeader title={id ? 'Edit Address' : 'New Address'} />
      <KeyboardAvoider>
        <FormScrollView contentContainerStyle={styles.content}>
          <View style={styles.labels} accessibilityRole="radiogroup">
            {LABELS.map((l) => {
              const on = form.values.label === l;
              return (
                <PressableScale
                  key={l}
                  onPress={() => form.set('label', l)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  style={[styles.label, on && styles.labelOn]}
                >
                  <Text variant="caption" color={on ? colors.textOnDark : colors.text}>
                    {l}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
          <Input label="Recipient name" autoComplete="name" {...field('recipientName')} />
          <Input label="Phone" keyboardType="phone-pad" autoComplete="tel" {...field('phone')} />
          <Input label="House / flat, street" autoComplete="street-address" {...field('line1')} />
          <Input label="Area (optional)" {...field('line2')} />
          <Input label="Landmark (optional)" {...field('landmark')} />
          <View style={styles.row}>
            <View style={styles.flex}>
              <Input label="City" autoComplete="postal-address-locality" {...field('city')} />
            </View>
            <View style={styles.flex}>
              <Input label="PIN code" keyboardType="number-pad" maxLength={6} autoComplete="postal-code" {...field('postalCode')} />
            </View>
          </View>
          <Input label="State" autoComplete="postal-address-region" {...field('state')} />
          <View style={styles.switchRow}>
            <Text variant="body" style={styles.flex}>
              Set as default address
            </Text>
            <Switch
              value={Boolean(form.values.isDefault)}
              onValueChange={(v) => form.set('isDefault', v)}
              trackColor={{ true: colors.espresso, false: colors.borderStrong }}
              thumbColor={colors.white}
              accessibilityLabel="Set as default address"
            />
          </View>
        </FormScrollView>
        <BottomBar>
          <Button label={id ? 'Save changes' : 'Save address'} size="lg" fullWidth loading={save.isPending} onPress={submit} />
        </BottomBar>
      </KeyboardAvoider>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingBottom: spacing.xxxl, gap: spacing.lg },
  labels: { flexDirection: 'row', gap: spacing.sm },
  label: {
    paddingHorizontal: spacing.lg,
    height: 38,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  labelOn: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  row: { flexDirection: 'row', gap: spacing.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
});
