import { ACTIVE_ORDER_STATUSES, formatPrice } from '@food/config';
import type { OrderStatus } from '@food/shared-types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { PriceBreakdown } from '@/components/cart/PriceBreakdown';
import { formatAddress } from '@/components/checkout/AddressCard';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { OrderStatusBadge } from '@/components/orders/StatusBadge';
import { FoodImage } from '@/components/product/FoodImage';
import { BottomBar, Button, ErrorState, Screen, ScreenHeader, Skeleton, Text, toast, VegIndicator } from '@/components/ui';
import { colors, gutter, radius, spacing } from '@/constants/theme';
import { useCancelOrder, useOrder } from '@/features/orders/hooks';
import { useRefresh } from '@/hooks/useRefresh';
import { friendlyMessage } from '@/lib/errors';
import { formatDateTime } from '@/lib/format';
import { retryCheckout } from '@/services/payment.service';
import { useCheckoutStore } from '@/store/checkout.store';

const HEADLINES: Record<OrderStatus, string> = {
  PENDING: 'Order placed',
  CONFIRMED: 'Order confirmed',
  PREPARING: 'Being prepared',
  READY: 'Ready to go',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Order cancelled',
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text variant="overline" color={colors.accentText}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isPending, error, refetch } = useOrder(id);
  const { refreshing, onRefresh } = useRefresh(refetch);
  const cancel = useCancelOrder();
  const startCheckout = useCheckoutStore((s) => s.start);

  const pay = useMutation({
    mutationFn: retryCheckout,
    onSuccess: (session) => {
      startCheckout(session, null);
      router.push('/payment');
    },
    onError: (e) => toast.error(friendlyMessage(e)),
  });

  if (isPending) {
    return (
      <Screen>
        <ScreenHeader title="Order" />
        <View style={styles.content}>
          <Skeleton height={260} rounded={radius.lg} />
          <Skeleton height={160} rounded={radius.lg} />
        </View>
      </Screen>
    );
  }
  if (error || !order) {
    return (
      <Screen>
        <ScreenHeader title="Order" />
        <ErrorState error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  const awaitingPayment = order.status === 'PENDING' && order.paymentStatus !== 'PAID';
  const live = ACTIVE_ORDER_STATUSES.includes(order.status);
  const payment = order.payments?.find((p) => p.status === 'PAID') ?? order.payments?.[0];

  const confirmCancel = () =>
    Alert.alert('Cancel this order?', 'You haven’t been charged for this order.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: () =>
          cancel.mutate(order.id, {
            onSuccess: () => toast.info('Order cancelled'),
            onError: (e) => toast.error(friendlyMessage(e)),
          }),
      },
    ]);

  return (
    <Screen>
      <ScreenHeader title={`Order #${order.orderNumber}`} subtitle={formatDateTime(order.createdAt)} onBack={() => (router.canGoBack() ? router.back() : router.replace('/orders'))} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.caramel} />}
      >
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.flex}>
              <Text variant="h2">{awaitingPayment ? 'Awaiting payment' : HEADLINES[order.status]}</Text>
              {live && (
                <Text variant="bodySm" color={colors.textMuted}>
                  Estimated {order.estimatedMinutes.min}–{order.estimatedMinutes.max} min · updates automatically
                </Text>
              )}
              {awaitingPayment && (
                <Text variant="bodySm" color={colors.textMuted}>
                  {order.paymentStatus === 'FAILED' ? 'Your last payment attempt didn’t go through.' : 'Complete payment to send this order to the kitchen.'}
                </Text>
              )}
            </View>
            <OrderStatusBadge order={order} />
          </View>
          {order.status === 'CANCELLED' ? (
            <View style={styles.cancelled}>
              <Ionicons name="close-circle" size={20} color={colors.danger} />
              <Text variant="bodySm" color={colors.danger} style={styles.flex}>
                {order.statusHistory.at(-1)?.note ??
                  (order.paymentStatus === 'PAID' ? 'This order was cancelled. Any payment will be refunded.' : 'This order was cancelled.')}
              </Text>
            </View>
          ) : (
            !awaitingPayment && <OrderTimeline order={order} />
          )}
        </View>

        <Card title={`${order.itemCount} ${order.itemCount === 1 ? 'item' : 'items'}`}>
          {order.items.map((item) => (
            <View key={item.id} style={styles.item}>
              <FoodImage uri={item.productImageUrl} width={52} style={styles.thumb} />
              <View style={styles.flex}>
                <View style={styles.itemTitle}>
                  <VegIndicator isVeg={item.isVeg} size={12} />
                  <Text variant="body" numberOfLines={1} style={styles.flex}>
                    {item.quantity} × {item.productName}
                  </Text>
                </View>
                {item.selectedOptions.length > 0 && (
                  <Text variant="caption" color={colors.textMuted}>
                    {item.selectedOptions.map((o) => o.optionName).join(' · ')}
                  </Text>
                )}
              </View>
              <Text variant="body">{formatPrice(item.lineTotal)}</Text>
            </View>
          ))}
          {order.notes ? (
            <Text variant="bodySm" color={colors.textMuted}>
              Note: {order.notes}
            </Text>
          ) : null}
        </Card>

        <PriceBreakdown totals={order} />

        <Card title="Delivering to">
          <Text variant="title">{order.deliveryAddress.label}</Text>
          <Text variant="bodySm" color={colors.textMuted}>
            {formatAddress(order.deliveryAddress)}
          </Text>
          <Text variant="caption" color={colors.textSubtle}>
            {order.deliveryAddress.recipientName} · {order.deliveryAddress.phone}
          </Text>
        </Card>

        {payment && (
          <Card title="Payment">
            <View style={styles.paymentRow}>
              <Ionicons
                name={payment.status === 'PAID' ? 'checkmark-circle' : payment.status === 'FAILED' ? 'alert-circle' : 'time-outline'}
                size={18}
                color={payment.status === 'PAID' ? colors.success : payment.status === 'FAILED' ? colors.danger : colors.textMuted}
              />
              <Text variant="body" style={styles.flex}>
                {payment.status === 'PAID'
                  ? `Paid${payment.method ? ` via ${payment.method.toUpperCase()}` : ''}`
                  : payment.status === 'FAILED'
                    ? 'Payment failed'
                    : 'Payment pending'}
              </Text>
              <Text variant="body">{formatPrice(payment.amountPaise / 100)}</Text>
            </View>
            {payment.razorpayPaymentId && (
              <Text variant="caption" color={colors.textSubtle} selectable>
                Ref: {payment.razorpayPaymentId}
              </Text>
            )}
          </Card>
        )}
      </ScrollView>

      {awaitingPayment && (
        <BottomBar>
          <Button size="lg" fullWidth label={`Complete Payment · ${formatPrice(order.total)}`} icon="lock-closed" loading={pay.isPending} onPress={() => pay.mutate(order.id)} />
          <Button label="Cancel order" variant="ghost" loading={cancel.isPending} onPress={confirmCancel} />
        </BottomBar>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingBottom: spacing.huge, gap: spacing.lg },
  statusCard: { padding: spacing.xl, gap: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.warmWhite, borderWidth: 1, borderColor: colors.border },
  statusHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cancelled: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.dangerBg },
  card: { padding: spacing.lg, gap: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  thumb: { width: 52, height: 52, borderRadius: radius.sm },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
