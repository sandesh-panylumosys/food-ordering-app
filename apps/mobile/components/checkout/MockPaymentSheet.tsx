import { formatPrice } from '@food/config';
import type { CheckoutSession } from '@food/shared-types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Text, toast } from '@/components/ui';
import { colors, gutter, radius, shadows, spacing } from '@/constants/theme';
import type { RazorpayMessage } from '@/features/checkout/razorpayHtml';
import { friendlyMessage } from '@/lib/errors';
import { authorizeMockPayment } from '@/services/payment.service';

interface MockPaymentSheetProps {
  session: CheckoutSession;
  onResult: (msg: RazorpayMessage) => void;
}

/**
 * Stand-in for the Razorpay sheet when the backend runs with PAYMENT_PROVIDER=mock
 * (local development only). "Pay" asks the backend for a signed result, which then
 * goes through the exact same /payments/verify path as a real payment.
 */
export function MockPaymentSheet({ session, onResult }: MockPaymentSheetProps) {
  const authorize = useMutation({
    mutationFn: () => authorizeMockPayment(session.orderId),
    onSuccess: (r) =>
      onResult({ type: 'success', orderId: r.razorpayOrderId, paymentId: r.razorpayPaymentId, signature: r.razorpaySignature }),
    onError: (e) => toast.error(friendlyMessage(e)),
  });

  const amount = formatPrice(session.amountPaise / 100);

  return (
    <View style={styles.root}>
      <View style={styles.banner} accessibilityRole="alert">
        <Ionicons name="flask-outline" size={16} color={colors.warning} />
        <Text variant="caption" color={colors.warning} style={styles.flex}>
          Test mode — simulated payment. No money is charged.
        </Text>
      </View>

      <Animated.View entering={FadeInDown.duration(320)} style={styles.card}>
        <Text variant="overline" color={colors.accentText}>
          {session.businessName}
        </Text>
        <Text variant="display">{amount}</Text>
        <Text variant="body" color={colors.textMuted}>
          {session.description} · {session.prefill.email}
        </Text>
        <View style={styles.method}>
          <Ionicons name="phone-portrait-outline" size={20} color={colors.espresso} />
          <View style={styles.flex}>
            <Text variant="title">Simulated UPI</Text>
            <Text variant="caption" color={colors.textMuted}>
              Replaced by Razorpay Checkout when real keys are configured
            </Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.actions}>
        <Button
          size="lg"
          fullWidth
          icon="lock-closed"
          label={`Pay ${amount}`}
          loading={authorize.isPending}
          onPress={() => authorize.mutate()}
        />
        <Button
          variant="secondary"
          fullWidth
          label="Simulate a failed payment"
          disabled={authorize.isPending}
          onPress={() => {
            onResult({ type: 'failed', code: 'MOCK_DECLINED', description: 'Simulated decline (test mode)' });
            toast.error('Payment failed (simulated). Try again or close to cancel.');
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: gutter, paddingTop: spacing.md, gap: spacing.xl },
  flex: { flex: 1 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningBg,
  },
  card: {
    padding: spacing.xxl,
    gap: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.espresso,
  },
  actions: { marginTop: 'auto', paddingBottom: spacing.xl, gap: spacing.md },
});
