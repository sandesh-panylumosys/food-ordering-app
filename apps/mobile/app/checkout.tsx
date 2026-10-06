import { calculateOrderTotals, formatPrice, PREP_TIME } from '@food/config';
import type { CreateOrderInput } from '@food/validation';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AddressCard } from '@/components/checkout/AddressCard';
import { PriceBreakdown } from '@/components/cart/PriceBreakdown';
import { BottomBar, Button, FormScrollView, Input, KeyboardAvoider, PressableScale, Screen, ScreenHeader, Sheet, Skeleton, Text, toast, VegIndicator } from '@/components/ui';
import { colors, gutter, radius, spacing } from '@/constants/theme';
import { defaultAddress, useAddresses } from '@/features/addresses/hooks';
import { useCartQuote } from '@/features/cart/useCartQuote';
import { friendlyMessage, isApiError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { createCheckout, retryCheckout } from '@/services/payment.service';
import { useAuthStore } from '@/store/auth.store';
import { toCartInput, useCartStore, useCartSubtotal } from '@/store/cart.store';
import { useCheckoutStore } from '@/store/checkout.store';

class AlreadyPaidError extends Error {
  constructor(readonly orderId: string) {
    super('Order already paid');
  }
}

function Section({ step, title, children, action }: { step: number; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.step}>
          <Text variant="caption" color={colors.textOnDark}>
            {step}
          </Text>
        </View>
        <Text variant="h3" style={styles.flex} accessibilityRole="header">
          {title}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}

export default function CheckoutScreen() {
  const status = useAuthStore((s) => s.status);
  const lines = useCartStore((s) => s.lines);
  const localSubtotal = useCartSubtotal();
  const quote = useCartQuote();
  const addresses = useAddresses();
  const qc = useQueryClient();
  const { session: existingSession, signature: existingSignature, start, reset: resetCheckout } = useCheckoutStore();
  const clearCart = useCartStore((s) => s.clear);

  const [addressId, setAddressId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const selected = addresses.data?.find((a) => a.id === addressId) ?? defaultAddress(addresses.data);
  const totals = quote.data?.totals ?? calculateOrderTotals(localSubtotal);
  const hasIssues = (quote.data?.issues.length ?? 0) > 0;

  const placeOrder = useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const signature = JSON.stringify(input);
      // Backing out of payment and returning with the same cart reuses the unpaid
      // order — but re-validate it first: it may have been paid (via webhook) or
      // cancelled in the meantime.
      if (existingSession && existingSignature === signature) {
        try {
          return { session: await retryCheckout(existingSession.orderId), signature };
        } catch (error) {
          if (isApiError(error, 'CONFLICT')) throw new AlreadyPaidError(existingSession.orderId);
          resetCheckout();
        }
      }
      return { session: await createCheckout(input), signature };
    },
    onSuccess: ({ session, signature }) => {
      start(session, signature);
      router.push('/payment');
    },
    onError: (error) => {
      haptics.error();
      if (error instanceof AlreadyPaidError) {
        resetCheckout();
        clearCart();
        toast.info('This order has already been paid.');
        router.replace(`/orders/${error.orderId}`);
        return;
      }
      if (isApiError(error, 'PRODUCT_UNAVAILABLE') || isApiError(error, 'INVALID_CUSTOMIZATION')) {
        void qc.invalidateQueries({ queryKey: ['quote'] });
      }
      toast.error(friendlyMessage(error, 'We couldn’t create your order. Please try again.'));
    },
  });

  if (status === 'guest') return <Redirect href={{ pathname: '/login', params: { returnTo: '/checkout' } }} />;
  if (lines.length === 0 && !placeOrder.isPending) return <Redirect href="/cart" />;

  const submit = () => {
    if (!selected) {
      toast.error('Please add a delivery address');
      return;
    }
    const input = { items: toCartInput(lines), addressId: selected.id, notes: notes.trim() || null };
    haptics.medium();
    placeOrder.mutate(input);
  };

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="Checkout" subtitle={`${lines.length} ${lines.length === 1 ? 'dish' : 'dishes'} · ${PREP_TIME.min}–${PREP_TIME.max} min`} />
      <KeyboardAvoider>
        <FormScrollView contentContainerStyle={styles.content}>
          <Section
            step={1}
            title="Delivery Address"
            action={
              selected ? (
                <PressableScale onPress={() => setPickerOpen(true)} accessibilityLabel="Change delivery address" style={styles.link}>
                  <Text variant="caption" color={colors.accentText}>
                    Change
                  </Text>
                </PressableScale>
              ) : null
            }
          >
            {addresses.isPending ? (
              <Skeleton height={96} rounded={radius.lg} />
            ) : selected ? (
              <AddressCard address={selected} selected />
            ) : (
              <PressableScale
                onPress={() => router.push({ pathname: '/addresses/form', params: { returnTo: 'checkout' } })}
                accessibilityLabel="Add a delivery address"
                style={styles.addAddress}
              >
                <Ionicons name="add-circle-outline" size={22} color={colors.accentText} />
                <Text variant="title" color={colors.accentText}>
                  Add delivery address
                </Text>
              </PressableScale>
            )}
          </Section>

          <Section step={2} title="Order Items">
            <View style={styles.items}>
              {lines.map((line) => (
                <View key={line.key} style={styles.item}>
                  <VegIndicator isVeg={line.isVeg} size={12} />
                  <View style={styles.flex}>
                    <Text variant="body" numberOfLines={1}>
                      {line.quantity} × {line.name}
                    </Text>
                    {line.optionsLabel ? (
                      <Text variant="caption" color={colors.textMuted} numberOfLines={1}>
                        {line.optionsLabel}
                      </Text>
                    ) : null}
                  </View>
                  <Text variant="body">{formatPrice(Math.round(line.unitPrice * line.quantity * 100) / 100)}</Text>
                </View>
              ))}
            </View>
            <Input
              placeholder="Cooking instructions (optional)"
              icon="create-outline"
              value={notes}
              onChangeText={setNotes}
              maxLength={300}
              accessibilityLabel="Cooking instructions"
            />
          </Section>

          <Section step={3} title="Price Breakdown">
            <PriceBreakdown totals={totals} estimate={!quote.data} />
            {hasIssues && (
              <Text variant="bodySm" color={colors.danger}>
                {quote.data?.issues[0]?.message}. Please update your cart.
              </Text>
            )}
          </Section>

          <Section step={4} title="Payment Method">
            <View style={styles.payment}>
              <View style={styles.paymentIcon}>
                <Ionicons name="shield-checkmark" size={20} color={colors.espresso} />
              </View>
              <View style={styles.flex}>
                <Text variant="title">Pay securely with Razorpay</Text>
                <Text variant="caption" color={colors.textMuted}>
                  UPI · Cards · Netbanking · Wallets
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={22} color={colors.espresso} />
            </View>
          </Section>
        </FormScrollView>

      <BottomBar>
        <Button
          size="lg"
          fullWidth
          label={`Place Order · ${formatPrice(totals.total)}`}
          icon="lock-closed"
          loading={placeOrder.isPending}
          disabled={!selected || hasIssues || quote.isPending}
          onPress={submit}
        />
      </BottomBar>
      </KeyboardAvoider>

      <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Deliver to">
        <ScrollView contentContainerStyle={styles.sheetList}>
          {addresses.data?.map((a) => (
            <AddressCard
              key={a.id}
              address={a}
              selected={a.id === selected?.id}
              onPress={() => {
                haptics.selection();
                setAddressId(a.id);
                setPickerOpen(false);
              }}
            />
          ))}
          <Button
            label="Add new address"
            variant="secondary"
            icon="add"
            onPress={() => {
              setPickerOpen(false);
              router.push({ pathname: '/addresses/form', params: { returnTo: 'checkout' } });
            }}
          />
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingTop: spacing.md, paddingBottom: spacing.xxxl, gap: spacing.xxl },
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  step: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { padding: spacing.sm },
  addAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 72,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.caramel,
    backgroundColor: colors.warmWhite,
  },
  items: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  payment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.espresso,
  },
  paymentIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  sheetList: { gap: spacing.md, paddingBottom: spacing.md },
});
